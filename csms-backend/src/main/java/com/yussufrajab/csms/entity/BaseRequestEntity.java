package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@MappedSuperclass // Indicates that this is a base class and its fields should be mapped to the tables of its subclasses
public abstract class BaseRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Auto-generated Request ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_user_id", nullable = false)
    private User submittedBy; // Links to the User entity (HRO or Employee for Complaints)

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime submissionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_user_id") // Nullable
    private User approver; // Links to User entity (HHRMD, HRMO, or DO)

    private LocalDate approvalRejectionDate; // Nullable

    @Lob // For potentially long text
    private String comments; // General comments by approver or HRO

    @Lob
    private String rejectionReason; // Specific field for rejection reason

    // For supporting documents - storing paths or references.
    // Using ElementCollection for simple list of strings (file paths).
    // For more complex document metadata, a separate Document entity would be better.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "request_supporting_documents", joinColumns = @JoinColumn(name = "request_id"))
    @Column(name = "document_path")
    private List<String> supportingDocumentPaths = new ArrayList<>();

    @UpdateTimestamp
    private LocalDateTime lastModifiedDate;

}
