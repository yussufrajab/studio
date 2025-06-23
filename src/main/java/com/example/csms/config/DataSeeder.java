package com.example.csms.config;

import com.example.csms.model.*;
import com.example.csms.service.UserService;
import com.example.csms.repository.InstitutionRepository;
import com.example.csms.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder; // UserService handles encoding
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserService userService;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // No need to autowire PasswordEncoder directly if UserService handles it.

    @Override
    @Transactional // Ensure all operations are part of a single transaction
    public void run(String... args) throws Exception {
        System.out.println("Starting data seeding...");

        // 1. Create Institutions
        Institution instA = createInstitutionIfNotExists("Ministry of Health");
        Institution instB = createInstitutionIfNotExists("Ministry of Education");
        Institution instC = createInstitutionIfNotExists("Civil Service Commission HQ"); // For CSCS/PO users not tied to instA/B

        // 2. Create Users with different roles
        // Passwords will be encoded by UserService
        // HRO
        createUserIfNotExists("hro_user1", "password123", "HRO User One", Role.HRO, null, instA.getId().toString());
        createUserIfNotExists("hro_user2", "password123", "HRO User Two", Role.HRO, null, instB.getId().toString());

        // HHRMD
        createUserIfNotExists("hhrmd_user", "password123", "Head HHRMD", Role.HHRMD, null, instC.getId().toString());

        // HRMO
        createUserIfNotExists("hrmo_user", "password123", "HRMO User", Role.HRMO, null, instC.getId().toString());

        // DO
        createUserIfNotExists("do_user", "password123", "Disciplinary Officer", Role.DO, null, instC.getId().toString());

        // EMPLOYEE
        // Create some employees first, then link them to EMPLOYEE users
        Employee emp1 = createEmployeeIfNotExists("EMP001", "Alice Wonderland", instA, "alice.wonder@example.com");
        Employee emp2 = createEmployeeIfNotExists("EMP002", "Bob The Builder", instB, "bob.builder@example.com");
        Employee emp3 = createEmployeeIfNotExists("EMP003", "Charlie Brown", instA, "charlie.brown@example.com");

        createUserIfNotExists("employee1", "password123", emp1.getName(), Role.EMPLOYEE, emp1.getEmployeeEntityId(), instA.getId().toString());
        createUserIfNotExists("employee2", "password123", emp2.getName(), Role.EMPLOYEE, emp2.getEmployeeEntityId(), instB.getId().toString());

        // PO
        createUserIfNotExists("po_user", "password123", "Planning Officer", Role.PO, null, instC.getId().toString());

        // CSCS
        createUserIfNotExists("cscs_user", "password123", "CSCS Head", Role.CSCS, null, instC.getId().toString());

        // HRRP
        createUserIfNotExists("hrrp_user_A", "password123", "HRRP Manager A", Role.HRRP, null, instA.getId().toString());
        createUserIfNotExists("hrrp_user_B", "password123", "HRRP Manager B", Role.HRRP, null, instB.getId().toString());

        System.out.println("Data seeding completed.");
    }

    private User createUserIfNotExists(String username, String rawPassword, String name, Role role, String employeeId, String institutionId) {
        if (userService.findByUsername(username).isEmpty()) {
            System.out.println("Creating user: " + username);
            return userService.createUser(username, rawPassword, name, role, employeeId, institutionId);
        }
        System.out.println("User already exists: " + username);
        return userService.findByUsername(username).get();
    }

    private Institution createInstitutionIfNotExists(String name) {
        return institutionRepository.findByName(name)
                .orElseGet(() -> {
                    System.out.println("Creating institution: " + name);
                    Institution newInst = new Institution();
                    newInst.setName(name);
                    return institutionRepository.save(newInst);
                });
    }

    private Employee createEmployeeIfNotExists(String entityId, String name, Institution institution, String emailPlaceholder) {
        return employeeRepository.findByEmployeeEntityId(entityId)
                .orElseGet(() -> {
                    System.out.println("Creating employee: " + name + " (" + entityId + ")");
                    Employee newEmp = new Employee();
                    newEmp.setEmployeeEntityId(entityId);
                    newEmp.setName(name);
                    newEmp.setInstitutionRef(institution);
                    newEmp.setDateOfBirth(LocalDate.of(1990, 1, 1)); // Placeholder
                    newEmp.setZanId("ZID" + entityId.substring(3)); // Placeholder
                    newEmp.setEmploymentDate(LocalDate.now().minusYears(2)); // Placeholder
                    newEmp.setStatus("Active");
                    // Set other mandatory fields if any, or add more details
                    return employeeRepository.save(newEmp);
                });
    }
}
