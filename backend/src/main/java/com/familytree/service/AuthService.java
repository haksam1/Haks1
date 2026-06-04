package com.familytree.service;

import com.familytree.dto.request.LoginRequest;
import com.familytree.dto.request.RegisterRequest;
import com.familytree.dto.response.AuthResponse;
import com.familytree.exception.UnauthorizedException;
import com.familytree.dto.request.ChangePasswordRequest;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.exception.BadRequestException;
import com.familytree.model.*;
import com.familytree.repository.*;
import com.familytree.security.JwtTokenProvider;
import com.familytree.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RoleRepository roleRepository;
    private final FamilyTreeRepository treeRepository;
    private final PersonRepository personRepository;
    private final ActivityLogRepository activityLogRepository;
    private final InvitationRepository invitationRepository;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new UnauthorizedException("Email already in use");
        }

        // Bootstrap default roles if needed
        bootstrapRoles();

        Role familyHeadRole = roleRepository.findByName("Family Head")
                .orElseThrow(() -> new IllegalStateException("Family Head role not configured"));

        // 1. Create User account
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(familyHeadRole)
                .isTemporaryPassword(false)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // 2. Create FamilyTree owned by User
        FamilyTree tree = FamilyTree.builder()
                .name(req.getLastName() + " Family Tree")
                .owner(user)
                .build();
        tree = treeRepository.save(tree);

        // 3. Create Person profile for Family Head
        Person person = Person.builder()
                .tree(tree)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .birthDate(req.getBirthDate())
                .deathDate(req.getDeathDate())
                .gender(req.getGender())
                .photoUrl(req.getPhotoUrl())
                .phoneNumber(req.getPhoneNumber())
                .email(req.getEmail())
                .createdBy(user.getId())
                .modifyPermission("SELF_AND_ADMIN")
                .build();
        person = personRepository.save(person);

        // Link User to Person
        user.setPersonId(person.getId());
        user = userRepository.save(user);

        // Log registration
        activityLogRepository.save(ActivityLog.builder()
                .userId(user.getId())
                .userName(user.getName())
                .action("Registered as Family Head and created tree: " + tree.getName())
                .build());

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = tokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(familyHeadRole.getName())
                .permissions(familyHeadRole.getPermissions())
                .personId(person.getId())
                .isTemporaryPassword(false)
                .isActive(true)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        // Bootstrap roles and admin if needed
        bootstrapRoles();
        bootstrapAdmin();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String token = tokenProvider.generateToken(userDetails);

        Set<String> perms = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        // Log login activity
        activityLogRepository.save(ActivityLog.builder()
                .userId(userDetails.getId())
                .userName(userDetails.getName())
                .action("Logged in")
                .build());

        return AuthResponse.builder()
                .token(token)
                .id(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .role(userDetails.getRole())
                .permissions(perms)
                .personId(userDetails.getPersonId())
                .isTemporaryPassword(userDetails.isTemporaryPassword())
                .isActive(userDetails.isActive())
                .build();
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setTemporaryPassword(false);
        user.setActive(true);
        userRepository.save(user);

        if (user.getPersonId() != null) {
            invitationRepository.findByPersonId(user.getPersonId())
                    .ifPresent(inv -> {
                        inv.setStatus("ACCEPTED");
                        invitationRepository.save(inv);
                    });
        }

        activityLogRepository.save(ActivityLog.builder()
                .userId(user.getId())
                .userName(user.getName())
                .action("Forced temporary password change completed successfully")
                .build());
    }

    private void bootstrapRoles() {
        if (!roleRepository.findByName("System Owner").isPresent()) {
            roleRepository.save(Role.builder()
                    .name("System Owner")
                    .permissions(Set.of("view_dashboard", "view_search", "view_settings", "view_roles", "manage_all"))
                    .build());
        }
        if (!roleRepository.findByName("Family Head").isPresent()) {
            roleRepository.save(Role.builder()
                    .name("Family Head")
                    .permissions(Set.of("view_dashboard", "view_search", "view_settings", "manage_family"))
                    .build());
        }
        if (!roleRepository.findByName("Family Member").isPresent()) {
            roleRepository.save(Role.builder()
                    .name("Family Member")
                    .permissions(Set.of("view_dashboard", "manage_self"))
                    .build());
        }
    }

    private void bootstrapAdmin() {
        Role adminRole = roleRepository.findByName("System Owner")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("System Owner")
                        .permissions(Set.of("view_dashboard", "view_search", "view_settings", "view_roles", "manage_all"))
                        .build()));

        if (!userRepository.findByEmail("kincore123@gmail.com").isPresent()) {
            userRepository.save(User.builder()
                    .name("System Admin")
                    .email("kincore123@gmail.com")
                    .password(passwordEncoder.encode("AdminPassword123!"))
                    .role(adminRole)
                    .isActive(true)
                    .isTemporaryPassword(false)
                    .build());
        }
    }
}
