package com.familytree.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordSubmitRequest {

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "OTP code is required")
    @Size(min = 6, max = 6, message = "OTP code must be exactly 6 digits")
    @JsonAlias({"otp_code", "otpCode"})
    private String otpCode;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @JsonAlias({"new_password", "newPassword"})
    private String newPassword;
}
