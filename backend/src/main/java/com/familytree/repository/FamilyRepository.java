package com.familytree.repository;

import com.familytree.model.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FamilyRepository extends JpaRepository<Family, Long> {
    Optional<Family> findByName(String name);
}
