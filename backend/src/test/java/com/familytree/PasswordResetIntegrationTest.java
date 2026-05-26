package com.familytree;

import com.familytree.dto.request.PasswordResetRequest;
import com.familytree.dto.request.ResetPasswordSubmitRequest;
import com.familytree.exception.BadRequestException;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.PasswordResetToken;
import com.familytree.model.PendingEmailAndMessage;
import com.familytree.model.User;
import com.familytree.repository.PasswordResetTokenRepository;
import com.familytree.repository.PendingEmailAndMessageRepository;
import com.familytree.repository.UserRepository;
import com.familytree.service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PasswordResetIntegrationTest {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PendingEmailAndMessageRepository emailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    private User testUser;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        emailRepository.deleteAll();

        testUser = userRepository.findByEmail("john@example.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("John Doe")
                        .email("john@example.com")
                        .password(passwordEncoder.encode("OldPassword123!"))
                        .build()));
    }

    @Test
    void testRequestPasswordReset_Success() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("john@example.com");

        passwordResetService.requestPasswordReset(request);

        List<PasswordResetToken> tokens = tokenRepository.findAll();
        assertEquals(1, tokens.size());
        PasswordResetToken tokenObj = tokens.get(0);
        assertEquals(testUser.getId(), tokenObj.getUser().getId());
        assertNotNull(tokenObj.getResetToken());
        assertNotNull(tokenObj.getOtpCode());
        assertEquals(6, tokenObj.getOtpCode().length());
        assertFalse(tokenObj.isUsed());
        assertTrue(tokenObj.getExpiresAt().isAfter(LocalDateTime.now()));

        List<PendingEmailAndMessage> emails = emailRepository.findAll();
        assertEquals(1, emails.size());
        PendingEmailAndMessage queuedEmail = emails.get(0);
        assertEquals("john@example.com", queuedEmail.getEmail());
        assertEquals("Password Reset Request", queuedEmail.getSubject());
        assertTrue(queuedEmail.getMessage().contains(tokenObj.getResetToken()));
        assertTrue(queuedEmail.getMessage().contains(tokenObj.getOtpCode()));
        assertEquals("PENDING", queuedEmail.getStatus());
    }

    @Test
    void testRequestPasswordReset_UserNotFound() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("nonexistent@example.com");

        assertThrows(ResourceNotFoundException.class, () -> {
            passwordResetService.requestPasswordReset(request);
        });
    }

    @Test
    void testResetPassword_Success() {
        // First queue request to populate token
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("john@example.com");
        passwordResetService.requestPasswordReset(request);

        PasswordResetToken tokenObj = tokenRepository.findAll().get(0);

        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken(tokenObj.getResetToken());
        submitRequest.setOtpCode(tokenObj.getOtpCode());
        submitRequest.setNewPassword("SecureNewPass123!");

        passwordResetService.resetPassword(submitRequest);

        // Verify password updated in DB
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("SecureNewPass123!", updatedUser.getPassword()));

        // Verify token marked used
        PasswordResetToken updatedToken = tokenRepository.findById(tokenObj.getId()).orElseThrow();
        assertTrue(updatedToken.isUsed());
        assertNotNull(updatedToken.getUsedAt());
    }

    @Test
    void testResetPassword_TokenNotFound() {
        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken("invalid-token-uuid");
        submitRequest.setOtpCode("123456");
        submitRequest.setNewPassword("SecureNewPass123!");

        assertThrows(ResourceNotFoundException.class, () -> {
            passwordResetService.resetPassword(submitRequest);
        });
    }

    @Test
    void testResetPassword_TokenExpired() {
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .user(testUser)
                .resetToken("expired-token")
                .otpCode("123456")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .isUsed(false)
                .build();
        tokenRepository.save(expiredToken);

        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken("expired-token");
        submitRequest.setOtpCode("123456");
        submitRequest.setNewPassword("SecureNewPass123!");

        assertThrows(BadRequestException.class, () -> {
            passwordResetService.resetPassword(submitRequest);
        });
    }

    @Test
    void testResetPassword_TokenAlreadyUsed() {
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .user(testUser)
                .resetToken("used-token")
                .otpCode("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .isUsed(true)
                .usedAt(LocalDateTime.now().minusMinutes(5))
                .build();
        tokenRepository.save(usedToken);

        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken("used-token");
        submitRequest.setOtpCode("123456");
        submitRequest.setNewPassword("SecureNewPass123!");

        assertThrows(BadRequestException.class, () -> {
            passwordResetService.resetPassword(submitRequest);
        });
    }

    @Test
    void testResetPassword_OtpMismatch() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("john@example.com");
        passwordResetService.requestPasswordReset(request);

        PasswordResetToken tokenObj = tokenRepository.findAll().get(0);

        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken(tokenObj.getResetToken());
        submitRequest.setOtpCode("999999"); // Mismatched OTP code
        submitRequest.setNewPassword("SecureNewPass123!");

        assertThrows(BadRequestException.class, () -> {
            passwordResetService.resetPassword(submitRequest);
        });
    }

    @Test
    void testResetPassword_WeakPassword() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("john@example.com");
        passwordResetService.requestPasswordReset(request);

        PasswordResetToken tokenObj = tokenRepository.findAll().get(0);

        ResetPasswordSubmitRequest submitRequest = new ResetPasswordSubmitRequest();
        submitRequest.setToken(tokenObj.getResetToken());
        submitRequest.setOtpCode(tokenObj.getOtpCode());
        submitRequest.setNewPassword("weakpass"); // No uppercase, no digit, no special char

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            passwordResetService.resetPassword(submitRequest);
        });
        assertTrue(ex.getMessage().contains("strength requirements"));
    }
}
