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
@Table(name = "termination_requests")
public class TerminationRequest extends BaseRequestEntity {

    // Scenario from SRS workflow for Termination: "Misconduct"
    // FR6.1 refers to "confirmed employees"
    // The "Scenario" field in SRS is under "Termination/Dismissal" table,
    // but workflows separate them. Let's assume a reason/scenario field is useful.

    @Enumerated(EnumType.STRING)
    private TerminationDismissalScenario scenario; // e.g., MISCONDUCT_CONFIRMED

    @Lob
    private String reasonDetails; // More detailed text for the reason/scenario

    private LocalDate incidentDate; // For disciplinary scenarios

    // Documents as per FR6.1 (for confirmed employees)
    // Storing paths. These can also be part of the base supportingDocumentPaths list.
    // If these are *always* the specific documents, separate fields are okay.
    @Column(name = "doc_request_letter")
    private String requestLetterPath;

    @Column(name = "doc_verbal_warning")
    private String verbalWarningLettersPath; // Could be multiple, or store as a JSON array string, or use @ElementCollection

    @Column(name = "doc_written_warning")
    private String writtenWarningLettersPath;

    @Column(name = "doc_investigation_report")
    private String investigationCommitteeReportPath;

    @Column(name = "doc_summons_letter")
    private String summonsLetterPath;

    // FR6.4: Signed Response Letter by DO/HHRMD
    @Column(name = "doc_response_letter")
    private String responseLetterPath;

    // Note: "Any other related attachments" from FR6.1 would go into the
    // supportingDocumentPaths list in BaseRequestEntity.
}
