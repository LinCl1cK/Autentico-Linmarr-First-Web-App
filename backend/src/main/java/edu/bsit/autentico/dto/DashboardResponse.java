package edu.bsit.autentico.dto;

public record DashboardResponse(
    UserResponse profile,
    long totalUserCount
) {}
