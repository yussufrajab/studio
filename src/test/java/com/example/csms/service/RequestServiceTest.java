package com.example.csms.service;

import com.example.csms.model.*;
import com.example.csms.repository.EmployeeRepository;
import com.example.csms.repository.RequestRepository;
import com.example.csms.repository.ReviewHistoryRepository;
import com.example.csms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;


import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;

    @InjectMocks
    private RequestService requestService;

    private User hroUser;
    private User employeeUser;
    private User hhrmdUser;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        // Mock current user for SecurityContext
        hroUser = new User();
        hroUser.setId(1L);
        hroUser.setUsername("hro_test_user");
        hroUser.setRole(Role.HRO);

        employeeUser = new User();
        employeeUser.setId(2L);
        employeeUser.setUsername("employee_test_user");
        employeeUser.setRole(Role.EMPLOYEE);

        hhrmdUser = new User();
        hhrmdUser.setId(3L);
        hhrmdUser.setUsername("hhrmd_test_user");
        hhrmdUser.setRole(Role.HHRMD);

        testEmployee = new Employee();
        testEmployee.setId(1L);
        testEmployee.setEmployeeEntityId("EMP001");
        testEmployee.setName("Test Employee");

        // Default mock for getCurrentUser() to return hroUser
        // Specific tests can override this by calling mockSecurityContext(specificUser)
        // mockSecurityContext(hroUser); // Will set up in each test as needed
    }

    private void mockSecurityContext(User user) {
        // Mimic UserDetailsServiceImpl logic for authorities
        var authorities = java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getUsername(), "password", authorities);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
    }

    @Test
    void submitRequest_HRO_Success() {
        mockSecurityContext(hroUser);
        when(employeeRepository.findByEmployeeEntityId("EMP001")).thenReturn(Optional.of(testEmployee));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request result = requestService.submitRequest("EMP001", RequestType.PROMOTION, "Promotion details");

        assertNotNull(result);
        assertEquals(RequestType.PROMOTION, result.getType());
        assertEquals(testEmployee, result.getEmployee());
        assertEquals(hroUser, result.getSubmittedBy());
        assertEquals(RequestStatus.PENDING, result.getStatus());
        verify(requestRepository, times(1)).save(any(Request.class));
    }

    @Test
    void submitRequest_HRO_FailsForComplaints() {
        mockSecurityContext(hroUser);

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            requestService.submitRequest("EMP001", RequestType.COMPLAINTS, "Complaint details");
        });
        assertEquals("HRO cannot submit Complaints.", exception.getMessage());
    }

    @Test
    void submitRequest_Employee_SuccessForComplaints() {
        mockSecurityContext(employeeUser);
        when(employeeRepository.findByEmployeeEntityId("EMP001")).thenReturn(Optional.of(testEmployee));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request result = requestService.submitRequest("EMP001", RequestType.COMPLAINTS, "My complaint");

        assertNotNull(result);
        assertEquals(RequestType.COMPLAINTS, result.getType());
        assertEquals(employeeUser, result.getSubmittedBy());
        assertEquals(RequestStatus.PENDING, result.getStatus());
    }

    @Test
    void submitRequest_Employee_FailsForNonComplaints() {
        mockSecurityContext(employeeUser);

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            requestService.submitRequest("EMP001", RequestType.PROMOTION, "Promotion request");
        });
        assertEquals("Employees can only submit Complaints.", exception.getMessage());
    }

    @Test
    void submitRequest_UnauthorizedRole_ThrowsException() {
        mockSecurityContext(hhrmdUser); // HHRMD cannot submit requests directly based on current logic

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            requestService.submitRequest("EMP001", RequestType.PROMOTION, "Details");
        });
        assertTrue(exception.getMessage().contains("cannot submit requests of type"));
    }


    @Test
    void reviewRequest_HHRMD_ApprovePromotion_Success() {
        mockSecurityContext(hhrmdUser);

        Request pendingRequest = new Request();
        pendingRequest.setId(1L);
        pendingRequest.setType(RequestType.PROMOTION);
        pendingRequest.setStatus(RequestStatus.PENDING);
        pendingRequest.setEmployee(testEmployee);
        pendingRequest.setSubmittedBy(hroUser);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(pendingRequest));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reviewHistoryRepository.save(any(ReviewHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request result = requestService.reviewRequest(1L, true, "Approved for promotion");

        assertNotNull(result);
        assertEquals(RequestStatus.APPROVED, result.getStatus());
        verify(reviewHistoryRepository, times(1)).save(any(ReviewHistory.class));
        ReviewHistory savedReview = verify(reviewHistoryRepository).save(any(ReviewHistory.class)); // if you want to capture
        // For capturing: ArgumentCaptor<ReviewHistory> captor = ArgumentCaptor.forClass(ReviewHistory.class);
        // verify(reviewHistoryRepository).save(captor.capture());
        // assertEquals("Approved", captor.getValue().getDecision());
    }

    @Test
    void reviewRequest_HHRMD_RejectPromotion_Success() {
        mockSecurityContext(hhrmdUser);

        Request pendingRequest = new Request();
        pendingRequest.setId(1L);
        pendingRequest.setType(RequestType.PROMOTION);
        pendingRequest.setStatus(RequestStatus.PENDING);
        // ... set other fields

        when(requestRepository.findById(1L)).thenReturn(Optional.of(pendingRequest));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reviewHistoryRepository.save(any(ReviewHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request result = requestService.reviewRequest(1L, false, "Not eligible for promotion yet.");

        assertEquals(RequestStatus.PENDING_RECTIFICATION, result.getStatus());
        verify(reviewHistoryRepository, times(1)).save(any(ReviewHistory.class));
    }

    @Test
    void reviewRequest_HHRMD_RejectPromotion_FailsIfNoReason() {
        mockSecurityContext(hhrmdUser);
        Request pendingRequest = new Request();
        pendingRequest.setId(1L);
        pendingRequest.setType(RequestType.PROMOTION);
        pendingRequest.setStatus(RequestStatus.PENDING);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pendingRequest));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            requestService.reviewRequest(1L, false, null); // No reason
        });
        assertEquals("Rejection reason is mandatory.", exception.getMessage());
    }

    @Test
    void reviewRequest_UnauthorizedRoleForType_ThrowsAccessDenied() {
        mockSecurityContext(hroUser); // HRO cannot review
        Request pendingRequest = new Request();
        pendingRequest.setId(1L);
        pendingRequest.setType(RequestType.PROMOTION);
        pendingRequest.setStatus(RequestStatus.PENDING);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pendingRequest));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            requestService.reviewRequest(1L, true, "Approved");
        });
        assertTrue(exception.getMessage().contains("cannot review request type"));
    }

    @Test
    void reviewRequest_RequestNotInPendingState_ThrowsIllegalState() {
        mockSecurityContext(hhrmdUser);
        Request approvedRequest = new Request();
        approvedRequest.setId(1L);
        approvedRequest.setType(RequestType.PROMOTION);
        approvedRequest.setStatus(RequestStatus.APPROVED); // Not PENDING
        when(requestRepository.findById(1L)).thenReturn(Optional.of(approvedRequest));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            requestService.reviewRequest(1L, true, "Re-approve?");
        });
        assertTrue(exception.getMessage().contains("Request is not in a pending state"));
    }

    @Test
    void resubmitRequest_HRO_Success() {
        mockSecurityContext(hroUser);
        Request rejectedRequest = new Request();
        rejectedRequest.setId(1L);
        rejectedRequest.setType(RequestType.PROMOTION);
        rejectedRequest.setStatus(RequestStatus.PENDING_RECTIFICATION); // Correct status for resubmission
        rejectedRequest.setDetails("Old details");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(rejectedRequest));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request result = requestService.resubmitRequest(1L, "Updated details for promotion", "Corrected the attached documents.");

        assertEquals(RequestStatus.PENDING, result.getStatus());
        assertEquals("Updated details for promotion", result.getDetails());
        assertNotEquals(rejectedRequest.getSubmittedDate(), result.getSubmittedDate()); // Date should be updated
    }

    @Test
    void resubmitRequest_NotHRO_ThrowsAccessDenied() {
        mockSecurityContext(employeeUser); // Employee user trying to resubmit
        Request rejectedRequest = new Request();
        rejectedRequest.setId(1L);
        rejectedRequest.setStatus(RequestStatus.PENDING_RECTIFICATION);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(rejectedRequest));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            requestService.resubmitRequest(1L, "New details", "My correction");
        });
        assertEquals("Only HRO can resubmit requests.", exception.getMessage());
    }

    @Test
    void resubmitRequest_RequestNotInPendingRectification_ThrowsIllegalState() {
        mockSecurityContext(hroUser);
        Request pendingRequest = new Request();
        pendingRequest.setId(1L);
        pendingRequest.setStatus(RequestStatus.PENDING); // Not PENDING_RECTIFICATION
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pendingRequest));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            requestService.resubmitRequest(1L, "New details", "My correction");
        });
        assertTrue(exception.getMessage().contains("Status is not PENDING_RECTIFICATION"));
    }

}
