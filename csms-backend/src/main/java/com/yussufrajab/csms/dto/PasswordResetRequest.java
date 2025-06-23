package com.yussufrajab.csms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetRequest {
    @NotBlank(message = "OTP cannot be blank")
    private String otp;

    @NotBlank(message = "New password cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    // FR1.1: "at least 8 characters with mix of letters, number and special character"
    // This regex enforces: at least one digit, one lowercase, one uppercase, one special char, and min 8 length.
    // Adjusted special characters list to be more common.
    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~`]).{8,}$",
        message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    private String newPassword;

    // For verification, ensure the user provides their email or username again
    @NotBlank(message = "Email or username cannot be blank")
    private String identifier; // This could be email or username
}
