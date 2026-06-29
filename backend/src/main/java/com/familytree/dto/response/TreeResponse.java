package com.familytree.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TreeResponse {
    private Long id;
    private String name;
    private Long ownerId;
    private LocalDateTime createdAt;
    private String view;
    private List<String> memberPhotos;
    private Integer memberCount;
}
