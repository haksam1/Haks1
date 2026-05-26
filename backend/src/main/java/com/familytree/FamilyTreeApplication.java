package com.familytree;

import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDate;
import java.util.Arrays;

@SpringBootApplication
@RequiredArgsConstructor
@EnableScheduling
public class FamilyTreeApplication {

    private final PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(FamilyTreeApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File envFile = new java.io.File(".env");
        if (!envFile.exists()) {
            envFile = new java.io.File("../.env");
        }
        if (envFile.exists()) {
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIndex = line.indexOf('=');
                    if (eqIndex > 0) {
                        String key = line.substring(0, eqIndex).trim();
                        String val = line.substring(eqIndex + 1).trim();
                        if (val.startsWith("\"") && val.endsWith("\"")) {
                            val = val.substring(1, val.length() - 1);
                        } else if (val.startsWith("'") && val.endsWith("'")) {
                            val = val.substring(1, val.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, val);
                        }
                    }
                }
            } catch (java.io.IOException e) {
                // Silently ignore
            }
        }
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
