package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.ComplaintType;
import com.yussufrajab.csms.enums.RequestStatus; // Reusing for complaint status as per FR6
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "complaints")
public class Complaint extends BaseRequestEntity { // Extends BaseRequestEntity for common fields like ID, SubmittedBy, SubmissionDate, Status, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintType complaintType; // As per FR2: Unconfirmed Employee, General Job-Related, Other

    // Fields from SRS "Complaints" table definition
    @Column(nullable = false)
    private String complainantName; // Though submittedBy in BaseRequestEntity links to User, this might be for display or if HRO submits on behalf

    private String respondentName;

    private String complaintSource; // e.g., Direct, Anonymous, Referral

    private LocalDate incidentDate;

    @Lob
    private String description; // From workflow example ("Delayed confirmation")

    // Documents from SRS "Complaints" table definition
    // Scenario: Unconfirmed Employee documents
    @Column(name = "doc_employment_contract")
    private String employmentContractPath;
    @Column(name = "doc_ardhil_hali")
    private String ardhilHaliPath;

    // FR5: Supporting documents (PDF, image, max 1MB) - use supportingDocumentPaths from BaseRequestEntity

    // FR6: Predefined stages: Pending, Under Review, Resolved, Rejected.
    // These map well to the RequestStatus enum, potentially with an alias or direct use.
    // BaseRequestEntity already has 'status' (RequestStatus).

    // FR8: Escalation to HHRMD. This is a workflow aspect, may not need a direct DB field
    // unless tracking escalation state specifically. Could be a comment or status change.

    @Lob
    private String resolutionNotes; // NFR7.1: Immutable once submitted. Application logic to enforce.
}
