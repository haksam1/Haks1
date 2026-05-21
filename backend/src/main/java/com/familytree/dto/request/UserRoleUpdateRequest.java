package com.familytree.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRoleUpdateRequest {
    @NotNull(message = "Role ID is required")
    private Long roleId;
}
