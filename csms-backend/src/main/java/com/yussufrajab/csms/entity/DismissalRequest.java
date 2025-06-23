package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.TerminationDismissalScenario;
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
@Table(name = "dismissal_requests")
public class DismissalRequest extends BaseRequestEntity {

    // FR6.2 refers to "unconfirmed employees"
    @Enumerated(EnumType.STRING)
    private TerminationDismissalScenario scenario;
    // e.g., UNCONFIRMED_OUT_OF_PROBATION, NOT_RETURNING_AFTER_LEAVE, DISCIPLINARY_PROBATION

    @Lob
    private String reasonDetails; // More detailed text for the reason/scenario

    private LocalDate incidentDate; // For disciplinary scenarios if applicable to dismissal

    // Documents from SRS "Termination/Dismissal" table section for specific scenarios:
    // Scenario: Unconfirmed Out of Probation
    @Column(name = "doc_unconfirmed_application_letter") // Distinguishing from termination's request letter
    private String unconfirmedApplicationLetterPath;
    @Column(name = "doc_probation_extension")
    private String probationExtensionPath;
    @Column(name = "doc_unconfirmed_perf_appraisal")
    private String unconfirmedPerformanceAppraisalPath;

    // Scenario: Not Returning After Leave
    // @Column(name = "doc_not_returning_application_letter") // if different from above
    @Column(name = "doc_reminder_letter")
    private String reminderLetterPath;
    @Column(name = "doc_warning_letter") // Generic, could be different from termination's
    private String warningLetterPath;
    @Column(name = "doc_media_announcement")
    private String mediaAnnouncementPath;

    // Scenario: Disciplinary (for probation)
    @Column(name = "doc_disciplinary_investigation_report")
    private String disciplinaryInvestigationReportPath; // if different from termination's
    @Column(name = "doc_prior_disciplinary_actions")
    private String evidenceOfPriorDisciplinaryActionsPath;


    // FR6.2 mentions "Requesting letter for dismissal" (optional)
    @Column(name = "doc_request_letter_dismissal")
    private String requestLetterDismissalPath;

    // FR6.4: Signed Response Letter by DO/HHRMD
    @Column(name = "doc_response_letter")
    private String responseLetterPath;

    // Note: "Any other related attachments" from FR6.2 would go into the
    // supportingDocumentPaths list in BaseRequestEntity.
}
