package com.yussufrajab.csms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "contractual_employment_requests")
public class ContractualEmploymentRequest extends BaseRequestEntity {

    @Column(nullable = false)
    private String employerName; // Name of the entity employing (could be external or internal project)

    @Column(nullable = false)
    private String jobTitle;

    @Column(nullable = false)
    private LocalDate employmentStartDate;

    @Column(nullable = false)
    private Integer employmentDurationMonths; // Duration in months

    private LocalDate employmentEndDate; // Auto-calculated: employmentStartDate + employmentDurationMonths

    // Specific document: "Official Letter"
    @Column(name = "doc_official_letter")
    private String officialLetterPath;

    // Lifecycle methods for auto-calculation if needed, or done in service layer
    @jakarta.persistence.PrePersist
    @jakarta.persistence.PreUpdate
    public void calculateEndDate() {
        if (employmentStartDate != null && employmentDurationMonths != null && employmentDurationMonths > 0) {
            this.employmentEndDate = this.employmentStartDate.plusMonths(this.employmentDurationMonths);
        } else {
            this.employmentEndDate = null; // Or handle error
        }
    }
}
