package com.familytree.controller;

import com.familytree.dto.request.PhotoUploadRequest;
import com.familytree.security.UserDetailsImpl;
import com.familytree.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/upload/photo")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestBody PhotoUploadRequest req,
            @AuthenticationPrincipal UserDetailsImpl user) throws IOException {
        String url = photoService.uploadPhoto(req, user.getId());
        return ResponseEntity.ok(Collections.singletonMap("url", url));
    }

    @GetMapping("/{personId}")
    public ResponseEntity<String> getPhoto(@PathVariable Long personId) throws IOException {
        String base64 = photoService.getPhotoBase64(personId);
        return ResponseEntity.ok(base64);
    }
}
