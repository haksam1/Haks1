package com.familytree.controller;

import com.familytree.dto.response.PersonResponse;
import com.familytree.security.UserDetailsImpl;
import com.familytree.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/persons/search")
@RequiredArgsConstructor
public class SearchController {

    private final PersonService personService;

    @GetMapping
    public ResponseEntity<List<PersonResponse>> search(
            @RequestParam String q,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(personService.search(q, user.getId()));
    }
}
