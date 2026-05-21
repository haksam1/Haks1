package com.familytree.service;

import com.familytree.dto.response.TreeResponse;
import com.familytree.exception.ResourceNotFoundException;
import com.familytree.model.FamilyTree;
import com.familytree.model.User;
import com.familytree.repository.FamilyTreeRepository;
import com.familytree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreeService {

    private final FamilyTreeRepository treeRepository;
    private final UserRepository userRepository;

    public List<TreeResponse> getAllByUserId(Long userId) {
        return treeRepository.findAllByOwnerId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TreeResponse getById(Long treeId, Long userId) {
        FamilyTree tree = treeRepository.findByIdAndOwnerId(treeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        return mapToResponse(tree);
    }

    @Transactional
    public TreeResponse create(String name, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FamilyTree tree = FamilyTree.builder()
                .name(name)
                .owner(owner)
                .build();

        return mapToResponse(treeRepository.save(tree));
    }

    @Transactional
    public void delete(Long treeId, Long userId) {
        FamilyTree tree = treeRepository.findByIdAndOwnerId(treeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));
        treeRepository.delete(tree);
    }

    private TreeResponse mapToResponse(FamilyTree tree) {
        return TreeResponse.builder()
                .id(tree.getId())
                .name(tree.getName())
                .ownerId(tree.getOwner().getId())
                .createdAt(tree.getCreatedAt())
                .build();
    }
}
