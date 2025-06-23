package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.ProbationPeriodStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "confirmation_requests")
public class ConfirmationRequest extends BaseRequestEntity {

    @Enumerated(EnumType.STRING)
    private ProbationPeriodStatus probationPeriodStatus;

    // Specific document paths for this request type
    // These could also be added to the 'supportingDocumentPaths' list in BaseRequestEntity,
    // but having them as separate fields can be more explicit if they are always required.
    // For now, I'll assume they are distinct and important enough for their own columns.
    // If they are just part of a flexible list of documents, then use supportingDocumentPaths.

    @Column(name = "doc_letter_from_ao")
    private String letterFromAccountingOfficerPath; // "Letter from Accounting Officer"

    @Column(name = "doc_ipa_certificate")
    private String ipaCertificatePath; // "IPA Certificate"

    @Column(name = "doc_performance_appraisal")
    private String performanceAppraisalPath; // "Performance Appraisal"

    // Document uploaded by HHRMD/HRMO on approval/rejection (FR4.5)
    // This could be a "decision_letter.pdf"
    @Column(name = "doc_decision_letter")
    private String decisionLetterPath;

}
