package com.familytree.service;

import com.familytree.dto.response.TreeResponse;
import com.familytree.exception.BadRequestException;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.FamilyTree;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.Invitation;
import com.familytree.model.SmsQueue;
import com.familytree.model.PendingEmailAndMessage;
import com.familytree.repository.FamilyTreeRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import com.familytree.repository.InvitationRepository;
import com.familytree.repository.SmsQueueRepository;
import com.familytree.repository.PendingEmailAndMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreeService {

    private final FamilyTreeRepository treeRepository;
    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final InvitationRepository invitationRepository;
    private final SmsQueueRepository smsQueueRepository;
    private final PendingEmailAndMessageRepository pendingEmailAndMessageRepository;

    public List<TreeResponse> getAllByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("System Owner".equals(role)) {
            return treeRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else if ("Family Head".equals(role)) {
            return treeRepository.findAllByOwnerId(userId).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else if ("Family Member".equals(role) || "Parent Admin".equals(role)) {
            if (user.getPersonId() == null) {
                return Collections.emptyList();
            }
            Person p = personRepository.findById(user.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Member profile not found"));
            return Collections.singletonList(mapToResponse(p.getTree()));
        } else {
            return Collections.emptyList();
        }
    }

    public TreeResponse getById(Long treeId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        FamilyTree tree;
        if ("System Owner".equals(role)) {
            tree = treeRepository.findById(treeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        } else if ("Family Head".equals(role)) {
            tree = treeRepository.findByIdAndOwnerId(treeId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found or access denied"));
        } else if ("Family Member".equals(role) || "Parent Admin".equals(role)) {
            if (user.getPersonId() == null) {
                throw new BadRequestException("User profile not linked to any member");
            }
            Person p = personRepository.findById(user.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Member profile not found"));
            if (!p.getTree().getId().equals(treeId)) {
                throw new BadRequestException("Access denied to this family tree");
            }
            tree = p.getTree();
        } else {
            throw new BadRequestException("Unauthorized role: " + role);
        }
        return mapToResponse(tree);
    }

    @Transactional
    public TreeResponse create(String name, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = owner.getRole() != null ? owner.getRole().getName() : "";
        if ("Family Member".equals(role) || "Parent Admin".equals(role)) {
            throw new BadRequestException("Family Members and Parent Admins cannot create new family trees");
        }

        FamilyTree tree = FamilyTree.builder()
                .name(name)
                .owner(owner)
                .build();

        return mapToResponse(treeRepository.save(tree));
    }

    @Transactional
    public void delete(Long treeId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        FamilyTree tree;
        if ("System Owner".equals(role)) {
            tree = treeRepository.findById(treeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        } else if ("Family Head".equals(role)) {
            tree = treeRepository.findByIdAndOwnerId(treeId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found or access denied"));
        } else {
            throw new BadRequestException("Only System Owners or Family Heads can delete family trees");
        }
        treeRepository.delete(tree);
    }

    @Transactional
    public TreeResponse updateView(Long treeId, String view, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        FamilyTree tree;
        if ("System Owner".equals(role)) {
            tree = treeRepository.findById(treeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        } else if ("Family Head".equals(role)) {
            tree = treeRepository.findByIdAndOwnerId(treeId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tree not found or access denied"));
        } else {
            throw new BadRequestException("Only System Owners or Family Heads can change family tree view settings");
        }

        if (!"yes".equals(view) && !"no".equals(view)) {
            throw new BadRequestException("Invalid view value. Must be 'yes' or 'no'");
        }

        tree.setView(view);
        return mapToResponse(treeRepository.save(tree));
    }

    private TreeResponse mapToResponse(FamilyTree tree) {
        return TreeResponse.builder()
                .id(tree.getId())
                .name(tree.getName())
                .ownerId(tree.getOwner().getId())
                .createdAt(tree.getCreatedAt())
                .view(tree.getView())
                .build();
    }

    public List<TreeResponse> getPublicTrees() {
        return treeRepository.findAllByView("yes").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TreeResponse getPublicTree(Long id) {
        FamilyTree tree = treeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        if (!"yes".equals(tree.getView())) {
            throw new ResourceNotFoundException("Tree is not public");
        }
        return mapToResponse(tree);
    }

    public List<Map<String, Object>> getInvitations(Long treeId, Long userId) {
        // Validate access
        getById(treeId, userId);

        List<Invitation> invitations = invitationRepository.findAllByTreeId(treeId);
        return invitations.stream().map(inv -> {
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
    }

    @Transactional
    public void resendInvitation(Long treeId, Long invitationId, Long userId) {
        // Validate access
        getById(treeId, userId);

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        if (!invitation.getTree().getId().equals(treeId)) {
            throw new BadRequestException("Invitation does not belong to this family tree");
        }

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

        String emailSubject = "Invitation to join " + tree.getName();
        String emailMessage = String.format(
                "Hello %s,\n\nYou have been added to the family tree: %s.\n\n" +
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
}
