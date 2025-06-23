package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.ResignationNoticeType;
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
@Table(name = "resignation_requests")
public class ResignationRequest extends BaseRequestEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResignationNoticeType noticeType;

    // From workflow: HRO fills resignation_date and reason
    @Column(nullable = false)
    private LocalDate proposedResignationDate;

    @Lob
    private String reason;

    // Documents from SRS "Resignation" table definition (FR11.2)
    @Column(name = "doc_request_letter_hro") // "Request Letter" (likely from HRO initiating in system)
    private String hroRequestLetterPath;     // (resignation_letter.pdf from workflow is employee's letter)

    @Column(name = "doc_employee_resignation_letter", nullable = false) // Employee's actual letter
    private String employeeResignationLetterPath;

    @Column(name = "doc_payment_receipt") // (if 24-hour notice)
    private String paymentReceiptPath;

    // FR11.2 also mentions "handover notes" and "clearance forms" - these can go into general supportingDocumentPaths
    // from BaseRequestEntity.

    // FR11.4: Signed Response Letter by HRMO/HHRMD
    @Column(name = "doc_response_letter")
    private String responseLetterPath;
}
