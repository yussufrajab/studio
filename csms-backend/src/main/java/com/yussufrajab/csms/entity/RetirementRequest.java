package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.RetirementType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "retirement_requests")
public class RetirementRequest extends BaseRequestEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RetirementType retirementType; // FR10.1: Compulsory, Voluntary, Illness

    // From workflow: HRO fills retirement_date
    @Column(nullable = false)
    private LocalDate proposedRetirementDate;


    // Documents based on Retirement Type (FR10.2 and SRS table)
    // Common:
    @Column(name = "doc_request_letter") // "Request Letter"
    private String requestLetterPath; // (retirement_form.pdf from workflow)

    // For Compulsory/Voluntary:
    @Column(name = "doc_ardhil_hali")
    private String ardhilHaliPath;
    @Column(name = "doc_birth_certificate")
    private String birthCertificatePath;

    // Additional for Illness:
    @Column(name = "doc_health_board_report")
    private String healthBoardReportPath;
    @Column(name = "doc_sick_leave_records")
    private String sickLeaveRecordsPath;
    // Ardhil-Hali and Birth Certificate also listed for Illness in SRS.

    // FR10.4: Signed Response Letter by HRMO/HHRMD
    @Column(name = "doc_response_letter")
    private String responseLetterPath;
}
