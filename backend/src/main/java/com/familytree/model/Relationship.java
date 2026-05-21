package com.familytree.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "relationships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Relationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_person_id", nullable = false)
    private Person relatedPerson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RelationshipType type;

    public enum RelationshipType {
        PARENT, CHILD, SPOUSE, SIBLING
    }
}
