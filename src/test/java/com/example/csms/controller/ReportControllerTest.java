package com.example.csms.controller;

import com.example.csms.model.*;
import com.example.csms.service.ReportService;
import com.example.csms.service.UserService;
import com.example.csms.service.RequestService; // To create some requests
import com.example.csms.repository.EmployeeRepository;
import com.example.csms.repository.InstitutionRepository;
import com.example.csms.repository.RequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private RequestService requestService; // To create data for reports

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private RequestRepository requestRepository;


    private User poUser;
    private User cscsUser;
    private User hrrpUserA;
    private User hroUserA; // To submit requests for HRRP A to see
    private Employee employeeA;
    private Institution institutionA;

    @BeforeEach
    void setUp() {
        requestRepository.deleteAll();

        institutionA = new Institution();
        institutionA.setName("Inst A Reports");
        institutionRepository.save(institutionA);

        poUser = userService.createUser("po_report_test", "password", "PO Reports", Role.PO, null, institutionA.getId().toString());
        cscsUser = userService.createUser("cscs_report_test", "password", "CSCS Reports", Role.CSCS, null, institutionA.getId().toString());
        hrrpUserA = userService.createUser("hrrpA_report_test", "password", "HRRPA Reports", Role.HRRP, null, institutionA.getId().toString());

        employeeA = new Employee();
        employeeA.setEmployeeEntityId("EMP_REP_A1");
        employeeA.setName("Report Employee A");
        employeeA.setInstitutionRef(institutionA);
        employeeRepository.save(employeeA);

        hroUserA = userService.createUser("hroA_report_test", "password", "HROA Reports", Role.HRO, null, institutionA.getId().toString());

        // HRO User A submits a request for Employee A (who is in Institution A)
        // Need to set security context for this service call
        Authentication originalAuth = SecurityContextHolder.getContext().getAuthentication();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(hroUserA.getUsername(), null, List.of(() -> "ROLE_HRO")));
        requestService.submitRequest(employeeA.getEmployeeEntityId(), RequestType.PROMOTION, "Report test promotion");
        SecurityContextHolder.getContext().setAuthentication(originalAuth); // Restore
    }

    @AfterEach
    void tearDown() {
        // Transactional should handle rollback
    }


    @Test
    @WithMockUser(username = "po_report_test", roles = {"PO"})
    void getSystemWideRequestsForPO_Success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/po/system-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1)))) // At least the one created in setup
                .andExpect(jsonPath("$[0].type", is("PROMOTION")));
    }

    @Test
    @WithMockUser(username = "hrrpA_report_test", roles = {"HRRP"}) // HRRP A
    void getSystemWideRequestsForPO_asHRRP_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/po/system-requests"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "cscs_report_test", roles = {"CSCS"})
    void getAllReviewActionsForCSCS_Success() throws Exception {
        // Could add a review action in setup for more robust test
        mockMvc.perform(get("/api/v1/reports/cscs/review-actions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(0))));
    }

    @Test
    @WithMockUser(username = "hrrpA_report_test", roles = {"HRRP"})
    void getRequestsForMyInstitutionForHRRP_Success() throws Exception {
        // hrrpUserA is linked to institutionA, and a request was made for employeeA in institutionA
        mockMvc.perform(get("/api/v1/reports/hrrp/my-institution-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employee.employeeEntityId", is(employeeA.getEmployeeEntityId())));
    }

    @Test
    @WithMockUser(username = "po_report_test", roles = {"PO"}) // PO trying to access HRRP specific endpoint
    void getRequestsForMyInstitutionForHRRP_asPO_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/hrrp/my-institution-requests"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "hrrpA_report_test", roles = {"HRRP"})
    void getEmployeesInMyInstitutionForHRRP_Success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/hrrp/my-institution-employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employeeEntityId", is(employeeA.getEmployeeEntityId())));
    }
}
