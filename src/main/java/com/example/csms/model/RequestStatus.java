package com.example.csms.model;

public enum RequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    RESOLVED, // For complaints
    PENDING_RECTIFICATION // For rejected requests that can be resubmitted
}
