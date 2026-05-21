package com.familytree.controller;

import com.familytree.dto.request.PersonRequest;
import com.familytree.dto.request.RelationshipRequest;
import com.familytree.dto.response.PersonResponse;
import com.familytree.security.UserDetailsImpl;
import com.familytree.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trees/{treeId}/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    @GetMapping
    public ResponseEntity<List<PersonResponse>> getAll(
            @PathVariable Long treeId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(personService.getAllByTree(treeId, user.getId()));
    }

    @GetMapping("/{personId}")
    public ResponseEntity<PersonResponse> getById(
            @PathVariable Long treeId,
            @PathVariable Long personId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(personService.getById(treeId, personId, user.getId()));
    }

    @PostMapping
    public ResponseEntity<PersonResponse> create(
            @PathVariable Long treeId,
            @Valid @RequestBody PersonRequest req,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(personService.create(treeId, req, user.getId()));
    }

    @PutMapping("/{personId}")
    public ResponseEntity<PersonResponse> update(
            @PathVariable Long treeId,
            @PathVariable Long personId,
            @Valid @RequestBody PersonRequest req,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(personService.update(treeId, personId, req, user.getId()));
    }

    @DeleteMapping("/{personId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long treeId,
            @PathVariable Long personId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        personService.delete(treeId, personId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{personId}/relationships")
    public ResponseEntity<Void> addRelationship(
            @PathVariable Long treeId,
            @PathVariable Long personId,
            @Valid @RequestBody RelationshipRequest req,
            @AuthenticationPrincipal UserDetailsImpl user) {
        personService.addRelationship(treeId, personId, req, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
