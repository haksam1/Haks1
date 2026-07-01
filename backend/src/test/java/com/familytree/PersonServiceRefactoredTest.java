package com.familytree;

import com.familytree.dto.request.PersonRequest;
import com.familytree.dto.request.RelationshipRequest;
import com.familytree.dto.response.PersonResponse;
import com.familytree.exception.BadRequestException;
import com.familytree.model.FamilyTree;
import com.familytree.model.Person;
import com.familytree.model.Relationship;
import com.familytree.model.User;
import com.familytree.repository.FamilyTreeRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import com.familytree.service.PersonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PersonServiceRefactoredTest {

    @Autowired
    private PersonService personService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyTreeRepository treeRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private com.familytree.repository.RoleRepository roleRepository;

    @Autowired
    private com.familytree.repository.FamilyRepository familyRepository;

    @Autowired
    private com.familytree.repository.MarriageRepository marriageRepository;

    @Autowired
    private com.familytree.repository.PersonPhotoRepository personPhotoRepository;

    @Autowired
    private com.familytree.service.PhotoService photoService;

    private User testUser;
    private FamilyTree testTree;

    @BeforeEach
    void setUp() {
        com.familytree.model.Role familyHeadRole = roleRepository.findByName("Family Head")
                .orElseGet(() -> roleRepository.save(com.familytree.model.Role.builder()
                        .name("Family Head")
                        .permissions(java.util.Set.of("view_dashboard", "view_search", "view_settings", "manage_family"))
                        .build()));

        testUser = userRepository.findByEmail("test_refactored@example.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Test User")
                        .email("test_refactored@example.com")
                        .password("Password123!")
                        .role(familyHeadRole)
                        .build()));

        if (testUser.getRole() == null) {
            testUser.setRole(familyHeadRole);
            testUser = userRepository.save(testUser);
        }

        testTree = treeRepository.save(FamilyTree.builder()
                .name("Refactored Family Tree")
                .owner(testUser)
                .build());
    }

    @Test
    void testCreatePerson_DuplicateCheck() {
        PersonRequest p1 = new PersonRequest();
        p1.setFirstName("Alice");
        p1.setLastName("Smith");
        p1.setBirthDate(LocalDate.of(1990, 5, 10));
        p1.setGender("FEMALE");

        // First creation succeeds
        PersonResponse r1 = personService.create(testTree.getId(), p1, testUser.getId());
        assertNotNull(r1.getId());

        // Second creation with same name & DOB fails
        assertThrows(BadRequestException.class, () -> {
            personService.create(testTree.getId(), p1, testUser.getId());
        });
    }

    @Test
    void testUpdatePerson_DuplicateCheck() {
        PersonRequest p1 = new PersonRequest();
        p1.setFirstName("Alice");
        p1.setLastName("Smith");
        p1.setBirthDate(LocalDate.of(1990, 5, 10));
        p1.setGender("FEMALE");
        PersonResponse r1 = personService.create(testTree.getId(), p1, testUser.getId());

        PersonRequest p2 = new PersonRequest();
        p2.setFirstName("Bob");
        p2.setLastName("Smith");
        p2.setBirthDate(LocalDate.of(1992, 8, 15));
        p2.setGender("MALE");
        PersonResponse r2 = personService.create(testTree.getId(), p2, testUser.getId());

        // Try updating Bob's name and DOB to match Alice's -> should fail
        PersonRequest updateReq = new PersonRequest();
        updateReq.setFirstName("alice");
        updateReq.setLastName("smith");
        updateReq.setBirthDate(LocalDate.of(1990, 5, 10));
        updateReq.setGender("MALE");

        assertThrows(BadRequestException.class, () -> {
            personService.update(testTree.getId(), r2.getId(), updateReq, testUser.getId());
        });
    }

    @Test
    void testAddRelationship_GenderValidation() {
        // Create parent (female)
        PersonRequest parentReq = new PersonRequest();
        parentReq.setFirstName("Jane");
        parentReq.setLastName("Doe");
        parentReq.setBirthDate(LocalDate.of(1965, 3, 20));
        parentReq.setGender("FEMALE");
        PersonResponse parent = personService.create(testTree.getId(), parentReq, testUser.getId());

        // Create child
        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("John");
        childReq.setLastName("Doe");
        childReq.setBirthDate(LocalDate.of(1995, 10, 5));
        childReq.setGender("MALE");
        PersonResponse child = personService.create(testTree.getId(), childReq, testUser.getId());

        // Adding relationship "Jane is Father of John" should fail because Jane is female
        RelationshipRequest relReq = new RelationshipRequest();
        relReq.setRelatedPersonId(parent.getId());
        relReq.setType("FATHER");

        assertThrows(BadRequestException.class, () -> {
            personService.addRelationship(testTree.getId(), child.getId(), relReq, testUser.getId());
        });

        // Adding relationship "Jane is Mother of John" should succeed
        relReq.setType("MOTHER");
        personService.addRelationship(testTree.getId(), child.getId(), relReq, testUser.getId());

        // Verify bidirectional relationship creation
        Person childEntity = personRepository.findById(child.getId()).orElseThrow();
        Person parentEntity = personRepository.findById(parent.getId()).orElseThrow();

        // Jane is Mother of John -> John is CHILD of Jane. Jane is PARENT of John.
        // Direct relationship (John to Jane): John -> Jane (CHILD)
        boolean hasDirect = childEntity.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(parent.getId()) && r.getType() == Relationship.RelationshipType.CHILD);
        assertTrue(hasDirect);

        // Reverse relationship (Jane to John): Jane -> John (PARENT)
        boolean hasReverse = parentEntity.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(child.getId()) && r.getType() == Relationship.RelationshipType.PARENT);
        assertTrue(hasReverse);
    }

    @Test
    void testComplexRelationshipCalculation() {
        // Set up family tree:
        // Grandparent (GP) - Male
        // Parents: Parent1 (P1 - Male), Parent2 (P2 - Female, P1's sister)
        // Children: Child1 (C1 - Child of P1), Child2 (C2 - Child of P2)
        // GP is parent of P1 and P2.
        // C1 and C2 are cousins.
        // P2 is C1's aunt.
        // P1 is C2's uncle.
        // C2 is P1's niece/nephew.

        PersonRequest gpReq = new PersonRequest();
        gpReq.setFirstName("Grandpa");
        gpReq.setLastName("Doe");
        gpReq.setBirthDate(LocalDate.of(1940, 1, 1));
        gpReq.setGender("MALE");
        PersonResponse gp = personService.create(testTree.getId(), gpReq, testUser.getId());

        PersonRequest p1Req = new PersonRequest();
        p1Req.setFirstName("UncleP1");
        p1Req.setLastName("Doe");
        p1Req.setBirthDate(LocalDate.of(1970, 1, 1));
        p1Req.setGender("MALE");
        PersonResponse p1 = personService.create(testTree.getId(), p1Req, testUser.getId());

        PersonRequest p2Req = new PersonRequest();
        p2Req.setFirstName("AuntP2");
        p2Req.setLastName("Doe");
        p2Req.setBirthDate(LocalDate.of(1972, 1, 1));
        p2Req.setGender("FEMALE");
        PersonResponse p2 = personService.create(testTree.getId(), p2Req, testUser.getId());

        PersonRequest c1Req = new PersonRequest();
        c1Req.setFirstName("ChildC1");
        c1Req.setLastName("Doe");
        c1Req.setBirthDate(LocalDate.of(2000, 1, 1));
        c1Req.setGender("MALE");
        PersonResponse c1 = personService.create(testTree.getId(), c1Req, testUser.getId());

        PersonRequest c2Req = new PersonRequest();
        c2Req.setFirstName("ChildC2");
        c2Req.setLastName("Doe");
        c2Req.setBirthDate(LocalDate.of(2002, 1, 1));
        c2Req.setGender("FEMALE");
        PersonResponse c2 = personService.create(testTree.getId(), c2Req, testUser.getId());

        // Connect GP -> P1 (GP is Father of P1)
        RelationshipRequest rel1 = new RelationshipRequest();
        rel1.setRelatedPersonId(gp.getId());
        rel1.setType("FATHER");
        personService.addRelationship(testTree.getId(), p1.getId(), rel1, testUser.getId());

        // Connect GP -> P2 (GP is Father of P2)
        RelationshipRequest rel2 = new RelationshipRequest();
        rel2.setRelatedPersonId(gp.getId());
        rel2.setType("FATHER");
        personService.addRelationship(testTree.getId(), p2.getId(), rel2, testUser.getId());

        // Connect P1 -> C1 (P1 is Father of C1)
        RelationshipRequest rel3 = new RelationshipRequest();
        rel3.setRelatedPersonId(p1.getId());
        rel3.setType("FATHER");
        personService.addRelationship(testTree.getId(), c1.getId(), rel3, testUser.getId());

        // Connect P2 -> C2 (P2 is Mother of C2)
        RelationshipRequest rel4 = new RelationshipRequest();
        rel4.setRelatedPersonId(p2.getId());
        rel4.setType("MOTHER");
        personService.addRelationship(testTree.getId(), c2.getId(), rel4, testUser.getId());

        // Fetch C1 and check computed relationships
        PersonResponse updatedC1 = personService.getById(testTree.getId(), c1.getId(), testUser.getId());
        assertNotNull(updatedC1.getComputedRelationships());

        // GP is Grandfather of C1
        Optional<PersonResponse.ComputedRelationshipDto> gpRel = updatedC1.getComputedRelationships().stream()
                .filter(r -> r.getRelatedPersonId().equals(gp.getId()))
                .findFirst();
        assertTrue(gpRel.isPresent());
        assertEquals("Grandfather", gpRel.get().getTypeLabel());

        // P2 is Aunt of C1
        Optional<PersonResponse.ComputedRelationshipDto> auntRel = updatedC1.getComputedRelationships().stream()
                .filter(r -> r.getRelatedPersonId().equals(p2.getId()))
                .findFirst();
        assertTrue(auntRel.isPresent());
        assertEquals("Aunt", auntRel.get().getTypeLabel());

        // C2 is Cousin of C1
        Optional<PersonResponse.ComputedRelationshipDto> cousinRel = updatedC1.getComputedRelationships().stream()
                .filter(r -> r.getRelatedPersonId().equals(c2.getId()))
                .findFirst();
        assertTrue(cousinRel.isPresent());
        assertEquals("Cousin", cousinRel.get().getTypeLabel());
    }

    @Test
    void testImageCompressionAndDecompression() throws Exception {
        // Create person
        PersonRequest req = new PersonRequest();
        req.setFirstName("ImgTest");
        req.setLastName("User");
        req.setBirthDate(LocalDate.of(2000, 1, 1));
        req.setGender("MALE");
        PersonResponse person = personService.create(testTree.getId(), req, testUser.getId());

        // Base64 dummy image string
        String originalBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        
        com.familytree.dto.request.PhotoUploadRequest uploadReq = new com.familytree.dto.request.PhotoUploadRequest();
        uploadReq.setTreeId(testTree.getId());
        uploadReq.setPersonId(person.getId());
        uploadReq.setBase64Data(originalBase64);
        uploadReq.setFilename("test_dot.png");

        // Upload and compress
        String photoUrl = photoService.uploadPhoto(uploadReq, testUser.getId());
        assertNotNull(photoUrl);
        assertEquals("/api/upload/photo/" + person.getId(), photoUrl);

        // Retrieve and decompress
        String decompressed = photoService.getPhotoBase64(person.getId());
        assertEquals(originalBase64, decompressed);

        // Verify metadata in DB
        Optional<com.familytree.model.PersonPhoto> photoOpt = personPhotoRepository.findByPersonId(person.getId());
        assertTrue(photoOpt.isPresent());
        com.familytree.model.PersonPhoto photo = photoOpt.get();
        assertEquals("test_dot.png", photo.getFilename());
        assertEquals("image/png", photo.getFormat());
        assertTrue(photo.getSize() > 0);
        assertNotNull(photo.getCompressedBlob());
    }

    @Test
    void testFamilyMarriageAndChildAssociations() {
        // Create spouses
        PersonRequest husbandReq = new PersonRequest();
        husbandReq.setFirstName("George");
        husbandReq.setLastName("Smith");
        husbandReq.setBirthDate(LocalDate.of(1980, 1, 1));
        husbandReq.setGender("MALE");
        PersonResponse husband = personService.create(testTree.getId(), husbandReq, testUser.getId());

        PersonRequest wifeReq = new PersonRequest();
        wifeReq.setFirstName("Martha");
        wifeReq.setLastName("Jones");
        wifeReq.setBirthDate(LocalDate.of(1982, 1, 1));
        wifeReq.setGender("FEMALE");
        PersonResponse wife = personService.create(testTree.getId(), wifeReq, testUser.getId());

        // Marry them
        RelationshipRequest marryReq = new RelationshipRequest();
        marryReq.setRelatedPersonId(wife.getId());
        marryReq.setType("SPOUSE");
        marryReq.setMarriageDate(LocalDate.of(2010, 6, 15));
        personService.addRelationship(testTree.getId(), husband.getId(), marryReq, testUser.getId());

        // Verify Marriage record
        Optional<com.familytree.model.Marriage> marriageOpt = marriageRepository.findMarriageBetween(husband.getId(), wife.getId());
        assertTrue(marriageOpt.isPresent());
        assertEquals(LocalDate.of(2010, 6, 15), marriageOpt.get().getMarriageDate());

        // Spouses should be linked to the same family (combined family "Smith & Jones Family")
        Person husbandEntity = personRepository.findById(husband.getId()).orElseThrow();
        Person wifeEntity = personRepository.findById(wife.getId()).orElseThrow();
        assertFalse(husbandEntity.getFamilies().isEmpty());
        assertFalse(wifeEntity.getFamilies().isEmpty());
        
        // They should share at least one family
        boolean sharesFamily = husbandEntity.getFamilies().stream()
                .anyMatch(f -> wifeEntity.getFamilies().contains(f));
        assertTrue(sharesFamily);

        // Create a child
        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("Tommy");
        childReq.setLastName("Smith");
        childReq.setBirthDate(LocalDate.of(2015, 1, 1));
        childReq.setGender("MALE");
        PersonResponse child = personService.create(testTree.getId(), childReq, testUser.getId());

        // Link child to father
        RelationshipRequest childRel = new RelationshipRequest();
        childRel.setRelatedPersonId(husband.getId());
        childRel.setType("FATHER");
        personService.addRelationship(testTree.getId(), child.getId(), childRel, testUser.getId());

        // Tommy should automatically inherit the family associations of both parents (since George is married to Martha)
        Person tommyEntity = personRepository.findById(child.getId()).orElseThrow();
        assertFalse(tommyEntity.getFamilies().isEmpty());
        
        // Tommy's families should contain George's families
        boolean inheritsFatherFamily = husbandEntity.getFamilies().stream()
                .allMatch(f -> tommyEntity.getFamilies().contains(f));
        assertTrue(inheritsFatherFamily);

        // Tommy's families should also contain Martha's families because Martha is George's spouse
        boolean inheritsMotherFamily = wifeEntity.getFamilies().stream()
                .allMatch(f -> tommyEntity.getFamilies().contains(f));
        assertTrue(inheritsMotherFamily);
    }

    @Test
    void testDeletePerson_CascadesToUser() {
        // Create a person with an email address to trigger user auto-provisioning
        PersonRequest req = new PersonRequest();
        req.setFirstName("DeleteMe");
        req.setLastName("User");
        req.setBirthDate(LocalDate.of(1990, 1, 1));
        req.setGender("MALE");
        req.setEmail("deleteme@example.com");

        // Verify role "Family Member" exists, or create one for test
        roleRepository.findByName("Family Member")
                .orElseGet(() -> roleRepository.save(com.familytree.model.Role.builder()
                        .name("Family Member")
                        .permissions(java.util.Set.of("view_dashboard"))
                        .build()));

        PersonResponse person = personService.create(testTree.getId(), req, testUser.getId());
        assertNotNull(person.getId());

        // Verify User was created and linked to the Person
        Optional<User> associatedUserOpt = userRepository.findByPersonId(person.getId());
        assertTrue(associatedUserOpt.isPresent());
        User associatedUser = associatedUserOpt.get();
        assertEquals("deleteme@example.com", associatedUser.getEmail());

        // Now delete the person
        personService.delete(testTree.getId(), person.getId(), testUser.getId());

        // Verify Person was deleted
        Optional<Person> deletedPersonOpt = personRepository.findById(person.getId());
        assertTrue(deletedPersonOpt.isEmpty());

        // Verify User was deleted cascadingly
        Optional<User> deletedUserOpt = userRepository.findByPersonId(person.getId());
        assertTrue(deletedUserOpt.isEmpty());
    }

    @Test
    void testCreatePerson_WithSecondParent() {
        // Create parent A (male)
        PersonRequest pA = new PersonRequest();
        pA.setFirstName("Father");
        pA.setLastName("Smith");
        pA.setBirthDate(LocalDate.of(1980, 1, 1));
        pA.setGender("MALE");
        PersonResponse parentA = personService.create(testTree.getId(), pA, testUser.getId());

        // Create parent B (female, spouse of A)
        PersonRequest pB = new PersonRequest();
        pB.setFirstName("Mother");
        pB.setLastName("Smith");
        pB.setBirthDate(LocalDate.of(1982, 1, 1));
        pB.setGender("FEMALE");
        PersonResponse parentB = personService.create(testTree.getId(), pB, testUser.getId());

        // Link parent A and parent B as spouses
        RelationshipRequest spouseReq = new RelationshipRequest();
        spouseReq.setRelatedPersonId(parentB.getId());
        spouseReq.setType("SPOUSE");
        personService.addRelationship(testTree.getId(), parentA.getId(), spouseReq, testUser.getId());

        // Create child and specify both parent A and parent B (as secondParentId)
        PersonRequest childReq = new PersonRequest();
        childReq.setFirstName("Child");
        childReq.setLastName("Smith");
        childReq.setBirthDate(LocalDate.of(2010, 1, 1));
        childReq.setGender("MALE");
        childReq.setRelatedPersonId(parentA.getId());
        childReq.setRelationshipType("CHILD");
        childReq.setSecondParentId(parentB.getId());
        
        PersonResponse child = personService.create(testTree.getId(), childReq, testUser.getId());

        // Verify relationships of Child
        Person childEntity = personRepository.findById(child.getId()).orElseThrow();
        
        // Child should have PARENT relationships to both parentA and parentB
        boolean hasRelA = childEntity.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(parentA.getId()) && r.getType() == Relationship.RelationshipType.PARENT);
        boolean hasRelB = childEntity.getRelationships().stream()
                .anyMatch(r -> r.getRelatedPerson().getId().equals(parentB.getId()) && r.getType() == Relationship.RelationshipType.PARENT);
        
        assertTrue(hasRelA);
        assertTrue(hasRelB);
    }
}

