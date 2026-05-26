package com.familytree.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PendingEmailAndMessageRepository emailRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern PASSWORD_STRENGTH_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    );

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        // 1. Validate email exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // 2. Generate secure reset token & 6-digit OTP
        String resetToken = UUID.randomUUID().toString();
        String otpCode = generateSecureOtp();

        // 3. Save token in password_reset_tokens table (expires in 15 minutes)
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .resetToken(resetToken)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .isUsed(false)
                .build();
        tokenRepository.save(token);

        // 4. Construct email message containing reset link, token, and OTP
        String resetLink = baseUrl + "/reset-password?token=" + resetToken;
        String emailMessageBody = String.format(
                "Hello %s,\n\n" +
                "You requested to reset your password. Please use the following details to complete the reset:\n\n" +
                "Reset Link: %s\n" +
                "Token: %s\n" +
                "OTP Code: %s\n\n" +
                "This reset request will expire in 15 minutes.\n\n" +
                "If you did not request this, please ignore this email.",
                user.getName(),
                resetLink,
                resetToken,
                otpCode
        );

        // 5. Insert email into pending_emails_and_messages table
        PendingEmailAndMessage pendingEmail = PendingEmailAndMessage.builder()
                .email(user.getEmail())
                .subject("Password Reset Request")
                .message(emailMessageBody)
                .status("PENDING")
                .build();
        emailRepository.save(pendingEmail);
    }

    @Transactional
    public void resetPassword(ResetPasswordSubmitRequest request) {
        // 1. Validate token exists
        PasswordResetToken token = tokenRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized reset token"));

        // 2. Validate token not expired
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("The password reset token has expired");
        }

        // 3. Validate token not used
        if (token.isUsed()) {
            throw new BadRequestException("The password reset token has already been used");
        }

        // 4. Validate OTP matches
        if (!token.getOtpCode().equals(request.getOtpCode())) {
            throw new BadRequestException("Invalid OTP code");
        }

        // 5. Validate password strength
        validatePasswordStrength(request.getNewPassword());

        // 6. Hash password using BCrypt & Update user password
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 7. Mark token as used & set used_at timestamp
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    private String generateSecureOtp() {
        SecureRandom random = new SecureRandom();
        int num = random.nextInt(1000000);
        return String.format("%06d", num);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || !PASSWORD_STRENGTH_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(
                    "Password does not meet strength requirements. " +
                    "It must be at least 8 characters long and contain at least one uppercase letter, " +
                    "one lowercase letter, one digit, and one special character (@$!%*?&)."
            );
        }
    }
}
