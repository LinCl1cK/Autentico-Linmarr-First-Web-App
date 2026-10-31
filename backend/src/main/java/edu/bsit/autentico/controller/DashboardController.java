package edu.bsit.autentico.controller;

import edu.bsit.autentico.dto.DashboardResponse;
import edu.bsit.autentico.dto.UserResponse;
import edu.bsit.autentico.model.User;
import edu.bsit.autentico.repository.UserRepository;
import edu.bsit.autentico.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final UserService userService;
    private final UserRepository userRepository; // Injected to pull the absolute member list for admins

    public DashboardController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestHeader("Authorization") String tokenHeader) {
        // 1. Authenticate user from Bearer Token
        User user = userService.authenticate(tokenHeader);
        
        // 2. Fetch data payload components
        UserResponse profileDto = userService.mapToUserResponse(user);
        long totalUsers = userService.getTotalUserCount();
        
        return new DashboardResponse(profileDto, totalUsers);
    }

    @GetMapping("/users")
    public List<UserResponse> getAllUsers(@RequestHeader("Authorization") String tokenHeader) {
        // 1. Authenticate caller
        User user = userService.authenticate(tokenHeader);
        
        // 2. Enforce Admin clearance restriction
        userService.requireRole(user, "ADMIN");
        
        // 3. Return full user list mapped clean of password fields
        return userRepository.findAll()
                .stream()
                .map(userService::mapToUserResponse)
                .collect(Collectors.toList());
    }
}
