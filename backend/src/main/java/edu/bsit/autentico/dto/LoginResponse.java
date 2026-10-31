package edu.bsit.autentico.dto;

public record LoginResponse(
    String token,
    UserResponse user
) {}
