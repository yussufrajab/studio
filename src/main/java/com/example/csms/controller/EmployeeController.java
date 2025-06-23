package com.example.csms.controller;

import com.example.csms.model.Employee;
import com.example.csms.model.User; // For HRRP check
import com.example.csms.service.EmployeeService; // A new service for employee specific logic
import com.example.csms.service.ReportService; // Or use ReportService methods if they fit
import com.example.csms.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    // Option 1: Create a dedicated EmployeeService
    // @Autowired
    // private EmployeeService employeeService;

    // Option 2: Reuse ReportService methods or add specific methods there
    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService;


    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    // CSCS: Access employee profiles across all public institutions.
    @GetMapping("/{employeeId}/profile-cscs")
    @PreAuthorize("hasRole('CSCS')")
    public ResponseEntity<Employee> getEmployeeProfileForCSCS(@PathVariable Long employeeId) {
        try {
            // Using the method from ReportService as it's already defined for CSCS
            Employee employee = reportService.getEmployeeProfileSystemWide(employeeId);
            return ResponseEntity.ok(employee);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    // HRRP: Access employee profiles within their institution only.
    @GetMapping("/{employeeId}/profile-hrrp")
    @PreAuthorize("hasRole('HRRP')")
    public ResponseEntity<Employee> getEmployeeProfileForHRRP(@PathVariable Long employeeId) {
        User hrrpUser = getCurrentUser();
        try {
            // Using the method from ReportService as it's already defined for HRRP
            Employee employee = reportService.getEmployeeProfileInMyInstitution(hrrpUser, employeeId);
            return ResponseEntity.ok(employee);
        } catch (RuntimeException e) { // Catches AccessDenied or NotFound
             if (e.getMessage().contains("not belong to HRRP's institution")) {
                 throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
             }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    // Potentially a more generic endpoint if other roles need access or for HRO to see employee details
    // @GetMapping("/{employeeId}")
    // @PreAuthorize("isAuthenticated()") // Add more specific role checks
    // public ResponseEntity<Employee> getEmployeeById(@PathVariable Long employeeId) {
    //    // Logic to fetch employee, ensuring user has rights
    // }

}
