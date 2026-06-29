package com.familytree.controller;

import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerController {

    private final FamilyTreeRepository treeRepository;
    private final InvitationRepository invitationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final SmsQueueRepository smsQueueRepository;
    private final PendingEmailAndMessageRepository pendingEmailAndMessageRepository;

    @GetMapping("/families")
    public ResponseEntity<List<Map<String, Object>>> getFamilies() {
        List<FamilyTree> trees = treeRepository.findAll();
        List<Map<String, Object>> result = trees.stream().map(tree -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tree.getId());
            map.put("name", tree.getName());
            map.put("createdAt", tree.getCreatedAt());
            map.put("memberCount", tree.getPersons().size());
            if (tree.getOwner() != null) {
                map.put("headName", tree.getOwner().getName());
                map.put("headEmail", tree.getOwner().getEmail());
            } else {
                map.put("headName", "N/A");
                map.put("headEmail", "N/A");
            }
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<Map<String, Object>>> getInvitations() {
        List<Invitation> invitations = invitationRepository.findAll();
        List<Map<String, Object>> result = invitations.stream().map(inv -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", inv.getId());
            map.put("email", inv.getEmail());
            map.put("phoneNumber", inv.getPhoneNumber());
            map.put("status", inv.getStatus());
            map.put("sentAt", inv.getSentAt());
            map.put("expiresAt", inv.getExpiresAt());
            map.put("tempPassword", inv.getTempPassword());
            if (inv.getTree() != null) {
                map.put("treeId", inv.getTree().getId());
                map.put("treeName", inv.getTree().getName());
            }
            if (inv.getPerson() != null) {
                map.put("personId", inv.getPerson().getId());
                map.put("personName", inv.getPerson().getFirstName() + " " + inv.getPerson().getLastName());
            }
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<List<ActivityLog>> getActivityLogs() {
        List<ActivityLog> logs = activityLogRepository.findAll();
        // Sort descending by timestamp/id
        logs.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthMetrics() {
        long activeFamilies = treeRepository.count();
        long pendingActivations = invitationRepository.findAll().stream()
                .filter(inv -> "PENDING".equalsIgnoreCase(inv.getStatus()))
                .count();

        List<Invitation> allInvitations = invitationRepository.findAll();
        long totalInvites = allInvitations.size();
        long acceptedInvites = allInvitations.stream()
                .filter(inv -> "ACCEPTED".equalsIgnoreCase(inv.getStatus()))
                .count();

        double invitationResponseRate = totalInvites > 0 
                ? ((double) acceptedInvites / totalInvites) * 100 
                : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("activeFamilies", activeFamilies);
        metrics.put("pendingActivations", pendingActivations);
        metrics.put("invitationResponseRate", invitationResponseRate);
        metrics.put("totalInvitations", totalInvites);
        metrics.put("acceptedInvitations", acceptedInvites);

        return ResponseEntity.ok(metrics);
    }

    @PostMapping("/invitations/{id}/resend")
    @Transactional
    public ResponseEntity<Map<String, String>> resendInvitation(@PathVariable Long id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        invitation.setSentAt(LocalDateTime.now());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
        invitationRepository.save(invitation);

        String tempPassword = invitation.getTempPassword();
        FamilyTree tree = invitation.getTree();
        Person person = invitation.getPerson();

        if (person.getPhoneNumber() != null && !person.getPhoneNumber().isBlank()) {
            String smsMessage = String.format(
                    "Welcome to KinCore! You've been added to %s. Log in with Email: %s , Temp Password: %s",
                    tree.getName(), person.getEmail(), tempPassword
            );
            SmsQueue sms = SmsQueue.builder()
                    .phoneNumber(person.getPhoneNumber())
                    .message(smsMessage)
                    .status("PENDING")
                    .build();
            smsQueueRepository.save(sms);
        }

        if (person.getEmail() != null && !person.getEmail().isBlank()) {
            String emailSubject = "Invitation to join " + tree.getName();
            String emailMessage = String.format(
                    "Hello %s,\n\n" +
                    "You have been added to the family tree: %s.\n\n" +
                    "Please log in with the following temporary credentials:\n" +
                    "Email: %s\n" +
                    "Temporary Password: %s\n\n" +
                    "You will be asked to change this password on your first login.\n\n" +
                    "Best regards,\nKinCore Family Tree",
                    person.getFirstName(), tree.getName(), person.getEmail(), tempPassword
            );
            PendingEmailAndMessage pendingEmail = PendingEmailAndMessage.builder()
                    .email(person.getEmail())
                    .subject(emailSubject)
                    .message(emailMessage)
                    .status("PENDING")
                    .build();
            pendingEmailAndMessageRepository.save(pendingEmail);
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Invitation resentment queued successfully"
        ));
    }

    @PostMapping("/invitations/{id}/activate")
    @Transactional
    public ResponseEntity<Map<String, String>> manuallyActivate(@PathVariable Long id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        if (invitation.getPerson() != null) {
            userRepository.findByPersonId(invitation.getPerson().getId())
                    .ifPresent(user -> {
                        user.setActive(true);
                        user.setTemporaryPassword(false);
                        userRepository.save(user);
                    });
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Member manually activated successfully"
        ));
    }
}
