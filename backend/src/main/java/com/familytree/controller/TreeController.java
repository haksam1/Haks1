package com.familytree.controller;

import com.familytree.dto.response.TreeResponse;
import com.familytree.security.UserDetailsImpl;
import com.familytree.service.TreeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trees")
@RequiredArgsConstructor
public class TreeController {

    private final TreeService treeService;

    @GetMapping
    public ResponseEntity<List<TreeResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(treeService.getAllByUserId(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TreeResponse> getById(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(treeService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<TreeResponse> create(@RequestBody Map<String, String> payload, @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(treeService.create(payload.get("name"), user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl user) {
        treeService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/view")
    public ResponseEntity<TreeResponse> updateView(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(treeService.updateView(id, payload.get("view"), user.getId()));
    }

    @GetMapping("/{id}/invitations")
    public ResponseEntity<List<Map<String, Object>>> getInvitations(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(treeService.getInvitations(id, user.getId()));
    }

    @PostMapping("/{id}/invitations/{invitationId}/resend")
    public ResponseEntity<Map<String, String>> resendInvitation(
            @PathVariable Long id,
            @PathVariable Long invitationId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        treeService.resendInvitation(id, invitationId, user.getId());
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Invitation resentment queued successfully"
        ));
    }
}
