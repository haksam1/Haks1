package com.familytree.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ParentSetupRequest {
    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    private String email;
}
