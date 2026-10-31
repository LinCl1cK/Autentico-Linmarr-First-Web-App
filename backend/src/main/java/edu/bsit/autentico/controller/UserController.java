package edu.bsit.autentico.controller;

import edu.bsit.autentico.dto.UpdateProfileRequest;
import edu.bsit.autentico.dto.UserResponse;
import edu.bsit.autentico.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lets the authenticated user update their own full name.
     */
    @PutMapping("/me")
    public UserResponse updateMyProfile(
            @RequestHeader(value = "Authorization", required = false) String tokenHeader,
            @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(tokenHeader, request);
    }
}
