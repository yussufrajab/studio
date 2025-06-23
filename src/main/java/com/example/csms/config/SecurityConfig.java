package com.example.csms.config;

import com.example.csms.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // To enable @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless APIs, enable if using sessions/cookies
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // For REST APIs
            .authorizeHttpRequests(authz -> authz
                // Public endpoints (e.g., for authentication, registration, static resources)
                .requestMatchers("/auth/**", "/public/**").permitAll()
                // H2 console (if used for development, ensure it's secured or disabled in prod)
                // .requestMatchers("/h2-console/**").permitAll()

                // Placeholder for API documentation (Swagger/OpenAPI)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Specific role-based access will be defined more granularly using @PreAuthorize
                // or by adding more specific matchers here as controllers are developed.
                // For example:
                // .requestMatchers("/api/v1/admin/**").hasRole("ADMIN") // Example
                // .requestMatchers("/api/v1/requests/submit").hasRole("HRO")

                // Default deny for any other authenticated request (can be adjusted)
                .anyRequest().authenticated()
            );
            // .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin())); // For H2 console

        http.authenticationProvider(authenticationProvider());

        // Add JWT token filter here if using token-based authentication

        return http.build();
    }
}
