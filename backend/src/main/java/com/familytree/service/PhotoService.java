package com.familytree.service;

import com.familytree.dto.request.PhotoUploadRequest;
import com.familytree.exception.BadRequestException;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.Person;
import com.familytree.model.PersonPhoto;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.FamilyTreeRepository;
import com.familytree.repository.PersonPhotoRepository;
import com.familytree.repository.UserRepository;
import com.familytree.util.ZipUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;
    private final PersonPhotoRepository personPhotoRepository;
    private final UserRepository userRepository;

    @Transactional
    public String uploadPhoto(PhotoUploadRequest req, Long userId) throws IOException {
        validateAccess(req.getTreeId(), userId);

        Person person = personRepository.findByIdAndTreeId(req.getPersonId(), req.getTreeId())
                .orElseThrow(() -> new ResourceNotFoundException("Person not found"));

        String base64Data = req.getBase64Data();
        String format = "image/png";

        if (base64Data.startsWith("data:") && base64Data.contains(";base64,")) {
            int colonIdx = base64Data.indexOf(":");
            int semiIdx = base64Data.indexOf(";");
            if (colonIdx != -1 && semiIdx != -1 && colonIdx < semiIdx) {
                format = base64Data.substring(colonIdx + 1, semiIdx);
            }
        }

        // Calculate original size of decoded image bytes
        String base64Content = base64Data;
        if (base64Data.contains(";base64,")) {
            base64Content = base64Data.substring(base64Data.indexOf(";base64,") + 8);
        }
        byte[] decodedBytes = Base64.getDecoder().decode(base64Content.trim());
        long originalSize = decodedBytes.length;

        // Compress
        byte[] zipBytes = ZipUtils.compressStringToZip(base64Data, req.getFilename());

        // Validate that image compression and decompression works reliably before saving
        String decompressed = ZipUtils.decompressZipToString(zipBytes);
        if (!decompressed.equals(base64Data)) {
            throw new IllegalStateException("Validation of image compression/decompression failed!");
        }

        // Save to DB
        PersonPhoto photo = personPhotoRepository.findByPersonId(person.getId())
                .orElseGet(() -> PersonPhoto.builder().person(person).build());

        photo.setFilename(req.getFilename());
        photo.setFormat(format);
        photo.setSize(originalSize);
        photo.setCompressedBlob(zipBytes);
        personPhotoRepository.save(photo);

        String photoUrl = "/api/upload/photo/" + person.getId();
        person.setPhotoUrl(photoUrl);
        personRepository.save(person);

        return photoUrl;
    }

    @Transactional(readOnly = true)
    public String getPhotoBase64(Long personId) throws IOException {
        PersonPhoto photo = personPhotoRepository.findByPersonId(personId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found for person: " + personId));
        return ZipUtils.decompressZipToString(photo.getCompressedBlob());
    }

    private void validateAccess(Long treeId, Long userId) {
        com.familytree.model.FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        if ("yes".equals(tree.getView())) {
            return;
        }

        if (userId == null) {
            throw new ResourceNotFoundException("User not found");
        }

        com.familytree.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("System Owner".equals(role)) {
            return;
        } else if ("Family Head".equals(role)) {
            if (!tree.getOwner().getId().equals(userId)) {
                throw new ResourceNotFoundException("Tree not found or access denied");
            }
        } else if ("Family Member".equals(role) || "Parent Admin".equals(role)) {
            if (user.getPersonId() == null) {
                throw new BadRequestException("User profile is not linked to any family member");
            }
            Person p = personRepository.findById(user.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Member profile not found"));
            if (!p.getTree().getId().equals(treeId)) {
                throw new BadRequestException("Access denied to this family tree");
            }
        } else {
            throw new BadRequestException("Unauthorized role: " + role);
        }
    }
}
