package com.example.csms.dto;

public class AuthResponseDto {
    private Long id;
    private String username;
    private String name;
    private String role;
    private String messageOrToken; // Could be a JWT token or a simple message

    public AuthResponseDto(Long id, String username, String name, String role, String messageOrToken) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.role = role;
        this.messageOrToken = messageOrToken;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessageOrToken() {
        return messageOrToken;
    }

    public void setMessageOrToken(String messageOrToken) {
        this.messageOrToken = messageOrToken;
    }
}
