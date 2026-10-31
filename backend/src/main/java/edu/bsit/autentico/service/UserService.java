package edu.bsit.autentico.service;

import edu.bsit.autentico.dto.*;
import edu.bsit.autentico.model.User;
import edu.bsit.autentico.repository.UserRepository;
import edu.bsit.autentico.exception.AuthException;
import edu.bsit.autentico.exception.ForbiddenException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    // Default admin account created at startup when no ADMIN exists yet
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String DEFAULT_ADMIN_NAME = "System Administrator";
    private static final String DEFAULT_ADMIN_EMAIL = "admin@example.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@12345";

    private final UserRepository userRepository;
    private final ConcurrentHashMap<String, Long> sessionTokens = new ConcurrentHashMap<>();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Registers a new user account if the email is not already taken.
     */
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(hashPassword(request.password()));

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    /**
     * Creates the default ADMIN account if the database has no admin yet.
     * Called once at startup by the CommandLineRunner in UserhubApplication.
     */
    public void seedAdminUser() {
        if (userRepository.existsByRole(ADMIN_ROLE)) {
            return; // An admin already exists - nothing to do
        }

        if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            // Don't silently promote an existing regular account to ADMIN
            log.warn("Skipping admin seed: {} is already registered as a non-admin user.", DEFAULT_ADMIN_EMAIL);
            return;
        }

        User admin = new User();
        admin.setFullName(DEFAULT_ADMIN_NAME);
        admin.setEmail(DEFAULT_ADMIN_EMAIL);
        admin.setPassword(hashPassword(DEFAULT_ADMIN_PASSWORD));
        admin.setRole(ADMIN_ROLE);
        userRepository.save(admin);

        log.info("Seeded default admin account: {}", DEFAULT_ADMIN_EMAIL);
    }

    /**
     * Authenticates a user's credentials and issues an active session token.
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        String incomingHash = hashPassword(request.password());
        if (!user.getPassword().equals(incomingHash)) {
            throw new AuthException("Invalid email or password");
        }

        String token = UUID.randomUUID().toString();
        sessionTokens.put(token, user.getId());

        UserResponse userResponse = mapToUserResponse(user);
        return new LoginResponse(token, userResponse);
    }

    /**
     * Invalidates the caller's session token server-side so it can no longer be used.
     */
    public void logout(String authorizationHeader) {
        String token = extractToken(authorizationHeader);

        // remove() returns null when the token was never issued or was already invalidated
        if (sessionTokens.remove(token) == null) {
            throw new AuthException("Invalid or expired session token");
        }
    }

    /**
     * Extracts a Bearer token from the HTTP Authorization header and returns the authenticated User.
     */
    public User authenticate(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        Long userId = sessionTokens.get(token);

        if (userId == null) {
            throw new AuthException("Invalid or expired session token");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User session valid, but account not found"));
    }

    /**
     * Updates the authenticated user's own display name.
     */
    public UserResponse updateProfile(String authorizationHeader, UpdateProfileRequest request) {
        User user = authenticate(authorizationHeader);
        user.setFullName(request.fullName().trim());

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    /**
     * Enforces role-based security clearance rules.
     */
    public void requireRole(User user, String requiredRole) {
        if (!user.getRole().equalsIgnoreCase(requiredRole)) {
            throw new ForbiddenException("Forbidden: Access denied. Requires " + requiredRole + " role.");
        }
    }

    public long getTotalUserCount() {
        return userRepository.count();
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AuthException("Missing or invalid Authorization header");
        }
        return authorizationHeader.substring(7);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Critical security error: SHA-256 hashing algorithm not found", e);
        }
    }

    public UserResponse mapToUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
}
