package com.example.csms.controller;

import com.example.csms.model.Role;
import com.example.csms.model.User;
import com.example.csms.service.UserService;
import com.example.csms.dto.LoginRequestDto;
import com.example.csms.dto.RegisterRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;


import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Optional: if you have specific test properties
@Transactional // Ensure tests are rolled back, useful if interacting with a real DB for some tests
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder; // To encode passwords for user creation

    @Autowired
    private UserService userService; // Use the real service to create users for login test

    // We don't need to mock AuthenticationManager if Spring Security context is properly set up
    // @MockBean
    // private AuthenticationManager authenticationManager;


    @BeforeEach
    void setUp() {
        // Clean up or set up specific users if needed, though @Transactional helps
    }

    @Test
    void registerUser_Success() throws Exception {
        RegisterRequestDto registerDto = new RegisterRequestDto();
        registerDto.setUsername("testuser_register");
        registerDto.setPassword("password123");
        registerDto.setName("Test User Register");
        registerDto.setRole(Role.EMPLOYEE);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("testuser_register")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")));
    }

    @Test
    void registerUser_UsernameAlreadyExists_BadRequest() throws Exception {
        // Create a user first
        userService.createUser("existinguser", "password123", "Existing User", Role.HRO, null, null);

        RegisterRequestDto registerDto = new RegisterRequestDto();
        registerDto.setUsername("existinguser"); // Same username
        registerDto.setPassword("newpassword");
        registerDto.setName("Another User");
        registerDto.setRole(Role.EMPLOYEE);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already exists: existinguser"));
    }

    @Test
    void authenticateUser_Success() throws Exception {
        // Create a user to log in with
        String username = "loginuser";
        String password = "password123";
        userService.createUser(username, password, "Login Test User", Role.HRO, null, "1");

        LoginRequestDto loginDto = new LoginRequestDto();
        loginDto.setUsername(username);
        loginDto.setPassword(password);

        // Authentication authMock = new UsernamePasswordAuthenticationToken(username, password);
        // when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authMock);
        // No need to mock authenticationManager if using the actual Spring Security flow

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is(username)))
                .andExpect(jsonPath("$.role", is("HRO")));
    }

    @Test
    void authenticateUser_InvalidCredentials_Unauthorized() throws Exception {
        LoginRequestDto loginDto = new LoginRequestDto();
        loginDto.setUsername("nonexistentuser");
        loginDto.setPassword("wrongpassword");

        // Spring Security's DaoAuthenticationProvider will handle the bad credentials
        // and it typically results in a 401 or 403 depending on configuration.
        // With default ExceptionTranslationFilter, it's often a 401 if not authenticated.
        // Or it could be a redirect to a login error page if form login is configured.
        // For REST, it should be 401.

        // when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        //    .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"));
        // No need to mock if we test the actual flow.

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginDto)))
                .andExpect(status().isUnauthorized()); // Or .isForbidden() depending on exact setup
    }
}
