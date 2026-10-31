package edu.bsit.autentico.dto;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String role,
    LocalDateTime createdAt
) {}
