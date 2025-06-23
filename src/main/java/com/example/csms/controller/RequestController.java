package com.example.csms.controller;

import com.example.csms.model.Request;
import com.example.csms.model.RequestStatus;
import com.example.csms.service.RequestService;
import com.example.csms.dto.SubmitRequestDto;
import com.example.csms.dto.ReviewRequestDto;
import com.example.csms.dto.ResubmitRequestDto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/requests")
public class RequestController {

    @Autowired
    private RequestService requestService;

    @PostMapping("/submit")
    // Authorization is handled within the service layer for submit based on type and role
    public ResponseEntity<?> submitRequest(@Valid @RequestBody SubmitRequestDto submitRequestDto) {
        try {
            Request newRequest = requestService.submitRequest(
                    submitRequestDto.getEmployeeEntityId(),
                    submitRequestDto.getRequestType(),
                    submitRequestDto.getDetails()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(newRequest);
        } catch (RuntimeException e) {
             if (e instanceof AccessDeniedException) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()") // More specific auth can be added (e.g., involved user or admin)
    public ResponseEntity<Request> getRequestById(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeEntityId}")
    @PreAuthorize("isAuthenticated()") // Or specific roles like HRO, HRRP for that employee's institution
    public ResponseEntity<List<Request>> getRequestsForEmployee(@PathVariable String employeeEntityId) {
        try {
            return ResponseEntity.ok(requestService.getRequestsForEmployee(employeeEntityId));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    @GetMapping("/user/{username}")
    @PreAuthorize("isAuthenticated()") // Or specific roles like HRO, HRRP for that employee's institution
    public ResponseEntity<List<Request>> getRequestsSubmittedByUser(@PathVariable String username) {
        // Add check to ensure only the user themselves or an admin can see this
        try {
            return ResponseEntity.ok(requestService.getRequestsSubmittedByUser(username));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HHRMD', 'HRMO', 'DO', 'CSCS', 'PO')") // General access for overview roles
    public ResponseEntity<List<Request>> getAllRequests(@RequestParam(required = false) RequestStatus status) {
        if (status != null) {
            return ResponseEntity.ok(requestService.getAllRequestsByStatus(status));
        }
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @PostMapping("/{id}/review")
    // Authorization is handled within the service for review based on type and role
    public ResponseEntity<?> reviewRequest(@PathVariable Long id, @Valid @RequestBody ReviewRequestDto reviewRequestDto) {
        try {
            Request updatedRequest = requestService.reviewRequest(
                    id,
                    reviewRequestDto.getApprove(),
                    reviewRequestDto.getReason()
            );
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            if (e instanceof AccessDeniedException) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
            }
             if (e instanceof IllegalStateException || e instanceof IllegalArgumentException) {
                 throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasRole('HRO')")
    public ResponseEntity<?> resubmitRequest(@PathVariable Long id, @Valid @RequestBody ResubmitRequestDto resubmitRequestDto) {
         try {
            Request resubmittedRequest = requestService.resubmitRequest(
                    id,
                    resubmitRequestDto.getUpdatedDetails(),
                    resubmitRequestDto.getRectificationReason()
            );
            return ResponseEntity.ok(resubmittedRequest);
        } catch (RuntimeException e) {
            if (e instanceof AccessDeniedException) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
            }
            if (e instanceof IllegalStateException) {
                 throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }
}
