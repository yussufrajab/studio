package com.example.csms.service;

import com.example.csms.model.*;
import com.example.csms.repository.EmployeeRepository;
import com.example.csms.repository.RequestRepository;
import com.example.csms.repository.ReviewHistoryRepository;
import com.example.csms.repository.UserRepository; // For fetching User entities
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RequestService {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    // --- Utility method to get current authenticated User ---
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User not authenticated");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database: " + username));
    }

    // --- Submit Request ---
    @Transactional
    // @PreAuthorize("hasRole('HRO') or (hasRole('EMPLOYEE') and #requestType == T(com.example.csms.model.RequestType).COMPLAINTS)") - Example
    public Request submitRequest(String employeeEntityId, RequestType requestType, String details) {
        User currentUser = getCurrentUser();

        // Authorization checks based on role and request type
        if (currentUser.getRole() == Role.HRO) {
            if (requestType == RequestType.COMPLAINTS) {
                throw new AccessDeniedException("HRO cannot submit Complaints.");
            }
        } else if (currentUser.getRole() == Role.EMPLOYEE) {
            if (requestType != RequestType.COMPLAINTS) {
                throw new AccessDeniedException("Employees can only submit Complaints.");
            }
        } else {
            throw new AccessDeniedException("User role " + currentUser.getRole() + " cannot submit requests of type " + requestType);
        }

        Employee employee = employeeRepository.findByEmployeeEntityId(employeeEntityId)
                .orElseThrow(() -> new RuntimeException("Employee not found with entity ID: " + employeeEntityId));

        Request request = new Request();
        request.setEmployee(employee);
        request.setType(requestType);
        request.setSubmittedBy(currentUser);
        request.setSubmittedDate(LocalDateTime.now());
        request.setStatus(RequestStatus.PENDING);
        request.setDetails(details);

        return requestRepository.save(request);
    }

    // --- Retrieve Requests ---
    @Transactional(readOnly = true)
    public Optional<Request> getRequestById(Long requestId) {
        // Further authorization can be added here: e.g., user can only see their own requests,
        // or requests related to their institution if HRRP, or all if HHRMD/CSCS etc.
        return requestRepository.findById(requestId);
    }

    @Transactional(readOnly = true)
    public List<Request> getRequestsForEmployee(String employeeEntityId) {
        Employee employee = employeeRepository.findByEmployeeEntityId(employeeEntityId)
                .orElseThrow(() -> new RuntimeException("Employee not found with entity ID: " + employeeEntityId));
        return requestRepository.findByEmployee(employee);
    }

    @Transactional(readOnly = true)
    public List<Request> getRequestsSubmittedByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return requestRepository.findBySubmittedBy(user);
    }

    @Transactional(readOnly = true)
    public List<Request> getAllRequestsByStatus(RequestStatus status) {
        // @PreAuthorize("hasAnyRole('HHRMD', 'HRMO', 'DO', 'CSCS')")
        // Add role-based filtering if needed (e.g. DO only sees certain types)
        return requestRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Request> getAllRequests() {
        // @PreAuthorize("hasAnyRole('HHRMD', 'HRMO', 'DO', 'CSCS', 'PO')")
        return requestRepository.findAll();
    }


    // --- Approve/Reject/Resolve Request ---
    @Transactional
    public Request reviewRequest(Long requestId, boolean approve, String reasonOrResolution) {
        User reviewer = getCurrentUser();
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found with ID: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING && request.getStatus() != RequestStatus.PENDING_RECTIFICATION) {
            throw new IllegalStateException("Request is not in a pending state and cannot be reviewed. Current status: " + request.getStatus());
        }

        RequestType type = request.getType();
        Role reviewerRole = reviewer.getRole();
        boolean canReview = false;

        switch (reviewerRole) {
            case HHRMD:
                canReview = type == RequestType.EMPLOYEE_CONFIRMATION || type == RequestType.PROMOTION ||
                            type == RequestType.LWOP || type == RequestType.CHANGE_OF_CADRE ||
                            type == RequestType.RETIREMENT || type == RequestType.RESIGNATION ||
                            type == RequestType.COMPLAINTS || type == RequestType.TERMINATION ||
                            type == RequestType.DISMISSAL || type == RequestType.SERVICE_EXTENSION;
                break;
            case HRMO:
                canReview = type == RequestType.EMPLOYEE_CONFIRMATION || type == RequestType.PROMOTION ||
                            type == RequestType.LWOP || type == RequestType.CHANGE_OF_CADRE ||
                            type == RequestType.RETIREMENT || type == RequestType.RESIGNATION ||
                            type == RequestType.SERVICE_EXTENSION;
                break;
            case DO:
                canReview = type == RequestType.COMPLAINTS || type == RequestType.TERMINATION ||
                            type == RequestType.DISMISSAL;
                break;
            default:
                canReview = false;
        }

        if (!canReview) {
            throw new AccessDeniedException("User " + reviewer.getUsername() + " with role " + reviewerRole +
                                            " cannot review request type " + type);
        }

        ReviewHistory review = new ReviewHistory();
        review.setRequest(request);
        review.setReviewer(reviewer);
        review.setReviewDate(LocalDateTime.now());

        if (approve) {
            request.setStatus(type == RequestType.COMPLAINTS ? RequestStatus.RESOLVED : RequestStatus.APPROVED);
            review.setDecision(type == RequestType.COMPLAINTS ? "Resolved" : "Approved");
            if (reasonOrResolution != null && !reasonOrResolution.isBlank()) {
                 review.setReason(reasonOrResolution); // Can be used for approval comments too
            }
        } else {
            request.setStatus(RequestStatus.REJECTED); // This will be PENDING_RECTIFICATION based on new req.
            review.setDecision("Rejected");
            if (reasonOrResolution == null || reasonOrResolution.isBlank()) {
                throw new IllegalArgumentException("Rejection reason is mandatory.");
            }
            review.setReason(reasonOrResolution);
            // New requirement: "If rejected it should be accompanied by the reason why it is rejected
            // allow HRO to rectify the mistake for rejection and then resend the request."
            // So, the status should perhaps be PENDING_RECTIFICATION.
            request.setStatus(RequestStatus.PENDING_RECTIFICATION);
        }

        reviewHistoryRepository.save(review);
        // TODO: Notify HRO about the decision (especially rejection for rectification)
        // This could be a separate NotificationService call or an event.
        // For now, we can log it.
        System.out.println("Request ID: " + request.getId() + " reviewed by " + reviewer.getUsername() + ". New status: " + request.getStatus());


        return requestRepository.save(request);
    }

    // --- Resubmit Request (by HRO after rejection) ---
    @Transactional
    public Request resubmitRequest(Long requestId, String updatedDetails, String rectificationReason) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != Role.HRO) {
            throw new AccessDeniedException("Only HRO can resubmit requests.");
        }

        Request request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found with ID: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING_RECTIFICATION) {
            throw new IllegalStateException("Request cannot be resubmitted. Status is not PENDING_RECTIFICATION. Current status: " + request.getStatus());
        }

        // Ensure the HRO is associated with the original request or the employee's institution if needed.
        // For simplicity, any HRO can resubmit for now, but this might need refinement.

        request.setDetails(updatedDetails);
        request.setStatus(RequestStatus.PENDING); // Back to pending for re-review
        request.setSubmittedDate(LocalDateTime.now()); // Update submission date for resubmission

        // Optionally, log the rectification reason or add it to a specific field/history.
        // For now, it's a parameter that could be logged or added to details if needed.
        System.out.println("Request ID: " + requestId + " resubmitted by HRO " + currentUser.getUsername() + " with rectification reason: " + rectificationReason);


        return requestRepository.save(request);
    }

    // More methods will be needed for PO, CSCS, HRRP specific views and actions.
    // e.g., getRequestsForInstitution (for HRRP)
}
