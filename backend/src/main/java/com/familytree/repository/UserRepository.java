package com.familytree.repository;

import com.familytree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPersonId(Long personId);
    boolean existsByEmail(String email);
}
