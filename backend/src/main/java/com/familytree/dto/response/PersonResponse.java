package com.familytree.dto.response;

import com.familytree.model.Relationship.RelationshipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PersonResponse {
    private Long id;
    private Long treeId;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String gender;
    private String bio;
    private String photoUrl;
    private String phoneNumber;
    private String email;
    private Long createdBy;
    private String modifyPermission;
    private List<RelationshipDto> relationships;
    private List<ComputedRelationshipDto> computedRelationships;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RelationshipDto {
        private Long id;
        private Long relatedPersonId;
        private RelationshipType type;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ComputedRelationshipDto {
        private Long relatedPersonId;
        private String fullName;
        private String typeLabel;
        private String photoUrl;
        private LocalDate birthDate;
        private LocalDate deathDate;
    }
}
