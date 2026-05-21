package com.familytree.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;
import lombok.Data;

@Data
public class RoleRequest {
    @NotBlank(message = "Role name is required")
    private String name;

    private Set<String> permissions;
}
