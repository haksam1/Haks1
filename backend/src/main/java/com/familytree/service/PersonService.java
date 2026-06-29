package com.familytree.service;

import com.familytree.dto.request.PersonRequest;
import com.familytree.dto.request.RelationshipRequest;
import com.familytree.dto.response.PersonResponse;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.exception.BadRequestException;
import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonService {

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;
    private final RelationshipRepository relationshipRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InvitationRepository invitationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SmsQueueRepository smsQueueRepository;
    private final PendingEmailAndMessageRepository pendingEmailAndMessageRepository;
    private final PasswordEncoder passwordEncoder;
    private final FamilyRepository familyRepository;
    private final MarriageRepository marriageRepository;
    private final PersonPhotoRepository personPhotoRepository;

    public List<PersonResponse> getAllByTree(Long treeId, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        List<Person> allPersons = personRepository.findAllByTreeId(treeId);

        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            if (user.getRole() != null && "Family Member".equals(user.getRole().getName())) {
                java.util.Set<Long> ancestors = findAncestors(user.getPersonId(), allPersons);
                allPersons = allPersons.stream()
                        .filter(p -> ancestors.contains(p.getId()))
                        .collect(Collectors.toList());
            }
        }

        final List<Person> finalPersons = allPersons;
        return allPersons.stream()
                .map(p -> mapToResponse(p, finalPersons))
                .collect(Collectors.toList());
    }

    public PersonResponse getById(Long treeId, Long personId, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        List<Person> allPersons = personRepository.findAllByTreeId(treeId);

        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow();
            if (user.getRole() != null && "Family Member".equals(user.getRole().getName())) {
                java.util.Set<Long> ancestors = findAncestors(user.getPersonId(), allPersons);
                if (!ancestors.contains(personId)) {
                    throw new ResourceNotFoundException("Person not found");
                }
                allPersons = allPersons.stream()
                        .filter(p -> ancestors.contains(p.getId()))
                        .collect(Collectors.toList());
            }
        }
        return mapToResponse(person, allPersons);
    }

    private boolean isParentRelationship(String type) {
        return "FATHER".equalsIgnoreCase(type) || "MOTHER".equalsIgnoreCase(type);
    }

    private boolean isGrandparentRelationship(String type) {
        return "GRANDFATHER".equalsIgnoreCase(type) || "GRANDMOTHER".equalsIgnoreCase(type)
                || "PATERNAL_GRANDFATHER".equalsIgnoreCase(type) || "PATERNAL_GRANDMOTHER".equalsIgnoreCase(type)
                || "MATERNAL_GRANDFATHER".equalsIgnoreCase(type) || "MATERNAL_GRANDMOTHER".equalsIgnoreCase(type);
    }

    private void sendCredentials(FamilyTree tree, Person person, String emailAddress) {
        if (emailAddress == null || emailAddress.isBlank()) {
            return;
        }
        if (userRepository.existsByEmail(emailAddress)) {
            return;
        }

        String tempPassword = "Temp" + java.util.UUID.randomUUID().toString().substring(0, 8) + "!";
        Role familyMemberRole = roleRepository.findByName("Family Member")
                .orElseThrow(() -> new IllegalStateException("Family Member role not found"));
        
        User newUser = User.builder()
                .name(person.getFirstName() + " " + person.getLastName())
                .email(emailAddress)
                .password(passwordEncoder.encode(tempPassword))
                .role(familyMemberRole)
                .personId(person.getId())
                .isTemporaryPassword(true)
                .isActive(false)
                .build();
        userRepository.save(newUser);

        Invitation invitation = Invitation.builder()
                .tree(tree)
                .person(person)
                .email(emailAddress)
                .phoneNumber(person.getPhoneNumber())
                .tempPassword(tempPassword)
                .status("PENDING")
                .expiresAt(java.time.LocalDateTime.now().plusDays(7))
                .build();
        invitationRepository.save(invitation);

        if (person.getPhoneNumber() != null && !person.getPhoneNumber().isBlank()) {
            String smsMessage = String.format(
                    "Welcome to KinCore! You've been added to %s. Log in with Email: %s , Temp Password: %s",
                    tree.getName(), emailAddress, tempPassword
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
                person.getFirstName(), tree.getName(), emailAddress, tempPassword
        );
        PendingEmailAndMessage pendingEmail = PendingEmailAndMessage.builder()
                .email(emailAddress)
                .subject(emailSubject)
                .message(emailMessage)
                .status("PENDING")
                .build();
        pendingEmailAndMessageRepository.save(pendingEmail);
    }

    @Transactional
    public PersonResponse create(Long treeId, PersonRequest req, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        User user = userRepository.findById(userId).orElseThrow();

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new BadRequestException("A user with this email already exists.");
            }
        }

        // Check for duplicates
        List<Person> existing = personRepository.findAllByTreeId(treeId);
        for (Person p : existing) {
            if (p.getFirstName().equalsIgnoreCase(req.getFirstName().trim())
                    && p.getLastName().equalsIgnoreCase(req.getLastName().trim())
                    && java.util.Objects.equals(p.getBirthDate(), req.getBirthDate())) {
                throw new BadRequestException("A person with the same name and date of birth already exists in this family tree.");
            }
        }

        Person person = Person.builder()
                .tree(tree)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .birthDate(req.getBirthDate())
                .deathDate(req.getDeathDate())
                .gender(req.getGender())
                .bio(req.getBio())
                .phoneNumber(req.getPhoneNumber())
                .email(req.getEmail())
                .photoUrl(req.getPhotoUrl())
                .createdBy(userId)
                .modifyPermission("SELF_AND_ADMIN")
                .build();
        Person saved = personRepository.save(person);

        String relType = req.getRelationshipType();
        Long relPersonId = req.getRelatedPersonId();

        if (relType != null && !relType.trim().isEmpty() && relPersonId != null) {
            Person targetPerson = personRepository.findById(relPersonId)
                    .orElseThrow(() -> new ResourceNotFoundException("Related person not found"));
            boolean isParent = isParentRelationship(relType);
            boolean isGrandparent = isGrandparentRelationship(relType);
            boolean isAlive = req.getAlive() != null ? req.getAlive() : (req.getDeathDate() == null);

            if (isParent) {
                RelationshipRequest relReq = new RelationshipRequest();
                relReq.setRelatedPersonId(relPersonId);
                relReq.setType(relType);
                addRelationship(treeId, saved.getId(), relReq, userId);

                if (isAlive) {
                    sendCredentials(tree, saved, req.getEmail());
                } else {
                    if (req.getChildFirstName() != null && !req.getChildFirstName().trim().isEmpty()) {
                        Person child = Person.builder()
                                .tree(tree)
                                .firstName(req.getChildFirstName())
                                .lastName(req.getChildLastName())
                                .birthDate(req.getChildBirthDate())
                                .gender(req.getChildGender())
                                .phoneNumber(req.getChildPhoneNumber())
                                .email(req.getChildEmail())
                                .createdBy(userId)
                                .modifyPermission("SELF_AND_ADMIN")
                                .build();
                        Person savedChild = personRepository.save(child);

                        RelationshipRequest relChildReq = new RelationshipRequest();
                        relChildReq.setRelatedPersonId(savedChild.getId());
                        relChildReq.setType("CHILD");
                        addRelationship(treeId, saved.getId(), relChildReq, userId);

                        RelationshipRequest sibReq = new RelationshipRequest();
                        sibReq.setRelatedPersonId(targetPerson.getId());
                        sibReq.setType("SIBLING");
                        addRelationship(treeId, savedChild.getId(), sibReq, userId);

                        sendCredentials(tree, savedChild, req.getChildEmail());
                    }
                }
            } else if (isGrandparent) {
                boolean isPaternal = relType.toUpperCase().contains("PATERNAL") || relType.equalsIgnoreCase("GRANDFATHER") || relType.equalsIgnoreCase("GRANDMOTHER");
                
                Person parentNode = null;
                String parentGender = isPaternal ? "MALE" : "FEMALE";
                
                for (Relationship rel : targetPerson.getRelationships()) {
                    if (rel.getType() == Relationship.RelationshipType.PARENT) {
                        Person p = rel.getRelatedPerson();
                        if (parentGender.equalsIgnoreCase(p.getGender())) {
                            parentNode = p;
                            break;
                        }
                    }
                }
                
                if (parentNode == null) {
                    String defaultLastName = targetPerson.getLastName();
                    String defaultFirstName = (isPaternal ? "Father" : "Mother") + " of " + targetPerson.getFirstName();
                    LocalDate birthDate = targetPerson.getBirthDate() != null ? targetPerson.getBirthDate().minusYears(25) : LocalDate.of(1970, 1, 1);
                    
                    Person placeholder = Person.builder()
                            .tree(tree)
                            .firstName(defaultFirstName)
                            .lastName(defaultLastName)
                            .birthDate(birthDate)
                            .gender(parentGender)
                            .bio("Placeholder profile for " + (isPaternal ? "Father" : "Mother"))
                            .createdBy(userId)
                            .modifyPermission("SELF_AND_ADMIN")
                            .build();
                    parentNode = personRepository.save(placeholder);
                    
                    RelationshipRequest relReq = new RelationshipRequest();
                    relReq.setRelatedPersonId(parentNode.getId());
                    relReq.setType(isPaternal ? "FATHER" : "MOTHER");
                    addRelationship(treeId, targetPerson.getId(), relReq, userId);
                }

                RelationshipRequest gpRelReq = new RelationshipRequest();
                gpRelReq.setRelatedPersonId(parentNode.getId());
                gpRelReq.setType(relType.toUpperCase().contains("GRANDMOTHER") ? "MOTHER" : "FATHER");
                addRelationship(treeId, saved.getId(), gpRelReq, userId);

                if (isAlive) {
                    sendCredentials(tree, saved, req.getEmail());
                } else {
                    if (req.getChildFirstName() != null && !req.getChildFirstName().trim().isEmpty()) {
                        Person child = Person.builder()
                                .tree(tree)
                                .firstName(req.getChildFirstName())
                                .lastName(req.getChildLastName())
                                .birthDate(req.getChildBirthDate())
                                .gender(req.getChildGender())
                                .phoneNumber(req.getChildPhoneNumber())
                                .email(req.getChildEmail())
                                .createdBy(userId)
                                .modifyPermission("SELF_AND_ADMIN")
                                .build();
                        Person savedChild = personRepository.save(child);

                        RelationshipRequest relChildReq = new RelationshipRequest();
                        relChildReq.setRelatedPersonId(savedChild.getId());
                        relChildReq.setType("CHILD");
                        addRelationship(treeId, saved.getId(), relChildReq, userId);

                        if (parentGender.equalsIgnoreCase(savedChild.getGender())) {
                            RelationshipRequest parentRelReq = new RelationshipRequest();
                            parentRelReq.setRelatedPersonId(savedChild.getId());
                            parentRelReq.setType(isPaternal ? "FATHER" : "MOTHER");
                            addRelationship(treeId, targetPerson.getId(), parentRelReq, userId);
                        }

                        sendCredentials(tree, savedChild, req.getChildEmail());
                    }
                }
            } else {
                RelationshipRequest relReq = new RelationshipRequest();
                relReq.setRelatedPersonId(relPersonId);
                relReq.setType(relType);
                addRelationship(treeId, saved.getId(), relReq, userId);
            }
        } else {
            if (req.getEmail() != null && !req.getEmail().isBlank()) {
                sendCredentials(tree, saved, req.getEmail());
            }
        }

        activityLogRepository.save(ActivityLog.builder()
                .userId(userId)
                .userName(user.getName())
                .action("Added member " + saved.getFirstName() + " " + saved.getLastName() + " to tree " + tree.getName())
                .build());

        List<Person> updatedPersons = personRepository.findAllByTreeId(treeId);
        return mapToResponse(saved, updatedPersons);
    }

    @Transactional
    public PersonResponse update(Long treeId, Long personId, PersonRequest req, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        User user = userRepository.findById(userId).orElseThrow();

        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));

        boolean isAdmin = user.getRole() != null && "System Owner".equals(user.getRole().getName());
        boolean isSelf = personId.equals(user.getPersonId());
        boolean isOwner = tree.getOwner().getId().equals(userId);
        if (!isAdmin && !isSelf && !isOwner) {
            throw new BadRequestException("You can only edit your own profile, unless you are a System Owner or the Family Head who created this tree.");
        }

        List<Person> existing = personRepository.findAllByTreeId(treeId);
        for (Person p : existing) {
            if (!p.getId().equals(personId)
                    && p.getFirstName().equalsIgnoreCase(req.getFirstName().trim())
                    && p.getLastName().equalsIgnoreCase(req.getLastName().trim())
                    && java.util.Objects.equals(p.getBirthDate(), req.getBirthDate())) {
                throw new BadRequestException("A person with the same name and date of birth already exists in this family tree.");
            }
        }

        person.setFirstName(req.getFirstName());
        person.setLastName(req.getLastName());
        person.setBirthDate(req.getBirthDate());
        person.setDeathDate(req.getDeathDate());
        person.setGender(req.getGender());
        person.setBio(req.getBio());
        person.setPhoneNumber(req.getPhoneNumber());
        person.setEmail(req.getEmail());
        if (req.getPhotoUrl() != null) {
            person.setPhotoUrl(req.getPhotoUrl());
        }

        Person saved = personRepository.save(person);

        activityLogRepository.save(ActivityLog.builder()
                .userId(userId)
                .userName(user.getName())
                .action("Updated profile of " + saved.getFirstName() + " " + saved.getLastName())
                .build());

        List<Person> updatedPersons = personRepository.findAllByTreeId(treeId);
        return mapToResponse(saved, updatedPersons);
    }

    @Transactional
    public void delete(Long treeId, Long personId, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        User user = userRepository.findById(userId).orElseThrow();

        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));

        boolean isAdmin = user.getRole() != null && "System Owner".equals(user.getRole().getName());
        boolean isOwner = tree.getOwner().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("Only System Owners or the Family Head who created the tree can delete family members.");
        }

        userRepository.findByPersonId(personId)
                .ifPresent(userRepository::delete);

        invitationRepository.deleteByPersonId(personId);
        marriageRepository.deleteByPerson1IdOrPerson2Id(personId, personId);
        relationshipRepository.deleteByPersonIdOrRelatedPersonId(personId, personId);
        personPhotoRepository.deleteByPersonId(personId);

        person.getFamilies().clear();
        personRepository.saveAndFlush(person);

        personRepository.delete(person);

        activityLogRepository.save(ActivityLog.builder()
                .userId(userId)
                .userName(user.getName())
                .action("Deleted member " + person.getFirstName() + " " + person.getLastName() + " from tree " + tree.getName())
                .build());
    }

    @Transactional
    public void addRelationship(Long treeId, Long personId, RelationshipRequest req, Long userId) {
        FamilyTree tree = validateAccess(treeId, userId);
        User user = userRepository.findById(userId).orElseThrow();

        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        Person relatedPerson = personRepository.findByIdAndTreeId(req.getRelatedPersonId(), treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Related person not found"));

        if (user.getRole() != null && "Family Member".equals(user.getRole().getName())) {
            Long callerPersonId = user.getPersonId();
            if (callerPersonId == null) {
                throw new BadRequestException("User profile is not linked to any family member.");
            }

            boolean isCallerPerson = personId.equals(callerPersonId);
            boolean isCallerRelated = req.getRelatedPersonId().equals(callerPersonId);

            if (!isCallerPerson && !isCallerRelated) {
                throw new BadRequestException("Family Members can only add relationships connecting to themselves.");
            }

            String typeStr = req.getType();
            if (isCallerPerson) {
                if (!"CHILD".equalsIgnoreCase(typeStr)) {
                    throw new BadRequestException("Family Members can only add children directly below themselves.");
                }
            } else {
                if (!"PARENT".equalsIgnoreCase(typeStr) && !"FATHER".equalsIgnoreCase(typeStr) && !"MOTHER".equalsIgnoreCase(typeStr)) {
                    throw new BadRequestException("Family Members can only add children directly below themselves.");
                }
            }
        }

        String typeStr = req.getType();
        Relationship.RelationshipType directType;
        Relationship.RelationshipType reverseType;

        if ("FATHER".equalsIgnoreCase(typeStr)) {
            if ("FEMALE".equalsIgnoreCase(relatedPerson.getGender())) {
                throw new BadRequestException("The linked person is female and cannot be a father.");
            }
            directType = Relationship.RelationshipType.CHILD;
            reverseType = Relationship.RelationshipType.PARENT;
        } else if ("MOTHER".equalsIgnoreCase(typeStr)) {
            if ("MALE".equalsIgnoreCase(relatedPerson.getGender())) {
                throw new BadRequestException("The linked person is male and cannot be a mother.");
            }
            directType = Relationship.RelationshipType.CHILD;
            reverseType = Relationship.RelationshipType.PARENT;
        } else if ("CHILD".equalsIgnoreCase(typeStr)) {
            directType = Relationship.RelationshipType.PARENT;
            reverseType = Relationship.RelationshipType.CHILD;
        } else if ("SPOUSE".equalsIgnoreCase(typeStr)) {
            directType = Relationship.RelationshipType.SPOUSE;
            reverseType = Relationship.RelationshipType.SPOUSE;
        } else if ("SIBLING".equalsIgnoreCase(typeStr)) {
            directType = Relationship.RelationshipType.SIBLING;
            reverseType = Relationship.RelationshipType.SIBLING;
        } else {
            try {
                directType = Relationship.RelationshipType.valueOf(typeStr.toUpperCase());
                if (directType == Relationship.RelationshipType.PARENT) {
                    reverseType = Relationship.RelationshipType.CHILD;
                } else if (directType == Relationship.RelationshipType.CHILD) {
                    reverseType = Relationship.RelationshipType.PARENT;
                } else {
                    reverseType = directType;
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid relationship type: " + typeStr);
            }
        }

        boolean directExists = person.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(relatedPerson.getId()) && r.getType() == directType);
        if (!directExists) {
            Relationship direct = Relationship.builder()
                    .person(person)
                    .relatedPerson(relatedPerson)
                    .type(directType)
                    .build();
            relationshipRepository.save(direct);
            person.getRelationships().add(direct);
        }

        boolean reverseExists = relatedPerson.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(person.getId()) && r.getType() == reverseType);
        if (!reverseExists) {
            Relationship reverse = Relationship.builder()
                    .person(relatedPerson)
                    .relatedPerson(person)
                    .type(reverseType)
                    .build();
            relationshipRepository.save(reverse);
            relatedPerson.getRelationships().add(reverse);
        }

        updateFamilyAssociationsAfterRelationship(person, relatedPerson, directType, req.getMarriageDate());

        activityLogRepository.save(ActivityLog.builder()
                .userId(userId)
                .userName(user.getName())
                .action("Added relationship " + typeStr + " between " + person.getFirstName() + " " + person.getLastName() + " and " + relatedPerson.getFirstName() + " " + relatedPerson.getLastName())
                .build());
    }

    public List<PersonResponse> search(String query, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        boolean isMember = user.getRole() != null && "Family Member".equals(user.getRole().getName());
        return personRepository.searchInUserTrees(query, userId).stream()
                .filter(p -> {
                    if (isMember) {
                        List<Person> allPersons = personRepository.findAllByTreeId(p.getTree().getId());
                        java.util.Set<Long> ancestors = findAncestors(user.getPersonId(), allPersons);
                        return ancestors.contains(p.getId());
                    }
                    return true;
                })
                .map(p -> {
                    List<Person> allPersons = personRepository.findAllByTreeId(p.getTree().getId());
                    if (isMember) {
                        java.util.Set<Long> ancestors = findAncestors(user.getPersonId(), allPersons);
                        allPersons = allPersons.stream()
                                .filter(ap -> ancestors.contains(ap.getId()))
                                .collect(Collectors.toList());
                    }
                    return mapToResponse(p, allPersons);
                })
                .collect(Collectors.toList());
    }

    private FamilyTree validateAccess(Long treeId, Long userId) {
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        if ("yes".equals(tree.getView())) {
            return tree;
        }

        if (userId == null) {
            throw new ResourceNotFoundException("User not found");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("System Owner".equals(role)) {
            return tree;
        } else if ("Family Head".equals(role)) {
            if (!tree.getOwner().getId().equals(userId)) {
                throw new ResourceNotFoundException("Tree not found or access denied");
            }
            return tree;
        } else if ("Family Member".equals(role) || "Parent Admin".equals(role)) {
            if (user.getPersonId() == null) {
                throw new BadRequestException("User profile is not linked to any family member");
            }
            Person p = personRepository.findById(user.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Member profile not found"));
            if (!p.getTree().getId().equals(treeId)) {
                throw new BadRequestException("Access denied to this family tree");
            }
            return p.getTree();
        } else {
            throw new BadRequestException("Unauthorized role: " + role);
        }
    }

    private java.util.Set<Long> findAncestors(Long personId, List<Person> allPersons) {
        java.util.Set<Long> ancestors = new java.util.HashSet<>();
        if (personId == null) {
            return ancestors;
        }
        java.util.Map<Long, java.util.Set<Long>> parentsMap = new java.util.HashMap<>();
        for (Person p : allPersons) {
            parentsMap.put(p.getId(), new java.util.HashSet<>());
        }
        for (Person p : allPersons) {
            if (p.getRelationships() != null) {
                for (Relationship rel : p.getRelationships()) {
                    Long fromId = p.getId();
                    Long toId = rel.getRelatedPerson().getId();
                    Relationship.RelationshipType type = rel.getType();
                    if (type == Relationship.RelationshipType.PARENT) {
                        parentsMap.computeIfAbsent(toId, k -> new java.util.HashSet<>()).add(fromId);
                    } else if (type == Relationship.RelationshipType.CHILD) {
                        parentsMap.computeIfAbsent(fromId, k -> new java.util.HashSet<>()).add(toId);
                    }
                }
            }
        }

        java.util.Queue<Long> queue = new java.util.LinkedList<>();
        queue.add(personId);
        ancestors.add(personId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            java.util.Set<Long> parents = parentsMap.get(current);
            if (parents != null) {
                for (Long parentId : parents) {
                    if (!ancestors.contains(parentId)) {
                        ancestors.add(parentId);
                        queue.add(parentId);
                    }
                }
            }
        }
        return ancestors;
    }

    private PersonResponse mapToResponse(Person p) {
        List<Person> allPersons = personRepository.findAllByTreeId(p.getTree().getId());
        return mapToResponse(p, allPersons);
    }

    private PersonResponse mapToResponse(Person p, List<Person> allPersons) {
        return PersonResponse.builder()
                .id(p.getId())
                .treeId(p.getTree().getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .birthDate(p.getBirthDate())
                .deathDate(p.getDeathDate())
                .gender(p.getGender())
                .bio(p.getBio())
                .photoUrl(p.getPhotoUrl())
                .phoneNumber(p.getPhoneNumber())
                .email(p.getEmail())
                .createdBy(p.getCreatedBy())
                .modifyPermission(p.getModifyPermission())
                .relationships(p.getRelationships() == null ? java.util.Collections.emptyList() : p.getRelationships().stream()
                        .map(r -> PersonResponse.RelationshipDto.builder()
                                .id(r.getId())
                                .relatedPersonId(r.getRelatedPerson().getId())
                                .type(r.getType())
                                .build())
                        .collect(Collectors.toList()))
                .computedRelationships(computeRelationships(p, allPersons))
                .build();
    }

    private List<PersonResponse.ComputedRelationshipDto> computeRelationships(Person target, List<Person> allPersons) {
        if (target == null || allPersons == null || allPersons.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        java.util.Map<Long, Person> personMap = allPersons.stream()
                .collect(Collectors.toMap(Person::getId, p -> p));

        java.util.Map<Long, java.util.Set<Long>> parentsMap = new java.util.HashMap<>();
        java.util.Map<Long, java.util.Set<Long>> childrenMap = new java.util.HashMap<>();
        java.util.Map<Long, java.util.Set<Long>> spousesMap = new java.util.HashMap<>();
        java.util.Map<Long, java.util.Set<Long>> siblingsMap = new java.util.HashMap<>();

        for (Person p : allPersons) {
            parentsMap.put(p.getId(), new java.util.HashSet<>());
            childrenMap.put(p.getId(), new java.util.HashSet<>());
            spousesMap.put(p.getId(), new java.util.HashSet<>());
            siblingsMap.put(p.getId(), new java.util.HashSet<>());
        }

        // Populate direct relationships from database records
        for (Person p : allPersons) {
            if (p.getRelationships() != null) {
                for (Relationship rel : p.getRelationships()) {
                    Long fromId = p.getId();
                    Long toId = rel.getRelatedPerson().getId();
                    Relationship.RelationshipType type = rel.getType();

                    if (type == Relationship.RelationshipType.PARENT) {
                        parentsMap.computeIfAbsent(toId, k -> new java.util.HashSet<>()).add(fromId);
                        childrenMap.computeIfAbsent(fromId, k -> new java.util.HashSet<>()).add(toId);
                    } else if (type == Relationship.RelationshipType.CHILD) {
                        childrenMap.computeIfAbsent(toId, k -> new java.util.HashSet<>()).add(fromId);
                        parentsMap.computeIfAbsent(fromId, k -> new java.util.HashSet<>()).add(toId);
                    } else if (type == Relationship.RelationshipType.SPOUSE) {
                        spousesMap.computeIfAbsent(fromId, k -> new java.util.HashSet<>()).add(toId);
                        spousesMap.computeIfAbsent(toId, k -> new java.util.HashSet<>()).add(fromId);
                    } else if (type == Relationship.RelationshipType.SIBLING) {
                        siblingsMap.computeIfAbsent(fromId, k -> new java.util.HashSet<>()).add(toId);
                        siblingsMap.computeIfAbsent(toId, k -> new java.util.HashSet<>()).add(fromId);
                    }
                }
            }
        }

        // Also, siblings share parents: if A and B share a parent, they are siblings
        for (Person p1 : allPersons) {
            for (Person p2 : allPersons) {
                if (!p1.getId().equals(p2.getId())) {
                    java.util.Set<Long> parents1 = parentsMap.get(p1.getId());
                    java.util.Set<Long> parents2 = parentsMap.get(p2.getId());
                    if (parents1 != null && parents2 != null) {
                        boolean sharesParent = parents1.stream().anyMatch(parents2::contains);
                        if (sharesParent) {
                            siblingsMap.computeIfAbsent(p1.getId(), k -> new java.util.HashSet<>()).add(p2.getId());
                            siblingsMap.computeIfAbsent(p2.getId(), k -> new java.util.HashSet<>()).add(p1.getId());
                        }
                    }
                }
            }
        }

        Long activeId = target.getId();
        java.util.Map<Long, String> relationLabels = new java.util.HashMap<>();

        // 1. Spouses
        java.util.Set<Long> spouses = spousesMap.getOrDefault(activeId, java.util.Collections.emptySet());
        for (Long id : spouses) {
            Person p = personMap.get(id);
            if (p != null) {
                String gender = p.getGender();
                String label = "FEMALE".equalsIgnoreCase(gender) ? "Wife" : "MALE".equalsIgnoreCase(gender) ? "Husband" : "Spouse";
                relationLabels.put(id, label);
            }
        }

        // 2. Parents
        java.util.Set<Long> parents = parentsMap.getOrDefault(activeId, java.util.Collections.emptySet());
        for (Long id : parents) {
            Person p = personMap.get(id);
            if (p != null) {
                String gender = p.getGender();
                String label = "FEMALE".equalsIgnoreCase(gender) ? "Mother" : "MALE".equalsIgnoreCase(gender) ? "Father" : "Parent";
                relationLabels.put(id, label);
            }
        }

        // 3. Children
        java.util.Set<Long> children = childrenMap.getOrDefault(activeId, java.util.Collections.emptySet());
        for (Long id : children) {
            Person p = personMap.get(id);
            if (p != null) {
                String gender = p.getGender();
                String label = "FEMALE".equalsIgnoreCase(gender) ? "Daughter" : "MALE".equalsIgnoreCase(gender) ? "Son" : "Child";
                relationLabels.put(id, label);
            }
        }

        // 4. Siblings
        java.util.Set<Long> siblings = siblingsMap.getOrDefault(activeId, java.util.Collections.emptySet());
        for (Long id : siblings) {
            if (!relationLabels.containsKey(id)) {
                Person p = personMap.get(id);
                if (p != null) {
                    String gender = p.getGender();
                    String label = "FEMALE".equalsIgnoreCase(gender) ? "Sister" : "MALE".equalsIgnoreCase(gender) ? "Brother" : "Sibling";
                    relationLabels.put(id, label);
                }
            }
        }

        // 5. Grandparents
        java.util.Set<Long> grandparents = new java.util.HashSet<>();
        for (Long parentId : parents) {
            grandparents.addAll(parentsMap.getOrDefault(parentId, java.util.Collections.emptySet()));
        }
        for (Long id : grandparents) {
            if (!relationLabels.containsKey(id)) {
                Person p = personMap.get(id);
                if (p != null) {
                    String gender = p.getGender();
                    String label = "FEMALE".equalsIgnoreCase(gender) ? "Grandmother" : "MALE".equalsIgnoreCase(gender) ? "Grandfather" : "Grandparent";
                    relationLabels.put(id, label);
                }
            }
        }

        // 6. Grandchildren
        java.util.Set<Long> grandchildren = new java.util.HashSet<>();
        for (Long childId : children) {
            grandchildren.addAll(childrenMap.getOrDefault(childId, java.util.Collections.emptySet()));
        }
        for (Long id : grandchildren) {
            if (!relationLabels.containsKey(id)) {
                Person p = personMap.get(id);
                if (p != null) {
                    String gender = p.getGender();
                    String label = "FEMALE".equalsIgnoreCase(gender) ? "Granddaughter" : "MALE".equalsIgnoreCase(gender) ? "Grandson" : "Grandchild";
                    relationLabels.put(id, label);
                }
            }
        }

        // 7. Aunts and Uncles
        java.util.Set<Long> auntsAndUncles = new java.util.HashSet<>();
        for (Long parentId : parents) {
            auntsAndUncles.addAll(siblingsMap.getOrDefault(parentId, java.util.Collections.emptySet()));
        }
        for (Long id : auntsAndUncles) {
            if (!relationLabels.containsKey(id) && !parents.contains(id)) {
                Person p = personMap.get(id);
                if (p != null) {
                    String gender = p.getGender();
                    String label = "FEMALE".equalsIgnoreCase(gender) ? "Aunt" : "MALE".equalsIgnoreCase(gender) ? "Uncle" : "Uncle/Aunt";
                    relationLabels.put(id, label);
                }
            }
        }

        // 8. Nephews and Nieces
        java.util.Set<Long> nephewsAndNieces = new java.util.HashSet<>();
        for (Long siblingId : siblings) {
            nephewsAndNieces.addAll(childrenMap.getOrDefault(siblingId, java.util.Collections.emptySet()));
        }
        for (Long id : nephewsAndNieces) {
            if (!relationLabels.containsKey(id) && !children.contains(id)) {
                Person p = personMap.get(id);
                if (p != null) {
                    String gender = p.getGender();
                    String label = "FEMALE".equalsIgnoreCase(gender) ? "Niece" : "MALE".equalsIgnoreCase(gender) ? "Nephew" : "Nephew/Niece";
                    relationLabels.put(id, label);
                }
            }
        }

        // 9. Cousins
        java.util.Set<Long> cousins = new java.util.HashSet<>();
        for (Long auId : auntsAndUncles) {
            cousins.addAll(childrenMap.getOrDefault(auId, java.util.Collections.emptySet()));
        }
        for (Long id : cousins) {
            if (!relationLabels.containsKey(id) && !siblings.contains(id) && !children.contains(id) && !id.equals(activeId)) {
                Person p = personMap.get(id);
                if (p != null) {
                    relationLabels.put(id, "Cousin");
                }
            }
        }

        java.util.List<PersonResponse.ComputedRelationshipDto> list = new java.util.ArrayList<>();
        for (java.util.Map.Entry<Long, String> entry : relationLabels.entrySet()) {
            Person p = personMap.get(entry.getKey());
            if (p != null) {
                list.add(PersonResponse.ComputedRelationshipDto.builder()
                        .relatedPersonId(p.getId())
                        .fullName(p.getFirstName() + " " + p.getLastName())
                        .typeLabel(entry.getValue())
                        .photoUrl(p.getPhotoUrl())
                        .birthDate(p.getBirthDate())
                        .deathDate(p.getDeathDate())
                        .build());
            }
        }
        return list;
    }

    private void updateFamilyAssociationsAfterRelationship(Person person, Person relatedPerson, Relationship.RelationshipType type, java.time.LocalDate marriageDate) {
        if (type == Relationship.RelationshipType.SPOUSE) {
            // 1. Save Marriage Entity
            if (marriageRepository.findMarriageBetween(person.getId(), relatedPerson.getId()).isEmpty()) {
                Marriage marriage = Marriage.builder()
                        .person1(person)
                        .person2(relatedPerson)
                        .marriageDate(marriageDate != null ? marriageDate : java.time.LocalDate.now())
                        .build();
                marriageRepository.save(marriage);
            }

            // 2. Link spouses to the same family or create a combined family record if needed
            java.util.Set<Family> pFamilies = new java.util.HashSet<>(person.getFamilies());
            java.util.Set<Family> rFamilies = new java.util.HashSet<>(relatedPerson.getFamilies());

            if (pFamilies.isEmpty() && rFamilies.isEmpty()) {
                // Create new combined family
                String famName = getFamilyName(person, relatedPerson);
                Family family = familyRepository.save(Family.builder().name(famName).build());
                person.getFamilies().add(family);
                relatedPerson.getFamilies().add(family);
            } else if (!pFamilies.isEmpty() && rFamilies.isEmpty()) {
                // Link relatedPerson to person's families
                relatedPerson.getFamilies().addAll(pFamilies);
            } else if (pFamilies.isEmpty() && !rFamilies.isEmpty()) {
                // Link person to relatedPerson's families
                person.getFamilies().addAll(rFamilies);
            } else {
                // Both have families. Create a combined family record and link both to it,
                // and link both to each other's existing families as well to unify them
                String famName = getFamilyName(person, relatedPerson);
                Family combined = familyRepository.save(Family.builder().name(famName).build());
                person.getFamilies().add(combined);
                relatedPerson.getFamilies().add(combined);
                person.getFamilies().addAll(rFamilies);
                relatedPerson.getFamilies().addAll(pFamilies);
            }

            personRepository.save(person);
            personRepository.save(relatedPerson);

        } else if (type == Relationship.RelationshipType.PARENT || type == Relationship.RelationshipType.CHILD) {
            Person parent = (type == Relationship.RelationshipType.PARENT) ? person : relatedPerson;
            Person child = (type == Relationship.RelationshipType.PARENT) ? relatedPerson : person;

            // Ensure parent has at least one family
            if (parent.getFamilies().isEmpty()) {
                String famName = parent.getLastName() + " Family";
                Family family = familyRepository.save(Family.builder().name(famName).build());
                parent.getFamilies().add(family);
                personRepository.save(parent);
            }

            // Get all families of parent
            java.util.Set<Family> parentFamilies = new java.util.HashSet<>(parent.getFamilies());

            // Also check for any spouses of the parent (the other parent)
            for (Relationship rel : parent.getRelationships()) {
                if (rel.getType() == Relationship.RelationshipType.SPOUSE) {
                    Person spouse = rel.getRelatedPerson();
                    parentFamilies.addAll(spouse.getFamilies());
                }
            }

            // Link child to all these families
            child.getFamilies().addAll(parentFamilies);
            personRepository.save(child);

        } else if (type == Relationship.RelationshipType.SIBLING) {
            // Siblings share same families
            java.util.Set<Family> pFamilies = new java.util.HashSet<>(person.getFamilies());
            java.util.Set<Family> rFamilies = new java.util.HashSet<>(relatedPerson.getFamilies());

            if (pFamilies.isEmpty() && rFamilies.isEmpty()) {
                String famName = person.getLastName() + " Family";
                Family family = familyRepository.save(Family.builder().name(famName).build());
                person.getFamilies().add(family);
                relatedPerson.getFamilies().add(family);
            } else {
                person.getFamilies().addAll(rFamilies);
                relatedPerson.getFamilies().addAll(pFamilies);
            }

            personRepository.save(person);
            personRepository.save(relatedPerson);
        }
    }

    private String getFamilyName(Person p1, Person p2) {
        String ln1 = p1.getLastName() != null ? p1.getLastName().trim() : "";
        String ln2 = p2.getLastName() != null ? p2.getLastName().trim() : "";
        if (ln1.isEmpty() && ln2.isEmpty()) {
            return "Combined Family";
        }
        if (ln1.equalsIgnoreCase(ln2)) {
            return ln1 + " Family";
        }
        if (ln1.isEmpty()) return ln2 + " Family";
        if (ln2.isEmpty()) return ln1 + " Family";
        return ln1 + " & " + ln2 + " Family";
    }
}
