package com.yussufrajab.csms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "lwop_requests")
public class LeaveWithoutPayRequest extends BaseRequestEntity {

    @Lob
    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private LocalDate leaveStartDate;

    @Column(nullable = false)
    private LocalDate leaveEndDate;

    // Specific document: "Letter from Accounting Officer"
    // As per SRS, this is a document for LWOP.
    // FR5.6 mentions "Letter of request from the employer" - assuming this is the same or similar.
    @Column(name = "doc_letter_from_ao") // Or a more generic name if it varies
    private String letterFromAccountingOfficerPath;

    // FR5.2: Checkbox for no active bank loan guarantees
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean noActiveBankLoanGuarantee = false;

    // FR5.8: Signed approval/disapproval letter by HHRMD/HRMO
    @Column(name = "doc_decision_letter")
    private String decisionLetterPath;
}
