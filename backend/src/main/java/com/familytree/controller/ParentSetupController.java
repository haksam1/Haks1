package com.familytree.controller;

import com.familytree.dto.request.ParentSetupRequest;
import com.familytree.model.Role;
import com.familytree.model.SmsQueue;
import com.familytree.model.User;
import com.familytree.repository.RoleRepository;
import com.familytree.repository.SmsQueueRepository;
import com.familytree.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/parent-setup")
@RequiredArgsConstructor
public class ParentSetupController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SmsQueueRepository smsQueueRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, String>> setupParent(@Valid @RequestBody ParentSetupRequest req) {
        // 1. Generate unique random password
        String randomPassword = UUID.randomUUID().toString().substring(0, 8) + "@Pt1";

        // 2. Fetch 'Family Member' role
        Role memberRole = roleRepository.findByName("Family Member")
                .orElseThrow(() -> new IllegalStateException("Family Member role not found"));

        // 3. Provision or update User account
        User user = userRepository.findByEmail(req.getEmail())
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .name(req.getName())
                            .email(req.getEmail())
                            .password(passwordEncoder.encode(randomPassword))
                            .role(memberRole)
                            .personId(req.getPersonId())
                            .isTemporaryPassword(true)
                            .isActive(false)
                            .build();
                    return userRepository.save(newUser);
                });

        // Ensure user has Family Member role and personId is linked
        boolean needsUpdate = false;
        if (user.getRole() == null || !user.getRole().getName().equals("Family Member")) {
            user.setRole(memberRole);
            needsUpdate = true;
        }
        if (user.getPersonId() == null || !user.getPersonId().equals(req.getPersonId())) {
            user.setPersonId(req.getPersonId());
            needsUpdate = true;
        }
        if (needsUpdate) {
            userRepository.save(user);
        }

        // 4. Create SMS message contents
        String smsMessage = String.format(
                "Welcome to KinCore! Your parent login credentials are - Email: %s , Password: %s . Access your family tree dashboard.",
                req.getEmail(),
                randomPassword
        );

        // 5. Log the SMS in pending queue
        SmsQueue sms = SmsQueue.builder()
                .phoneNumber(req.getPhoneNumber())
                .message(smsMessage)
                .status("PENDING")
                .build();
        smsQueueRepository.save(sms);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Parent account created and credentials SMS queued in pending queue.",
                "email", req.getEmail(),
                "password", randomPassword
        ));
    }
}
