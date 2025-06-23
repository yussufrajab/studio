package com.yussufrajab.csms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// import java.time.LocalDate; // Not directly in SRS table for this, but useful for new retirement date

@Getter
@Setter
@Entity
@Table(name = "service_extension_requests")
public class ServiceExtensionRequest extends BaseRequestEntity {

    @Column(nullable = false)
    private Integer extensionDurationYears; // "Extension Duration (Number, Years)" from SRS table
                                          // Workflow example says "6 months" - need consistency.
                                          // Assuming SRS table is primary, so using Years.
                                          // If months, change type & name. Let's use months for now based on workflow example.

    private Integer extensionDurationMonths; // More flexible based on workflow "6 months" example

    // Documents from SRS "Service Extension" table definition (FR12.2)
    @Column(name = "doc_request_letter") // "Request Letter" from SRS table / "justification.pdf" from workflow
    private String requestLetterPath; // or justificationLetterPath
    @Column(name = "doc_employee_consent_letter") // "Employee Consent Letter"
    private String employeeConsentLetterPath;

    // FR12.6: Signed Decision Letter by HHRMD/HRMO
    @Column(name = "doc_decision_letter")
    private String decisionLetterPath;

    // FR12.3: System automatically check retirement eligibility dates (Service layer)
    // FR12.4: System shall notify HR 90 days prior to extension expiration (Separate notification/scheduler mechanism)
    // If approved, employee's retirement_date might be updated (Workflow).
    // Consider storing the new proposed retirement date if extension is approved.
    // private LocalDate newProposedRetirementDate;
}
