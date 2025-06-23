package com.example.csms.dto;

import jakarta.validation.constraints.NotNull;
// No NotBlank on reason if approval doesn't require it, but rejection does.
// This will be handled in service layer.
public class ReviewRequestDto {
    @NotNull
    private Boolean approve;
    private String reason; // Reason for rejection, or comment for approval

    // Getters and Setters
    public Boolean getApprove() {
        return approve;
    }

    public void setApprove(Boolean approve) {
        this.approve = approve;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
