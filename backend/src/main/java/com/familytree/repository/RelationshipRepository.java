package com.familytree.repository;

import com.familytree.model.Relationship;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RelationshipRepository extends JpaRepository<Relationship, Long> {
    List<Relationship> findAllByPersonId(Long personId);
    void deleteByPersonIdOrRelatedPersonId(Long personId, Long relatedPersonId);
}
