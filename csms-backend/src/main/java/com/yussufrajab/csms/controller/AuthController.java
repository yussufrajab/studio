package com.yussufrajab.csms.controller;

import com.yussufrajab.csms.dto.*;
import com.yussufrajab.csms.entity.User;
import com.yussufrajab.csms.repository.UserRepository;
import com.yussufrajab.csms.security.JwtUtil;
import com.yussufrajab.csms.service.UserService; // To be created for password recovery logic
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository; // For direct user interaction if needed by auth logic

    @Autowired
    private PasswordEncoder passwordEncoder; // For encoding new passwords

    @Autowired
    private UserService userService; // For password recovery and reset logic

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtil.generateToken(authentication);

            User userDetails = (User) authentication.getPrincipal();

            // Update last login time and reset failed attempts
            userDetails.setLastLogin(LocalDateTime.now());
            userDetails.setFailedLoginAttempts(0);
            userDetails.setAccountLockoutTime(null); // Clear lockout on successful login
            userRepository.save(userDetails);

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles));
        } catch (BadCredentialsException e) {
            // Handle failed login attempts (NFR1.4)
            userService.handleFailedLoginAttempt(loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Invalid username or password!", false));
        } catch (LockedException e) {
             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Account is locked. Please try again later or contact support.", false));
        } catch (DisabledException e) {
             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Account is disabled. Please contact support.", false));
        } catch (Exception e) {
            // Log the exception e.g. logger.error("Login error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Error: An unexpected error occurred during login.", false));
        }
    }

    @PostMapping("/recover-password")
    public ResponseEntity<?> recoverPassword(@Valid @RequestBody PasswordRecoveryRequest recoveryRequest) {
        // Delegate to UserService to handle OTP generation and email sending (FR1.2)
        try {
            userService.initiatePasswordRecovery(recoveryRequest.getEmail());
            return ResponseEntity.ok(new MessageResponse("Password recovery email sent. Please check your inbox for an OTP."));
        } catch (RuntimeException e) { // Catch specific exceptions like UserNotFoundException from service
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage(), false));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetRequest resetRequest) {
        // Delegate to UserService to validate OTP and reset password (FR1.1, NFR1.5)
        try {
            userService.resetPassword(resetRequest.getIdentifier(), resetRequest.getOtp(), resetRequest.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password has been reset successfully."));
        } catch (RuntimeException e) { // Catch specific exceptions
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage(), false));
        }
    }
}
