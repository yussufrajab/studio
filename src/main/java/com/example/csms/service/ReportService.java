package com.example.csms.service;

import com.example.csms.model.*;
import com.example.csms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
// import org.springframework.security.access.prepost.PreAuthorize; // For method-level security
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true) // Default to read-only for reporting
public class ReportService {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    @Autowired
    private InstitutionRepository institutionRepository; // Assuming this exists for HRRP

    private User getCurrentUser() {
        // Simplified version, actual implementation would use SecurityContextHolder
        // For now, assume this method is available and works like in RequestService
        // This is a placeholder as direct access to SecurityContextHolder is better in actual methods.
        // For service-to-service calls or non-web contexts, user might need to be passed.
        String currentUsername = "test_user"; // Placeholder
         return userRepository.findByUsername(currentUsername).orElse(null);
    }


    // --- Methods for Planning Officer (PO) ---
    // PO: View system-generated reports across all institutions. Access dashboards and reports.
    // Generate and analyze aggregated data. Export/download reports. Read-only access.

    // @PreAuthorize("hasRole('PO')")
    public List<Request> getSystemWideRequests() {
        // PO should see all requests
        return requestRepository.findAll();
    }

    // @PreAuthorize("hasRole('PO')")
    public Map<RequestStatus, Long> getSystemWideRequestStatusCounts() {
        return requestRepository.findAll().stream()
                .collect(Collectors.groupingBy(Request::getStatus, Collectors.counting()));
    }

    // @PreAuthorize("hasRole('PO')")
    public List<Employee> getAllEmployeesSystemWide() {
        return employeeRepository.findAll();
    }

    // @PreAuthorize("hasRole('PO')")
    public long getTotalEmployeeCountSystemWide() {
        return employeeRepository.count();
    }

    // --- Methods for Civil Service Commission Secretary (CSCS) ---
    // CSCS: View all actions by HHRMD, HRMO, DO. Access employee profiles across all institutions.
    // Dashboard/menu for task status. View/download institutional and system-wide reports.

    // @PreAuthorize("hasRole('CSCS')")
    public List<ReviewHistory> getActionsByReviewerRoles(List<Role> reviewerRoles) {
        // This is a simplified query. A more optimized one might be needed.
        return reviewHistoryRepository.findAll().stream()
                .filter(rh -> reviewerRoles.contains(rh.getReviewer().getRole()))
                .collect(Collectors.toList());
    }

    // @PreAuthorize("hasRole('CSCS')")
    public List<ReviewHistory> getAllReviewActions() {
        return reviewHistoryRepository.findAll();
    }


    // @PreAuthorize("hasRole('CSCS')")
    public Employee getEmployeeProfileSystemWide(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
    }

    // CSCS can use PO methods like getSystemWideRequests(), getSystemWideRequestStatusCounts() etc.

    // --- Methods for Human Resource Responsible Personnel (HRRP) ---
    // HRRP: View dashboard for their institution. Access employee profiles in their institution.
    // View/download reports for their institution. Track status of requests by their institution's HRO.
    // Monitor how requests are processed by HHRMD, HRMO, DO.

    private Institution getHrrpInstitution(User hrrpUser) {
        if (hrrpUser.getRole() != Role.HRRP || hrrpUser.getInstitutionId() == null) {
            throw new AccessDeniedException("User is not an HRRP or institution ID is missing.");
        }
        try {
            Long institutionId = Long.parseLong(hrrpUser.getInstitutionId());
            return institutionRepository.findById(institutionId)
                    .orElseThrow(() -> new RuntimeException("Institution not found for HRRP: " + hrrpUser.getInstitutionId()));
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid institution ID format for HRRP: " + hrrpUser.getInstitutionId());
        }
    }

    // @PreAuthorize("hasRole('HRRP')")
    public List<Request> getRequestsForMyInstitution(User hrrpUser) {
        Institution institution = getHrrpInstitution(hrrpUser);
        return requestRepository.findByEmployee_InstitutionRef(institution);
    }

    // @PreAuthorize("hasRole('HRRP')")
    public Map<RequestStatus, Long> getRequestStatusCountsForMyInstitution(User hrrpUser) {
        Institution institution = getHrrpInstitution(hrrpUser);
        return requestRepository.findByEmployee_InstitutionRef(institution).stream()
                .collect(Collectors.groupingBy(Request::getStatus, Collectors.counting()));
    }

    // @PreAuthorize("hasRole('HRRP')")
    public List<Employee> getEmployeesInMyInstitution(User hrrpUser) {
        Institution institution = getHrrpInstitution(hrrpUser);
        return employeeRepository.findByInstitutionRef(institution);
    }

    // @PreAuthorize("hasRole('HRRP')")
    public Employee getEmployeeProfileInMyInstitution(User hrrpUser, Long employeeId) {
        Institution institution = getHrrpInstitution(hrrpUser);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        if (employee.getInstitutionRef() == null || !employee.getInstitutionRef().getId().equals(institution.getId())) {
            throw new AccessDeniedException("Employee does not belong to HRRP's institution.");
        }
        return employee;
    }

    // @PreAuthorize("hasRole('HRRP')")
    public List<Request> trackRequestsSubmittedByMyInstitutionHROs(User hrrpUser) {
        Institution institution = getHrrpInstitution(hrrpUser);
        // Find HROs in the same institution
        List<User> hrosInInstitution = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.HRO && institution.getId().toString().equals(u.getInstitutionId()))
            .collect(Collectors.toList());

        return hrosInInstitution.stream()
            .flatMap(hro -> requestRepository.findBySubmittedBy(hro).stream())
            .filter(request -> request.getEmployee().getInstitutionRef().getId().equals(institution.getId())) // double check request is for same institution
            .collect(Collectors.toList());
    }


    // --- Generic or Shared Reporting Methods ---
    public List<Request> getRequestsByMultipleStatuses(List<RequestStatus> statuses) {
        // Could be used by various roles with appropriate authorization
        return requestRepository.findAll().stream()
            .filter(r -> statuses.contains(r.getStatus()))
            .collect(Collectors.toList());
    }

    // Note: The getCurrentUser() method is a placeholder. In a real scenario,
    // these methods would either take the User object as a parameter (if called internally by a controller that has it)
    // or use SecurityContextHolder.getContext().getAuthentication() directly to ensure the logged-in user's context.
    // For @PreAuthorize, Spring does this automatically.
}
