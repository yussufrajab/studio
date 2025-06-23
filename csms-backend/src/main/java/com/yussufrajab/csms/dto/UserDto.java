package com.yussufrajab.csms.dto;

import com.yussufrajab.csms.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto {
    private Long id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    // Password field is included for user creation.
    // It should not be sent back in responses that list users.
    // For updates, password change should be a separate, dedicated endpoint.
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~`]).{8,}$",
        message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    private String password; // Only for creation/reset, not for general GET

    @NotNull(message = "Role is required")
    private UserRole role;

    private boolean active;

    public UserDto() {}

    public UserDto(Long id, String username, String email, UserRole role, boolean active) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.active = active;
    }
}
