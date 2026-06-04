package com.familytree.controller;

import com.familytree.dto.response.TreeResponse;
import com.familytree.dto.response.PersonResponse;
import com.familytree.service.TreeService;
import com.familytree.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/trees")
@RequiredArgsConstructor
public class PublicTreeController {

    private final TreeService treeService;
    private final PersonService personService;

    @GetMapping
    public ResponseEntity<List<TreeResponse>> getPublicTrees() {
        return ResponseEntity.ok(treeService.getPublicTrees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TreeResponse> getPublicTree(@PathVariable Long id) {
        return ResponseEntity.ok(treeService.getPublicTree(id));
    }

    @GetMapping("/{id}/persons")
    public ResponseEntity<List<PersonResponse>> getPublicPersons(@PathVariable Long id) {
        return ResponseEntity.ok(personService.getAllByTree(id, null));
    }

    @GetMapping("/{id}/persons/{personId}")
    public ResponseEntity<PersonResponse> getPublicPerson(@PathVariable Long id, @PathVariable Long personId) {
        return ResponseEntity.ok(personService.getById(id, personId, null));
    }
}
