package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.PromotionType;
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
@Table(name = "promotion_requests")
public class PromotionRequest extends BaseRequestEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionType promotionType; // FR8.1: Educational or Performance

    @Column(nullable = false)
    private String currentRank;

    @Column(nullable = false)
    private String proposedRank;

    // For Educational Promotion (FR8.2)
    private LocalDate educationCompletionDate;
    @Column(name = "doc_educational_certificate")
    private String educationalCertificatePath;
    @Column(name = "doc_tcu_certificate") // Tanzania Commission for Universities
    private String tcuCertificatePath; // (if foreign)
    @Column(name = "doc_edu_request_letter") // "Request Letter" under Educational
    private String educationalRequestLetterPath;


    // For Performance Promotion (FR8.2)
    @Column(name = "doc_perf_request_letter") // "Request Letter" under Performance
    private String performanceRequestLetterPath;
    @Column(name = "doc_appraisal_forms_3_years") // Could be multiple files or a single combined PDF
    private String appraisalForms3YearsPath;
    @Column(name = "doc_csc_recommendation_form") // "Recommendation Form" (Civil Service Commission Job Promotion Form)
    private String cscRecommendationFormPath;

    // From workflow: HHRMD/HRMO uploads promotion_letter.pdf if approved
    @Column(name = "doc_promotion_letter")
    private String promotionLetterPath;


    // FR8.3: Validate 2 years in current position (Service layer responsibility)
    // FR8.4: Promotion history (This entity instance itself is part of the history. Querying these requests for an employee gives history)
}
