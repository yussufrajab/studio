package com.example.csms.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "institutions")
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // Other institution-specific details can be added here
    // e.g., address, type of institution, etc.

    // Relationships
    // An institution can have multiple employees
    @OneToMany(mappedBy = "institutionRef", fetch = FetchType.LAZY) // Assuming 'institutionRef' is the field in Employee
    private List<Employee> employees;

    // An institution can have HRRP users. A User might be linked to one institution.
    // This can be achieved by adding an 'institution_id' foreign key in the User table for HRRPs,
    // or a ManyToMany if a user could be HRRP for multiple institutions (less likely based on description).
    // For now, User.institutionId string field will hold this link.

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Employee> getEmployees() {
        return employees;
    }

    public void setEmployees(List<Employee> employees) {
        this.employees = employees;
    }
}
