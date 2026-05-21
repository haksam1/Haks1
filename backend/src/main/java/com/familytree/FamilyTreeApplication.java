package com.familytree;

import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Arrays;

@SpringBootApplication
@RequiredArgsConstructor
public class FamilyTreeApplication {

    private final PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(FamilyTreeApplication.class, args);
    }

    @Bean
    public CommandLineRunner seeder(UserRepository userRepository, FamilyTreeRepository treeRepository,
                                   PersonRepository personRepository, RelationshipRepository relationshipRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User user = User.builder()
                        .name("John Doe")
                        .email("john@example.com")
                        .password(passwordEncoder.encode("password"))
                        .build();
                userRepository.save(user);

                FamilyTree tree = FamilyTree.builder()
                        .name("My Family Tree")
                        .owner(user)
                        .build();
                treeRepository.save(tree);

                // G1: Grandparents
                Person g1m = Person.builder().tree(tree).firstName("Robert").lastName("Doe").birthDate(LocalDate.of(1940, 5, 12)).gender("MALE").build();
                Person g1f = Person.builder().tree(tree).firstName("Mary").lastName("Doe").birthDate(LocalDate.of(1945, 8, 20)).gender("FEMALE").build();
                personRepository.saveAll(Arrays.asList(g1m, g1f));

                // G2: Parents
                Person g2m = Person.builder().tree(tree).firstName("James").lastName("Doe").birthDate(LocalDate.of(1970, 3, 15)).gender("MALE").build();
                personRepository.save(g2m);

                // G3: Children
                Person g3 = Person.builder().tree(tree).firstName("John").lastName("Doe").birthDate(LocalDate.of(1995, 1, 10)).gender("MALE").build();
                personRepository.save(g3);

                // Relationships
                relationshipRepository.save(Relationship.builder().person(g1m).relatedPerson(g1f).type(Relationship.RelationshipType.SPOUSE).build());
                relationshipRepository.save(Relationship.builder().person(g1m).relatedPerson(g2m).type(Relationship.RelationshipType.PARENT).build());
                relationshipRepository.save(Relationship.builder().person(g1f).relatedPerson(g2m).type(Relationship.RelationshipType.PARENT).build());
                relationshipRepository.save(Relationship.builder().person(g2m).relatedPerson(g3).type(Relationship.RelationshipType.PARENT).build());
            }
        };
    }
}
