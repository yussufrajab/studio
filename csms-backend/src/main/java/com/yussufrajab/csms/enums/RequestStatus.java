package com.yussufrajab.csms.enums;

public enum RequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    UNDER_REVIEW, // For complaints or multi-step processes
    RECTIFIED,    // When HRO resubmits after rejection
    CLOSED        // For completed/archived requests
}
