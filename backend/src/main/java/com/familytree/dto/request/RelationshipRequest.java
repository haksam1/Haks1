package com.familytree.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RelationshipRequest {
    @NotNull(message = "Related person ID is required")
    private Long relatedPersonId;

    @NotNull(message = "Relationship type is required")
    private String type;

    private LocalDate marriageDate;
}
