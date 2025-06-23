package com.yussufrajab.csms.service;

import com.yussufrajab.csms.dto.UserDto;
import com.yussufrajab.csms.entity.User;
import com.yussufrajab.csms.enums.UserRole;
import com.yussufrajab.csms.exception.ResourceNotFoundException; // To be created
import com.yussufrajab.csms.exception.BadRequestException; // To be created
import com.yussufrajab.csms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // TODO: Inject EmailService for sending OTP (FR1.2)
    // @Autowired
    // private EmailService emailService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15; // NFR1.4
    private static final int OTP_EXPIRY_MINUTES = 60; // NFR1.5


    @Override
    @Transactional
    public void initiatePasswordRecovery(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            throw new BadRequestException("Account is not active. Please contact support.");
        }

        String otp = UUID.randomUUID().toString().substring(0, 6).toUpperCase(); // Simple OTP
        user.setOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        // TODO: Send OTP via email
        // emailService.sendOtpEmail(user.getEmail(), otp);
        System.out.println("Generated OTP for " + email + ": " + otp); // Placeholder
    }

    @Override
    @Transactional
    public void resetPassword(String identifier, String otp, String newPassword) {
        // Identifier can be username or email
        User user = userRepository.findByUsername(identifier)
                .orElseGet(() -> userRepository.findByEmail(identifier)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + identifier)));

        if (!user.isActive()) {
            throw new BadRequestException("Account is not active. Please contact support.");
        }

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new BadRequestException("Invalid OTP.");
        }

        if (user.getOtpExpiryTime() == null || LocalDateTime.now().isAfter(user.getOtpExpiryTime())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null); // Clear OTP after successful use
        user.setOtpExpiryTime(null);
        user.setFailedLoginAttempts(0); // Reset failed attempts
        user.setAccountLockoutTime(null); // Unlock account
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void handleFailedLoginAttempt(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.isActive() && user.isAccountNonLocked()) { // only increment if active and not already locked
                user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
                if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                    user.setAccountLockoutTime(LocalDateTime.now());
                    // TODO: Optionally notify user about account lockout
                }
                userRepository.save(user);
            }
        }
        // If user not found, BadCredentialsException is thrown by Spring Security, no specific action here.
    }

    @Override
    @Transactional
    public UserDto createUser(UserDto userDto) {
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists: " + userDto.getUsername());
        }
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists: " + userDto.getEmail());
        }

        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword())); // Ensure password meets policy (FR1.1) via DTO validation
        user.setRole(userDto.getRole());
        user.setActive(userDto.isActive()); // Default to true or based on DTO

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto> getUserById(Long userId) {
        return userRepository.findById(userId).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto updateUser(Long userId, UserDto userDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Prevent username change for now, or handle carefully if allowed
        // user.setUsername(userDto.getUsername());

        // Check if email is being changed and if it's already taken by another user
        if (!user.getEmail().equals(userDto.getEmail()) && userRepository.findByEmail(userDto.getEmail()).filter(u -> !u.getId().equals(userId)).isPresent()) {
            throw new BadRequestException("Email already in use: " + userDto.getEmail());
        }
        user.setEmail(userDto.getEmail());
        user.setRole(userDto.getRole());
        user.setActive(userDto.isActive());
        // Password changes should be handled by a dedicated method like resetPassword or changePassword

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        // Consider soft delete: user.setActive(false); userRepository.save(user);
        // For now, hard delete:
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(true);
        user.setAccountLockoutTime(null); // Also unlock if activating
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
         return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
        // Deliberately not mapping password
        return dto;
    }
}
