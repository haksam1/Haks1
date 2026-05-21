package com.familytree.dto.request;

import com.familytree.model.Relationship.RelationshipType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RelationshipRequest {
    @NotNull(message = "Related person ID is required")
    private Long relatedPersonId;

    @NotNull(message = "Relationship type is required")
    private RelationshipType type;
}
