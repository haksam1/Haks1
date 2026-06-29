package com.familytree.repository;

import com.familytree.model.PersonPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PersonPhotoRepository extends JpaRepository<PersonPhoto, Long> {
    Optional<PersonPhoto> findByPersonId(Long personId);
    void deleteByPersonId(Long personId);
}
