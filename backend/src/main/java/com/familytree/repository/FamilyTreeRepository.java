package com.familytree.repository;

import com.familytree.model.FamilyTree;
import com.familytree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, Long> {
    List<FamilyTree> findAllByOwnerId(Long ownerId);
    Optional<FamilyTree> findByIdAndOwnerId(Long id, Long ownerId);
    List<FamilyTree> findAllByView(String view);
}
