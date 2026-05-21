package com.familytree.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PersonRequest {
    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    private LocalDate birthDate;
    private LocalDate deathDate;
    private String gender;
    private String bio;
    private String phoneNumber;
}
