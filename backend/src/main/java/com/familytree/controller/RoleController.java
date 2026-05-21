package com.familytree.controller;

import com.familytree.dto.request.RoleRequest;
import com.familytree.dto.request.UserRoleUpdateRequest;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.Role;
import com.familytree.model.User;
import com.familytree.repository.RoleRepository;
import com.familytree.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @PostMapping("/roles")
    @Transactional
    public ResponseEntity<Role> createRole(@Valid @RequestBody RoleRequest req) {
        Role role = Role.builder()
                .name(req.getName())
                .permissions(req.getPermissions() != null ? req.getPermissions() : java.util.Collections.emptySet())
                .build();
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @PutMapping("/roles/{id}")
    @Transactional
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        role.setName(req.getName());
        if (req.getPermissions() != null) {
            role.getPermissions().clear();
            role.getPermissions().addAll(req.getPermissions());
        }
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @DeleteMapping("/roles/{id}")
    @Transactional
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        
        // Prevent deleting System Admin or Parent Admin easily
        if ("System Admin".equalsIgnoreCase(role.getName()) || "Parent Admin".equalsIgnoreCase(role.getName())) {
            throw new IllegalArgumentException("Cannot delete default System or Parent Admin roles.");
        }

        roleRepository.delete(role);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(u -> UserDto.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .roleId(u.getRole() != null ? u.getRole().getId() : null)
                        .roleName(u.getRole() != null ? u.getRole().getName() : "None")
                        .permissions(u.getRole() != null ? u.getRole().getPermissions() : java.util.Collections.emptySet())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}/role")
    @Transactional
    public ResponseEntity<Void> updateUserRole(@PathVariable Long userId, @Valid @RequestBody UserRoleUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Role role = roleRepository.findById(req.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private Long roleId;
        private String roleName;
        private java.util.Set<String> permissions;
    }
}
