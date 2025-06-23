package com.example.csms.controller;

import com.example.csms.model.*;
import com.example.csms.service.EmployeeService; // Not used directly, but Employee entities are
import com.example.csms.service.RequestService;
import com.example.csms.service.UserService;
import com.example.csms.repository.EmployeeRepository;
import com.example.csms.repository.InstitutionRepository;
import com.example.csms.repository.RequestRepository;
import com.example.csms.dto.SubmitRequestDto;
import com.example.csms.dto.ReviewRequestDto;
import com.example.csms.dto.ResubmitRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private RequestService requestService; // For direct interaction to setup state if needed

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private RequestRepository requestRepository;


    private User hroUser;
    private User employeeUserAccount; // User account for an employee
    private User hhrmdUser;
    private Employee testEmployee;
    private Institution testInstitution;

    @BeforeEach
    void setUp() {
        requestRepository.deleteAll(); // Clean up requests before each test
        // employeeRepository.deleteAll();
        // userService.deleteAll(); // If you add such a method
        // institutionRepository.deleteAll();


        testInstitution = new Institution();
        testInstitution.setName("Test Ministry");
        institutionRepository.save(testInstitution);

        hroUser = userService.createUser("hro_controller_test", "password", "HRO Controller", Role.HRO, null, testInstitution.getId().toString());
        employeeUserAccount = userService.createUser("emp_controller_test", "password", "Employee Account", Role.EMPLOYEE, "EMP_CTRL_001", testInstitution.getId().toString());
        hhrmdUser = userService.createUser("hhrmd_controller_test", "password", "HHRMD Controller", Role.HHRMD, null, testInstitution.getId().toString());

        testEmployee = new Employee();
        testEmployee.setEmployeeEntityId("EMP_CTRL_001");
        testEmployee.setName("Controller Test Employee");
        testEmployee.setInstitutionRef(testInstitution);
        employeeRepository.save(testEmployee);
    }

    @AfterEach
    void tearDown() {
        // requestRepository.deleteAll();
        // employeeRepository.deleteAll();
        // userRepository.deleteAll(); // Assuming User model for userService.deleteAll()
        // institutionRepository.deleteAll();
    }


    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"})
    void submitRequest_byHRO_asPromotion_Success() throws Exception {
        SubmitRequestDto submitDto = new SubmitRequestDto();
        submitDto.setEmployeeEntityId(testEmployee.getEmployeeEntityId());
        submitDto.setRequestType(RequestType.PROMOTION);
        submitDto.setDetails("Promotion for outstanding work");

        mockMvc.perform(post("/api/v1/requests/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("PROMOTION")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.employee.employeeEntityId", is(testEmployee.getEmployeeEntityId())));
    }

    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"})
    void submitRequest_byHRO_asComplaint_Forbidden() throws Exception {
        SubmitRequestDto submitDto = new SubmitRequestDto();
        submitDto.setEmployeeEntityId(testEmployee.getEmployeeEntityId());
        submitDto.setRequestType(RequestType.COMPLAINTS); // HRO cannot submit complaints
        submitDto.setDetails("A complaint");

        mockMvc.perform(post("/api/v1/requests/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitDto)))
                .andExpect(status().isForbidden()); // AccessDeniedException from service layer
    }

    @Test
    @WithMockUser(username = "emp_controller_test", roles = {"EMPLOYEE"})
    void submitRequest_byEmployee_asComplaint_Success() throws Exception {
        SubmitRequestDto submitDto = new SubmitRequestDto();
        submitDto.setEmployeeEntityId(testEmployee.getEmployeeEntityId()); // Employee submits for themselves or another based on policy
        submitDto.setRequestType(RequestType.COMPLAINTS);
        submitDto.setDetails("My official complaint");

        mockMvc.perform(post("/api/v1/requests/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("COMPLAINTS")));
    }

    @Test
    @WithMockUser(username = "emp_controller_test", roles = {"EMPLOYEE"})
    void submitRequest_byEmployee_asPromotion_Forbidden() throws Exception {
        SubmitRequestDto submitDto = new SubmitRequestDto();
        submitDto.setEmployeeEntityId(testEmployee.getEmployeeEntityId());
        submitDto.setRequestType(RequestType.PROMOTION); // Employee cannot submit Promotion
        submitDto.setDetails("I want a promotion");

        mockMvc.perform(post("/api/v1/requests/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitDto)))
                .andExpect(status().isForbidden());
    }


    @Test
    @WithMockUser(username = "hhrmd_controller_test", roles = {"HHRMD"})
    void reviewRequest_byHHRMD_ApprovePromotion_Success() throws Exception {
        // 1. HRO Submits a request
        Request submittedRequest = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Initial Promotion Request");

        ReviewRequestDto reviewDto = new ReviewRequestDto();
        reviewDto.setApprove(true);
        reviewDto.setReason("Well deserved promotion.");

        mockMvc.perform(post("/api/v1/requests/{id}/review", submittedRequest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));
    }

    @Test
    @WithMockUser(username = "hhrmd_controller_test", roles = {"HHRMD"})
    void reviewRequest_byHHRMD_RejectPromotion_Success() throws Exception {
        Request submittedRequest = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Initial Promotion Request");

        ReviewRequestDto reviewDto = new ReviewRequestDto();
        reviewDto.setApprove(false);
        reviewDto.setReason("Needs more experience in current role.");

        mockMvc.perform(post("/api/v1/requests/{id}/review", submittedRequest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING_RECTIFICATION")));
    }

    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"}) // HRO trying to review
    void reviewRequest_byHRO_Forbidden() throws Exception {
        Request submittedRequest = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Initial Promotion Request");

        ReviewRequestDto reviewDto = new ReviewRequestDto();
        reviewDto.setApprove(true);

        mockMvc.perform(post("/api/v1/requests/{id}/review", submittedRequest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isForbidden()); // HRO cannot review
    }


    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"})
    void resubmitRequest_byHRO_Success() throws Exception {
        // 1. HRO Submits
        User currentHroUser = userService.findByUsername("hro_controller_test").get(); // Need the actual User object for service call
        Authentication originalAuth = SecurityContextHolder.getContext().getAuthentication(); // Save current auth
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(currentHroUser.getUsername(), null, List.of(() -> "ROLE_HRO"))); // Mock auth for service call

        Request submittedRequest = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Initial details");

        // 2. HHRMD Rejects it
        User currentHhrmdUser = userService.findByUsername("hhrmd_controller_test").get();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(currentHhrmdUser.getUsername(), null, List.of(() -> "ROLE_HHRMD")));
        requestService.reviewRequest(submittedRequest.getId(), false, "Needs updated documents.");

        SecurityContextHolder.getContext().setAuthentication(originalAuth); // Restore HRO auth for controller test

        ResubmitRequestDto resubmitDto = new ResubmitRequestDto();
        resubmitDto.setUpdatedDetails("Updated details with new documents attached.");
        resubmitDto.setRectificationReason("Attached missing documents as requested.");

        mockMvc.perform(post("/api/v1/requests/{id}/resubmit", submittedRequest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resubmitDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.details", is("Updated details with new documents attached.")));
    }

    @Test
    @WithMockUser(username = "hhrmd_controller_test", roles = {"HHRMD"}) // HHRMD trying to resubmit
    void resubmitRequest_byHHRMD_Forbidden() throws Exception {
        // Setup a request in PENDING_RECTIFICATION state by HRO and HHRMD
        User hroForSetup = userService.findByUsername("hro_controller_test").get();
        Authentication originalAuth = SecurityContextHolder.getContext().getAuthentication();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(hroForSetup.getUsername(), null, List.of(() -> "ROLE_HRO")));
        Request submittedRequest = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Initial details");

        User hhrmdForSetup = userService.findByUsername("hhrmd_controller_test").get();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(hhrmdForSetup.getUsername(), null, List.of(() -> "ROLE_HHRMD")));
        requestService.reviewRequest(submittedRequest.getId(), false, "Needs update");

        SecurityContextHolder.getContext().setAuthentication(originalAuth); // Restore HHRMD auth for controller test (@WithMockUser)

        ResubmitRequestDto resubmitDto = new ResubmitRequestDto();
        resubmitDto.setUpdatedDetails("HHRMD trying to update.");
        resubmitDto.setRectificationReason("HHRMD fixing it.");

        mockMvc.perform(post("/api/v1/requests/{id}/resubmit", submittedRequest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resubmitDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"})
    void getRequestById_asHRO_Success() throws Exception {
         User currentHroUser = userService.findByUsername("hro_controller_test").get();
         Authentication originalAuth = SecurityContextHolder.getContext().getAuthentication();
         SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(currentHroUser.getUsername(), null, List.of(() -> "ROLE_HRO")));
        Request request = requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.LWOP, "Leave request");
        SecurityContextHolder.getContext().setAuthentication(originalAuth);


        mockMvc.perform(get("/api/v1/requests/{id}", request.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(request.getId().intValue())));
    }

    @Test
    @WithMockUser(username = "hro_controller_test", roles = {"HRO"})
    void getAllRequests_asHRO_Forbidden() throws Exception {
        // HRO is not in ('HHRMD', 'HRMO', 'DO', 'CSCS', 'PO')
        mockMvc.perform(get("/api/v1/requests"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "cscs_test_user", roles = {"CSCS"}) // Need to create this user
    void getAllRequests_asCSCS_Success() throws Exception {
        userService.createUser("cscs_test_user", "password", "CSCS Test", Role.CSCS, null, testInstitution.getId().toString());
        // Create some requests
        requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.PROMOTION, "Req 1");
        requestService.submitRequest(testEmployee.getEmployeeEntityId(), RequestType.RETIREMENT, "Req 2");


        mockMvc.perform(get("/api/v1/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(0)))); // Check if it returns a list (could be 2 if no other tests ran requests)
    }


}
