package com.yussufrajab.csms.service;

import com.yussufrajab.csms.dto.UserDto; // To be created
import com.yussufrajab.csms.entity.User;
import com.yussufrajab.csms.enums.UserRole;

import java.util.List;
import java.util.Optional;

public interface UserService {
    // For AuthController
    void initiatePasswordRecovery(String email);
    void resetPassword(String identifier, String otp, String newPassword);
    void handleFailedLoginAttempt(String username);

    // For UserManagementController (FR1.5)
    UserDto createUser(UserDto userDto);
    Optional<UserDto> getUserById(Long userId);
    List<UserDto> getAllUsers();
    UserDto updateUser(Long userId, UserDto userDto);
    void deleteUser(Long userId); // This might be a soft delete or full delete based on policy
    void activateUser(Long userId);
    void deactivateUser(Long userId);

    // Helper
    User findByUsername(String username);
    User findByEmail(String email);

}
