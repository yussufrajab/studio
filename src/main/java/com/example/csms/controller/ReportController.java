package com.example.csms.controller;

import com.example.csms.model.Employee;
import com.example.csms.model.Request;
import com.example.csms.model.RequestStatus;
import com.example.csms.model.ReviewHistory;
import com.example.csms.model.Role;
import com.example.csms.model.User;
import com.example.csms.service.ReportService;
import com.example.csms.service.UserService; // To fetch User for HRRP methods

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService; // To get User object for HRRP

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    // --- PO Endpoints ---
    @GetMapping("/po/system-requests")
    @PreAuthorize("hasRole('PO')")
    public ResponseEntity<List<Request>> getSystemWideRequestsForPO() {
        return ResponseEntity.ok(reportService.getSystemWideRequests());
    }

    @GetMapping("/po/system-request-counts")
    @PreAuthorize("hasRole('PO')")
    public ResponseEntity<Map<RequestStatus, Long>> getSystemWideRequestStatusCountsForPO() {
        return ResponseEntity.ok(reportService.getSystemWideRequestStatusCounts());
    }

    @GetMapping("/po/system-employees")
    @PreAuthorize("hasRole('PO')")
    public ResponseEntity<List<Employee>> getAllEmployeesSystemWideForPO() {
        return ResponseEntity.ok(reportService.getAllEmployeesSystemWide());
    }

    // --- CSCS Endpoints ---
    @GetMapping("/cscs/review-actions")
    @PreAuthorize("hasRole('CSCS')")
    public ResponseEntity<List<ReviewHistory>> getAllReviewActionsForCSCS() {
        // Could also take List<Role> as param if needed
        return ResponseEntity.ok(reportService.getAllReviewActions());
    }

    @GetMapping("/cscs/employees/{employeeId}")
    @PreAuthorize("hasRole('CSCS')")
    public ResponseEntity<Employee> getEmployeeProfileSystemWideForCSCS(@PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(reportService.getEmployeeProfileSystemWide(employeeId));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }
    // CSCS can also use PO endpoints (handled by role access)

    // --- HRRP Endpoints ---
    // HRRP methods require the User object of the HRRP to determine their institution.

    @GetMapping("/hrrp/my-institution-requests")
    @PreAuthorize("hasRole('HRRP')")
    public ResponseEntity<List<Request>> getRequestsForMyInstitutionForHRRP() {
        User hrrpUser = getCurrentUser();
        try {
            return ResponseEntity.ok(reportService.getRequestsForMyInstitution(hrrpUser));
        } catch (RuntimeException e) { // Catches AccessDenied or other issues from service
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        }
    }

    @GetMapping("/hrrp/my-institution-request-counts")
    @PreAuthorize("hasRole('HRRP')")
    public ResponseEntity<Map<RequestStatus, Long>> getRequestStatusCountsForMyInstitutionForHRRP() {
         User hrrpUser = getCurrentUser();
         try {
            return ResponseEntity.ok(reportService.getRequestStatusCountsForMyInstitution(hrrpUser));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        }
    }

    @GetMapping("/hrrp/my-institution-employees")
    @PreAuthorize("hasRole('HRRP')")
    public ResponseEntity<List<Employee>> getEmployeesInMyInstitutionForHRRP() {
        User hrrpUser = getCurrentUser();
        try {
            return ResponseEntity.ok(reportService.getEmployeesInMyInstitution(hrrpUser));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        }
    }

    @GetMapping("/hrrp/my-institution-hro-requests")
    @PreAuthorize("hasRole('HRRP')")
    public ResponseEntity<List<Request>> trackRequestsSubmittedByMyInstitutionHROs() {
        User hrrpUser = getCurrentUser();
        try {
            return ResponseEntity.ok(reportService.trackRequestsSubmittedByMyInstitutionHROs(hrrpUser));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        }
    }
}
