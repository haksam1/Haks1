package com.familytree.service;

import com.familytree.dto.request.LoginRequest;
import com.familytree.dto.request.RegisterRequest;
import com.familytree.dto.response.AuthResponse;
import com.familytree.exception.UnauthorizedException;
import com.familytree.model.User;
import com.familytree.repository.UserRepository;
import com.familytree.security.JwtTokenProvider;
import com.familytree.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final com.familytree.repository.RoleRepository roleRepository;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new UnauthorizedException("Email already in use");
        }

        com.familytree.model.Role defaultRole = roleRepository.findByName("System Admin")
                .orElseGet(() -> roleRepository.save(com.familytree.model.Role.builder()
                        .name("System Admin")
                        .permissions(java.util.Set.of("view_dashboard", "view_search", "view_settings", "view_roles"))
                        .build()));

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(defaultRole)
                .build();

        user = userRepository.save(user);
        
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = tokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(defaultRole.getName())
                .permissions(defaultRole.getPermissions())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String token = tokenProvider.generateToken(userDetails);

        java.util.Set<String> perms = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        return AuthResponse.builder()
                .token(token)
                .id(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .role(userDetails.getRole())
                .permissions(perms)
                .build();
    }
}
