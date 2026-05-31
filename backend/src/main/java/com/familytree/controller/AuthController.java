package com.familytree.controller;

import com.familytree.dto.request.LoginRequest;
import com.familytree.dto.request.RegisterRequest;
import com.familytree.dto.request.PasswordResetRequest;
import com.familytree.dto.request.ResetPasswordSubmitRequest;
import com.familytree.dto.response.AuthResponse;
import com.familytree.service.AuthService;
import com.familytree.service.PasswordResetService;
import com.familytree.dto.request.ChangePasswordRequest;
import com.familytree.security.UserDetailsImpl;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest req) {
        passwordResetService.requestPasswordReset(req);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Password reset instructions have been sent to your email."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordSubmitRequest req) {
        passwordResetService.resetPassword(req);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Your password has been successfully reset."
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(user.getId(), req);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Your password has been successfully updated."
        ));
    }
}
