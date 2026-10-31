package edu.bsit.autentico.controller;

import edu.bsit.autentico.dto.LoginRequest;
import edu.bsit.autentico.dto.LoginResponse;
import edu.bsit.autentico.dto.RegisterRequest;
import edu.bsit.autentico.dto.UserResponse;
import edu.bsit.autentico.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = userService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        userService.logout(tokenHeader);
        return ResponseEntity.noContent().build(); // 204 - session token is now invalid
    }
}
