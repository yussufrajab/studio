package com.example.csms.dto;

import com.example.csms.model.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitRequestDto {
    @NotBlank
    private String employeeEntityId; // The business ID of the employee
    @NotNull
    private RequestType requestType;
    @NotBlank
    private String details; // JSON or structured text

    // Getters and Setters
    public String getEmployeeEntityId() {
        return employeeEntityId;
    }

    public void setEmployeeEntityId(String employeeEntityId) {
        this.employeeEntityId = employeeEntityId;
    }

    public RequestType getRequestType() {
        return requestType;
    }

    public void setRequestType(RequestType requestType) {
        this.requestType = requestType;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
