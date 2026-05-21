package com.familytree.service;

import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.Person;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.FamilyTreeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;

    @Transactional
    public String uploadPhoto(Long treeId, Long personId, MultipartFile file, Long userId) throws IOException {
        treeRepository.findByIdAndOwnerId(treeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found or access denied"));

        Person person = personRepository.findByIdAndTreeId(personId, treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        String photoUrl = "/uploads/" + filename;
        person.setPhotoUrl(photoUrl);
        personRepository.save(person);

        return photoUrl;
    }
}
