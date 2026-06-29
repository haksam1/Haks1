package com.familytree.repository;

import com.familytree.model.Marriage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface MarriageRepository extends JpaRepository<Marriage, Long> {
    @Query("SELECT m FROM Marriage m WHERE " +
           "(m.person1.id = :p1 AND m.person2.id = :p2) OR " +
           "(m.person1.id = :p2 AND m.person2.id = :p1)")
    Optional<Marriage> findMarriageBetween(@Param("p1") Long person1Id, @Param("p2") Long person2Id);
    void deleteByPerson1IdOrPerson2Id(Long person1Id, Long person2Id);
}
