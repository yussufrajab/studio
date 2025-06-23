package com.example.csms.service;

import com.example.csms.model.*;
import com.example.csms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;


import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private RequestRepository requestRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;
    @Mock
    private InstitutionRepository institutionRepository;

    @InjectMocks
    private ReportService reportService;

    private User poUser;
    private User cscsUser;
    private User hrrpUser;
    private Institution instA;
    private Institution instB;
    private Employee empA1;
    private Employee empB1;
    private Request requestA1;

    @BeforeEach
    void setUp() {
        poUser = new User();
        poUser.setId(1L);
        poUser.setUsername("po_reporter");
        poUser.setRole(Role.PO);

        cscsUser = new User();
        cscsUser.setId(2L);
        cscsUser.setUsername("cscs_head");
        cscsUser.setRole(Role.CSCS);

        hrrpUser = new User();
        hrrpUser.setId(3L);
        hrrpUser.setUsername("hrrp_manager_A");
        hrrpUser.setRole(Role.HRRP);
        hrrpUser.setInstitutionId("100"); // Institution ID for hrrpUser

        instA = new Institution();
        instA.setId(100L);
        instA.setName("Ministry of Health");

        instB = new Institution();
        instB.setId(101L);
        instB.setName("Ministry of Education");

        empA1 = new Employee();
        empA1.setId(1L);
        empA1.setEmployeeEntityId("EMP_A1");
        empA1.setInstitutionRef(instA);

        empB1 = new Employee();
        empB1.setId(2L);
        empB1.setEmployeeEntityId("EMP_B1");
        empB1.setInstitutionRef(instB);

        requestA1 = new Request();
        requestA1.setId(1L);
        requestA1.setEmployee(empA1);
        requestA1.setStatus(RequestStatus.PENDING);

        // Note: No SecurityContext mocking here as ReportService methods mostly don't rely on
        // SecurityContextHolder directly but rather on the User object passed or PreAuthorize.
        // The getCurrentUser() in ReportService is a placeholder and not used by these tests.
    }

    // --- PO Tests ---
    @Test
    void getSystemWideRequests_forPO_returnsAllRequests() {
        when(requestRepository.findAll()).thenReturn(Arrays.asList(requestA1, new Request()));
        List<Request> results = reportService.getSystemWideRequests();
        assertEquals(2, results.size());
        verify(requestRepository).findAll();
    }

    @Test
    void getSystemWideRequestStatusCounts_forPO_returnsCorrectCounts() {
        Request reqApproved = new Request(); reqApproved.setStatus(RequestStatus.APPROVED);
        Request reqPending = new Request(); reqPending.setStatus(RequestStatus.PENDING);
        when(requestRepository.findAll()).thenReturn(Arrays.asList(reqApproved, reqPending, reqPending));

        Map<RequestStatus, Long> counts = reportService.getSystemWideRequestStatusCounts();

        assertEquals(1L, counts.get(RequestStatus.APPROVED));
        assertEquals(2L, counts.get(RequestStatus.PENDING));
        verify(requestRepository).findAll();
    }

    // --- CSCS Tests ---
    @Test
    void getActionsByReviewerRoles_forCSCS_returnsFilteredActions() {
        User hhrmdReviewer = new User(); hhrmdReviewer.setRole(Role.HHRMD);
        User doReviewer = new User(); doReviewer.setRole(Role.DO);
        User hroSubmitter = new User(); hroSubmitter.setRole(Role.HRO); // Should be filtered out

        ReviewHistory rh1 = new ReviewHistory(); rh1.setReviewer(hhrmdReviewer);
        ReviewHistory rh2 = new ReviewHistory(); rh2.setReviewer(doReviewer);
        ReviewHistory rh3 = new ReviewHistory(); rh3.setReviewer(hroSubmitter); // Not a reviewer role

        when(reviewHistoryRepository.findAll()).thenReturn(Arrays.asList(rh1, rh2, rh3));

        List<Role> targetRoles = Arrays.asList(Role.HHRMD, Role.DO);
        List<ReviewHistory> results = reportService.getActionsByReviewerRoles(targetRoles);

        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(rh -> targetRoles.contains(rh.getReviewer().getRole())));
        verify(reviewHistoryRepository).findAll();
    }

    @Test
    void getEmployeeProfileSystemWide_forCSCS_returnsEmployee() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(empA1));
        Employee foundEmp = reportService.getEmployeeProfileSystemWide(1L);
        assertEquals(empA1.getEmployeeEntityId(), foundEmp.getEmployeeEntityId());
        verify(employeeRepository).findById(1L);
    }


    // --- HRRP Tests ---
    @Test
    void getRequestsForMyInstitution_forHRRP_returnsInstitutionSpecificRequests() {
        when(institutionRepository.findById(100L)).thenReturn(Optional.of(instA));
        when(requestRepository.findByEmployee_InstitutionRef(instA)).thenReturn(Collections.singletonList(requestA1));

        List<Request> results = reportService.getRequestsForMyInstitution(hrrpUser);

        assertEquals(1, results.size());
        assertEquals(requestA1.getId(), results.get(0).getId());
        verify(institutionRepository).findById(100L);
        verify(requestRepository).findByEmployee_InstitutionRef(instA);
    }

    @Test
    void getRequestsForMyInstitution_forHRRP_throwsAccessDeniedIfUserNotHRRP() {
        User nonHrrpUser = new User(); nonHrrpUser.setRole(Role.HRO); nonHrrpUser.setInstitutionId("100");

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            reportService.getRequestsForMyInstitution(nonHrrpUser);
        });
        assertEquals("User is not an HRRP or institution ID is missing.", exception.getMessage());
    }

    @Test
    void getRequestsForMyInstitution_forHRRP_throwsRuntimeExceptionIfInstitutionNotFound() {
        when(institutionRepository.findById(100L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reportService.getRequestsForMyInstitution(hrrpUser);
        });
        assertEquals("Institution not found for HRRP: 100", exception.getMessage());
    }

    @Test
    void getEmployeesInMyInstitution_forHRRP_returnsInstitutionSpecificEmployees() {
        when(institutionRepository.findById(100L)).thenReturn(Optional.of(instA));
        when(employeeRepository.findByInstitutionRef(instA)).thenReturn(Collections.singletonList(empA1));

        List<Employee> results = reportService.getEmployeesInMyInstitution(hrrpUser);

        assertEquals(1, results.size());
        assertEquals(empA1.getEmployeeEntityId(), results.get(0).getEmployeeEntityId());
        verify(institutionRepository).findById(100L);
        verify(employeeRepository).findByInstitutionRef(instA);
    }

    @Test
    void getEmployeeProfileInMyInstitution_forHRRP_returnsEmployeeIfInInstitution() {
        when(institutionRepository.findById(100L)).thenReturn(Optional.of(instA));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(empA1)); // empA1 belongs to instA

        Employee foundEmp = reportService.getEmployeeProfileInMyInstitution(hrrpUser, 1L);

        assertEquals(empA1.getEmployeeEntityId(), foundEmp.getEmployeeEntityId());
        verify(institutionRepository).findById(100L);
        verify(employeeRepository).findById(1L);
    }

    @Test
    void getEmployeeProfileInMyInstitution_forHRRP_throwsAccessDeniedIfNotInInstitution() {
        Employee empB_in_InstB = new Employee(); // empB1 is in instB
        empB_in_InstB.setId(2L);
        empB_in_InstB.setInstitutionRef(instB);

        when(institutionRepository.findById(100L)).thenReturn(Optional.of(instA)); // HRRP is for InstA
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(empB_in_InstB));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            reportService.getEmployeeProfileInMyInstitution(hrrpUser, 2L);
        });
        assertEquals("Employee does not belong to HRRP's institution.", exception.getMessage());
    }

    @Test
    void trackRequestsSubmittedByMyInstitutionHROs_forHRRP_Success() {
        User hroInInstA = new User();
        hroInInstA.setRole(Role.HRO);
        hroInInstA.setInstitutionId(instA.getId().toString()); // "100"

        Request hroRequest = new Request();
        hroRequest.setSubmittedBy(hroInInstA);
        hroRequest.setEmployee(empA1); // empA1 is in instA

        when(institutionRepository.findById(100L)).thenReturn(Optional.of(instA));
        when(userRepository.findAll()).thenReturn(Collections.singletonList(hroInInstA)); // Only one HRO for simplicity
        when(requestRepository.findBySubmittedBy(hroInInstA)).thenReturn(Collections.singletonList(hroRequest));

        List<Request> results = reportService.trackRequestsSubmittedByMyInstitutionHROs(hrrpUser);

        assertEquals(1, results.size());
        assertSame(hroRequest, results.get(0));
        verify(institutionRepository).findById(100L);
        verify(userRepository).findAll();
        verify(requestRepository).findBySubmittedBy(hroInInstA);
    }

}
