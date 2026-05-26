package com.familytree.repository;

import com.familytree.model.PendingEmailAndMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PendingEmailAndMessageRepository extends JpaRepository<PendingEmailAndMessage, Long> {
    List<PendingEmailAndMessage> findByStatus(String status);
    List<PendingEmailAndMessage> findFirst3ByStatus(String status);
}
