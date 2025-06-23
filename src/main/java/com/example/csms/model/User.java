package com.example.csms.model;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "users") // "user" is often a reserved keyword in SQL
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password; // This will store the hashed password

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String employeeId; // Link to an Employee entity's business key if needed

    private String institutionId; // For HRRP to identify their institution

    // Relationships
    // If an employee is also a user, you might have a OneToOne with Employee
    // @OneToOne
    // @JoinColumn(name = "employee_db_id") // Assuming Employee has its own DB-generated ID
    // private Employee employeeRecord;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(String institutionId) {
        this.institutionId = institutionId;
    }

    // toString, equals, hashCode (optional, but good practice)
}
