package com.example.csms.controller;

import com.example.csms.dto.AuthResponseDto;
import com.example.csms.dto.LoginRequestDto;
import com.example.csms.dto.RegisterRequestDto;
import com.example.csms.model.User;
import com.example.csms.service.UserService;
import com.example.csms.service.UserDetailsServiceImpl; // For UserDetails
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;


    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequestDto loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // In a real JWT scenario, you'd generate a token here.
        // For session-based, this is enough. We can return basic user info.
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userService.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        // Do NOT return the full User entity with password. Create a DTO.
        return ResponseEntity.ok(new AuthResponseDto(
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getRole().name(),
            "Login successful" // Replace with token in JWT setup
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDto registerRequest) {
        try {
            User newUser = userService.createUser(
                    registerRequest.getUsername(),
                    registerRequest.getPassword(),
                    registerRequest.getName(),
                    registerRequest.getRole(),
                    registerRequest.getEmployeeId(), // Can be null
                    registerRequest.getInstitutionId() // Can be null
            );
            // Again, return a DTO, not the full entity.
            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponseDto(
                newUser.getId(),
                newUser.getUsername(),
                newUser.getName(),
                newUser.getRole().name(),
                "User registered successfully!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/me")
    // @PreAuthorize("isAuthenticated()") // or rely on SecurityConfig .anyRequest().authenticated()
    public ResponseEntity<?> getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
         User user = userService.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));

        return ResponseEntity.ok(new AuthResponseDto(
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getRole().name(),
            "User details fetched"
        ));
    }
}
