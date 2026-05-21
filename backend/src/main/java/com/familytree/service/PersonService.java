package com.familytree.service;

import com.familytree.dto.request.PersonRequest;
import com.familytree.dto.request.RelationshipRequest;
import com.familytree.dto.response.PersonResponse;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.FamilyTree;
import com.familytree.model.Person;
import com.familytree.model.Relationship;
import com.familytree.repository.FamilyTreeRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.RelationshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonService {

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;
    private final RelationshipRepository relationshipRepository;

    public List<PersonResponse> getAllByTree(Long treeId, Long userId) {
        validateOwnership(treeId, userId);
        return personRepository.findAllByTreeId(treeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PersonResponse getById(Long treeId, Long personId, Long userId) {
        validateOwnership(treeId, userId);
        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        return mapToResponse(person);
    }

    @Transactional
    public PersonResponse create(Long treeId, PersonRequest req, Long userId) {
        FamilyTree tree = validateOwnership(treeId, userId);
        Person person = Person.builder()
                .tree(tree)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .birthDate(req.getBirthDate())
                .deathDate(req.getDeathDate())
                .gender(req.getGender())
                .bio(req.getBio())
                .phoneNumber(req.getPhoneNumber())
                .build();
        return mapToResponse(personRepository.save(person));
    }

    @Transactional
    public PersonResponse update(Long treeId, Long personId, PersonRequest req, Long userId) {
        validateOwnership(treeId, userId);
        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));

        person.setFirstName(req.getFirstName());
        person.setLastName(req.getLastName());
        person.setBirthDate(req.getBirthDate());
        person.setDeathDate(req.getDeathDate());
        person.setGender(req.getGender());
        person.setBio(req.getBio());
        person.setPhoneNumber(req.getPhoneNumber());

        return mapToResponse(personRepository.save(person));
    }

    @Transactional
    public void delete(Long treeId, Long personId, Long userId) {
        validateOwnership(treeId, userId);
        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        personRepository.delete(person);
    }

    @Transactional
    public void addRelationship(Long treeId, Long personId, RelationshipRequest req, Long userId) {
        validateOwnership(treeId, userId);
        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        Person relatedPerson = personRepository.findByIdAndTreeId(req.getRelatedPersonId(), treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Related person not found"));

        Relationship relationship = Relationship.builder()
                .person(person)
                .relatedPerson(relatedPerson)
                .type(req.getType())
                .build();

        relationshipRepository.save(relationship);
    }

    public List<PersonResponse> search(String query, Long userId) {
        return personRepository.searchInUserTrees(query, userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FamilyTree validateOwnership(Long treeId, Long userId) {
        return treeRepository.findByIdAndOwnerId(treeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found or access denied"));
    }

    private PersonResponse mapToResponse(Person p) {
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
                .relationships(p.getRelationships() == null ? java.util.Collections.emptyList() : p.getRelationships().stream()
                        .map(r -> PersonResponse.RelationshipDto.builder()
                                .id(r.getId())
                                .relatedPersonId(r.getRelatedPerson().getId())
                                .type(r.getType())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
