package com.familytree.repository;

import com.familytree.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    List<Invitation> findAllByTreeId(Long treeId);
    Optional<Invitation> findByPersonId(Long personId);
    Optional<Invitation> findByEmail(String email);
}
