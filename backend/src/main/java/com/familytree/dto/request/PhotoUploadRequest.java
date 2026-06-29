package com.familytree.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PhotoUploadRequest {
    @NotNull(message = "Tree ID is required")
    private Long treeId;

    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotBlank(message = "Base64 data is required")
    private String base64Data;

    @NotBlank(message = "Filename is required")
    private String filename;
}
