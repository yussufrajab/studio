package com.yussufrajab.csms.controller;

import com.yussufrajab.csms.dto.UserDto;
import com.yussufrajab.csms.dto.MessageResponse;
import com.yussufrajab.csms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')") // Only users with ADMIN role can access these endpoints
public class UserManagementController {

    @Autowired
    private UserService userService;

    // FR1.5: Create user accounts
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserDto userDto) {
        // Password validation (FR1.1) is handled by @Valid on UserDto
        UserDto createdUser = userService.createUser(userDto);
        // Exclude password in response
        createdUser.setPassword(null);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId) {
        return userService.getUserById(userId)
                .map(userDto -> {
                    userDto.setPassword(null); // Ensure password is not sent
                    return ResponseEntity.ok(userDto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        users.forEach(userDto -> userDto.setPassword(null)); // Ensure password is not sent
        return ResponseEntity.ok(users);
    }

    // FR1.5: Edit user accounts
    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long userId, @Valid @RequestBody UserDto userDto) {
        // Note: UserDto for update might not require password.
        // If password change is intended, it should be a separate, more secure endpoint.
        // For now, this DTO will ignore password if sent for update.
        userDto.setPassword(null); // Ensure password is not part of this update path
        UserDto updatedUser = userService.updateUser(userId, userDto);
        updatedUser.setPassword(null);
        return ResponseEntity.ok(updatedUser);
    }

    // FR1.5: Activate user accounts
    @PutMapping("/{userId}/activate")
    public ResponseEntity<MessageResponse> activateUser(@PathVariable Long userId) {
        userService.activateUser(userId);
        return ResponseEntity.ok(new MessageResponse("User activated successfully."));
    }

    // FR1.5: Deactivate user accounts
    @PutMapping("/{userId}/deactivate")
    public ResponseEntity<MessageResponse> deactivateUser(@PathVariable Long userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(new MessageResponse("User deactivated successfully."));
    }

    // FR1.5: Delete user accounts
    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully."));
    }
}
