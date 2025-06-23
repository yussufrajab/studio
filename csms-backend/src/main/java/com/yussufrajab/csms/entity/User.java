package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "system_users") // "user" is often a reserved keyword in SQL
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private boolean active = true; // To support FR1.5 (activate/deactivate)

    private LocalDateTime lastLogin; // For audit or session tracking

    // Fields for password recovery FR1.2 & NFR1.5
    private String otp;
    private LocalDateTime otpExpiryTime;

    // Field for NFR1.4 (failed login attempts)
    private int failedLoginAttempts = 0;
    private LocalDateTime accountLockoutTime;


    // UserDetails methods
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (accountLockoutTime == null) {
            return true;
        }
        // Account is locked if current time is before lockout time + 15 minutes
        return LocalDateTime.now().isAfter(accountLockoutTime.plusMinutes(15));
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
