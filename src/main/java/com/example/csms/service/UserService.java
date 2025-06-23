package com.example.csms.service;

import com.example.csms.model.User;
import com.example.csms.model.Role;
import com.example.csms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(String username, String rawPassword, String name, Role role, String employeeId, String institutionId) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setName(name);
        user.setRole(role);
        user.setEmployeeId(employeeId); // Can be null
        user.setInstitutionId(institutionId); // Can be null, relevant for HRRP
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    // Additional methods for updating users, deleting users, etc., can be added here.
    // For example:
    // @Transactional
    // public User updateUserRole(String username, Role newRole) {
    //     User user = userRepository.findByUsername(username)
    //             .orElseThrow(() -> new RuntimeException("User not found: " + username));
    //     user.setRole(newRole);
    //     return userRepository.save(user);
    // }
}
