package com.familytree.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "marriages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person1_id", nullable = false)
    private Person person1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person2_id", nullable = false)
    private Person person2;

    @Column(name = "marriage_date")
    private LocalDate marriageDate;
}
