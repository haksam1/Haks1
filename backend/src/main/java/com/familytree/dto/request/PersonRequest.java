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

    @jakarta.validation.constraints.NotNull(message = "Birth date is required")
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String gender;
    private String bio;
    private String phoneNumber;
    private String email;
    private String photoUrl;

    // Refactored fields
    private String relationshipType;
    private Long relatedPersonId;
    private Long secondParentId;
    private Boolean alive;
    private Boolean isParent;

    // Living child details
    private String childFirstName;
    private String childLastName;
    private String childEmail;
    private String childPhoneNumber;
    private LocalDate childBirthDate;
    private String childGender;
}
