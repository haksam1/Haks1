package com.familytree.controller;

import com.familytree.security.UserDetailsImpl;
import com.familytree.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @RequestParam Long treeId,
            @RequestParam Long personId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl user) throws IOException {
        String url = photoService.uploadPhoto(treeId, personId, file, user.getId());
        return ResponseEntity.ok(Collections.singletonMap("url", url));
    }
}
