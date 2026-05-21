package com.familytree.repository;

import com.familytree.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findAllByTreeId(Long treeId);
    Optional<Person> findByIdAndTreeId(Long id, Long treeId);

    @Query("SELECT p FROM Person p WHERE p.tree.owner.id = :userId AND " +
           "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Person> searchInUserTrees(@Param("query") String query, @Param("userId") Long userId);
}
