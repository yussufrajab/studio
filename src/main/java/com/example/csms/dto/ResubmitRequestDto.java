package com.example.csms.dto;

import jakarta.validation.constraints.NotBlank;

public class ResubmitRequestDto {
    @NotBlank
    private String updatedDetails;
    @NotBlank
    private String rectificationReason;

    // Getters and Setters
    public String getUpdatedDetails() {
        return updatedDetails;
    }

    public void setUpdatedDetails(String updatedDetails) {
        this.updatedDetails = updatedDetails;
    }

    public String getRectificationReason() {
        return rectificationReason;
    }

    public void setRectificationReason(String rectificationReason) {
        this.rectificationReason = rectificationReason;
    }
}
