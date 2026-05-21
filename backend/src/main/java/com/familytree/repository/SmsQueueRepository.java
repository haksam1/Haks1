package com.familytree.repository;

import com.familytree.model.SmsQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SmsQueueRepository extends JpaRepository<SmsQueue, Long> {
    List<SmsQueue> findAllByStatus(String status);
}
