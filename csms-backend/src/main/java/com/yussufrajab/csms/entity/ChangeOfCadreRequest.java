package com.yussufrajab.csms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "change_of_cadre_requests")
public class ChangeOfCadreRequest extends BaseRequestEntity {

    @Column(nullable = false)
    private String currentCadre;

    @Column(nullable = false)
    private String proposedCadre;

    // Documents from SRS "Change of Cadre" table definition
    @Column(name = "doc_request_letter") // "Request Letter"
    private String requestLetterPath;
    @Column(name = "doc_educational_certificate") // "Educational Certificate"
    private String educationalCertificatePath;

    // From workflow: HHRMD/HRMO uploads approval_letter.pdf if approved
    @Column(name = "doc_approval_letter")
    private String approvalLetterPath;

    // FR9.1: "completed built-in Cadre Change Form"
    // This form data (Jina kamili, Payroll, Zan-id, etc.) seems to be data about the employee
    // and the change itself. Some of it is already on EmployeeProfile.
    // The specific items like "Mwaka alomaliza masomo" (Year of study completion)
    // might need to be added here if they are not part of the core EmployeeProfile
    // or if they are specific to the context of this request.
    // For now, assuming these are captured and displayed on the frontend, and key ones stored.
    // If the form itself (as a filled document) needs to be stored, it would be a path.
    // The table in FR9.1 looks like a summary view, not necessarily all new DB fields.
    // Let's add a field for "Year of Study Completion" as it's mentioned in the form example.
    private Integer yearOfStudyCompletion;


    // FR9.3: Cadre change history (This entity instance is part of that history)
}
