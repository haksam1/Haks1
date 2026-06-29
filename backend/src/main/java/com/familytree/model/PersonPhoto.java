package com.familytree.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "person_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false, unique = true)
    private Person person;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(nullable = false, length = 100)
    private String format;

    @Column(nullable = false)
    private Long size;

    @Column(name = "compressed_blob", nullable = false)
    private byte[] compressedBlob;
}
