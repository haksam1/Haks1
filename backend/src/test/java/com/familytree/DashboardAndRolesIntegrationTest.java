package com.familytree;

import com.familytree.dto.request.ChangePasswordRequest;
import com.familytree.dto.request.PersonRequest;
import com.familytree.dto.request.RelationshipRequest;
import com.familytree.dto.response.PersonResponse;
import com.familytree.exception.BadRequestException;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.*;
import com.familytree.repository.*;
import com.familytree.service.AuthService;
import com.familytree.service.PersonService;
import com.familytree.service.TreeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DashboardAndRolesIntegrationTest {

    @Autowired
    private PersonService personService;

    @Autowired
    private TreeService treeService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FamilyTreeRepository treeRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private Role ownerRole;
    private Role headRole;
    private Role memberRole;

    private User adminUser;
    private User headUser1;
    private User headUser2;

    private FamilyTree tree1;
    private FamilyTree tree2;

    private Person personHead1;
    private Person personHead2;

    @BeforeEach
    void setUp() {
        // Setup Roles
        ownerRole = roleRepository.findByName("System Owner")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("System Owner")
                        .permissions(java.util.Set.of("manage_all"))
                        .build()));

        headRole = roleRepository.findByName("Family Head")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("Family Head")
                        .permissions(java.util.Set.of("manage_family"))
                        .build()));

        memberRole = roleRepository.findByName("Family Member")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("Family Member")
                        .permissions(java.util.Set.of("manage_self"))
                        .build()));

        // Setup Users
        adminUser = userRepository.save(User.builder()
                .name("Admin")
                .email("admin_test@familytree.com")
                .password("Pass123!")
                .role(ownerRole)
                .isActive(true)
                .build());

        headUser1 = userRepository.save(User.builder()
                .name("Head One")
                .email("head1@familytree.com")
                .password("Pass123!")
                .role(headRole)
                .isActive(true)
                .build());

        headUser2 = userRepository.save(User.builder()
                .name("Head Two")
                .email("head2@familytree.com")
                .password("Pass123!")
                .role(headRole)
                .isActive(true)
                .build());

        // Setup Trees
        tree1 = treeRepository.save(FamilyTree.builder()
                .name("Tree One")
                .owner(headUser1)
                .build());

        tree2 = treeRepository.save(FamilyTree.builder()
                .name("Tree Two")
                .owner(headUser2)
                .build());

        // Setup Persons
        personHead1 = personRepository.save(Person.builder()
                .tree(tree1)
                .firstName("Head")
                .lastName("One")
                .birthDate(LocalDate.of(1980, 1, 1))
                .gender("MALE")
                .email("head1@familytree.com")
                .createdBy(headUser1.getId())
                .modifyPermission("SELF_AND_ADMIN")
                .build());

        headUser1.setPersonId(personHead1.getId());
        userRepository.save(headUser1);

        personHead2 = personRepository.save(Person.builder()
                .tree(tree2)
                .firstName("Head")
                .lastName("Two")
                .birthDate(LocalDate.of(1982, 1, 1))
                .gender("FEMALE")
                .email("head2@familytree.com")
                .createdBy(headUser2.getId())
                .modifyPermission("SELF_AND_ADMIN")
                .build());

        headUser2.setPersonId(personHead2.getId());
        userRepository.save(headUser2);
    }

    @Test
    void testInvitationCreationAndActivationOnPasswordChange() {
        // 1. Create a child with email under tree1 -> should trigger invitation and User creation
        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("Child");
        childReq.setLastName("One");
        childReq.setBirthDate(LocalDate.of(2010, 5, 5));
        childReq.setGender("MALE");
        childReq.setEmail("child1@familytree.com");

        PersonResponse childRes = personService.create(tree1.getId(), childReq, headUser1.getId());
        assertNotNull(childRes.getId());

        // Verify pending user created
        User childUser = userRepository.findByEmail("child1@familytree.com")
                .orElse(null);
        assertNotNull(childUser);
        assertTrue(childUser.isTemporaryPassword());
        assertFalse(childUser.isActive());
        assertEquals(childRes.getId(), childUser.getPersonId());

        // Verify invitation created
        Invitation invite = invitationRepository.findByPersonId(childRes.getId())
                .orElse(null);
        assertNotNull(invite);
        assertEquals("PENDING", invite.getStatus());
        assertNotNull(invite.getTempPassword());

        // 2. Perform temporary password change
        ChangePasswordRequest changeReq = new ChangePasswordRequest();
        changeReq.setNewPassword("SecureNewPassword123!");
        authService.changePassword(childUser.getId(), changeReq);

        // Verify user is activated and no longer temp password
        User updatedChildUser = userRepository.findById(childUser.getId()).orElseThrow();
        assertFalse(updatedChildUser.isTemporaryPassword());
        assertTrue(updatedChildUser.isActive());

        // Verify invitation marked ACCEPTED
        Invitation updatedInvite = invitationRepository.findById(invite.getId()).orElseThrow();
        assertEquals("ACCEPTED", updatedInvite.getStatus());
    }

    @Test
    void testAccessRestrictionsForRegularMembers() {
        PersonRequest editReq = new PersonRequest();
        editReq.setFirstName("Hacked");
        editReq.setLastName("Two");
        editReq.setBirthDate(LocalDate.of(1982, 1, 1));
        editReq.setGender("FEMALE");

        // 1. Family Head 1 cannot access tree 2
        assertThrows(RuntimeException.class, () -> {
            personService.getAllByTree(tree2.getId(), headUser1.getId());
        });

        // 2. Family Head 1 cannot edit Head 2's profile (different tree) -> throws ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            personService.update(tree2.getId(), personHead2.getId(), editReq, headUser1.getId());
        });

        // 3. Family Head 1 cannot edit another member's profile in their own tree -> throws BadRequestException
        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("ChildOfHead1");
        childReq.setLastName("One");
        childReq.setBirthDate(LocalDate.of(2010, 5, 5));
        childReq.setGender("MALE");
        PersonResponse child = personService.create(tree1.getId(), childReq, headUser1.getId());

        assertThrows(BadRequestException.class, () -> {
            personService.update(tree1.getId(), child.getId(), editReq, headUser1.getId());
        });

        // 3. System Owner can view and edit tree 2
        List<PersonResponse> peopleInTree2 = personService.getAllByTree(tree2.getId(), adminUser.getId());
        assertEquals(1, peopleInTree2.size());

        PersonResponse updatedPerson2 = personService.update(tree2.getId(), personHead2.getId(), editReq, adminUser.getId());
        assertEquals("Hacked", updatedPerson2.getFirstName());
    }

    @Test
    void testAncestorFilterLogicForFamilyMember() {
        // Set up tree: Grandparent -> Father -> Child
        PersonRequest gpReq = new PersonRequest();
        gpReq.setFirstName("Grandpa");
        gpReq.setLastName("One");
        gpReq.setBirthDate(LocalDate.of(1950, 1, 1));
        gpReq.setGender("MALE");
        PersonResponse gp = personService.create(tree1.getId(), gpReq, headUser1.getId());

        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("Child");
        childReq.setLastName("One");
        childReq.setBirthDate(LocalDate.of(2005, 1, 1));
        childReq.setGender("FEMALE");
        childReq.setEmail("child_member@familytree.com");
        PersonResponse child = personService.create(tree1.getId(), childReq, headUser1.getId());

        // Establish relationships:
        // Grandpa is FATHER of Head1 (personHead1)
        RelationshipRequest rel1 = new RelationshipRequest();
        rel1.setRelatedPersonId(gp.getId());
        rel1.setType("FATHER");
        personService.addRelationship(tree1.getId(), personHead1.getId(), rel1, headUser1.getId());

        // Head1 is FATHER of Child
        RelationshipRequest rel2 = new RelationshipRequest();
        rel2.setRelatedPersonId(personHead1.getId());
        rel2.setType("FATHER");
        personService.addRelationship(tree1.getId(), child.getId(), rel2, headUser1.getId());

        // Add a Sibling of Head1 (Uncle) who is NOT an ancestor of Child
        PersonRequest uncleReq = new PersonRequest();
        uncleReq.setFirstName("Uncle");
        uncleReq.setLastName("One");
        uncleReq.setBirthDate(LocalDate.of(1983, 1, 1));
        uncleReq.setGender("MALE");
        PersonResponse uncle = personService.create(tree1.getId(), uncleReq, headUser1.getId());

        RelationshipRequest rel3 = new RelationshipRequest();
        rel3.setRelatedPersonId(gp.getId());
        rel3.setType("FATHER");
        personService.addRelationship(tree1.getId(), uncle.getId(), rel3, headUser1.getId());

        // Now activate the Child user (Family Member)
        User childUser = userRepository.findByEmail("child_member@familytree.com").orElseThrow();
        childUser.setActive(true);
        childUser.setTemporaryPassword(false);
        userRepository.save(childUser);

        // Fetch tree as Family Member (Child)
        // Should only return Child, Father (personHead1), and Grandfather (gp)
        // NOT the Uncle!
        List<PersonResponse> visiblePeople = personService.getAllByTree(tree1.getId(), childUser.getId());
        assertEquals(3, visiblePeople.size());

        boolean hasUncle = visiblePeople.stream()
                .anyMatch(p -> p.getId().equals(uncle.getId()));
        assertFalse(hasUncle);

        boolean hasGrandpa = visiblePeople.stream()
                .anyMatch(p -> p.getId().equals(gp.getId()));
        assertTrue(hasGrandpa);

        boolean hasFather = visiblePeople.stream()
                .anyMatch(p -> p.getId().equals(personHead1.getId()));
        assertTrue(hasFather);
    }
}
