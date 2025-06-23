package com.example.csms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
// Consider using a JSON type for details if your DB supports it well,
// or a separate table for complex, varying details.
// For simplicity, I'll use @Lob for a CLOB/TEXT type for details for now.
// import org.hibernate.annotations.JdbcTypeCode;
// import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "requests")
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee; // The employee for whom the request is made

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_user_id", nullable = false)
    private User submittedBy; // The user who submitted the request (e.g., HRO or Employee)

    @Column(nullable = false)
    private LocalDateTime submittedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Lob // Large Object - typically maps to TEXT or CLOB
    @Column(columnDefinition = "TEXT") // Explicitly define as TEXT for cross-db compatibility
    private String details; // JSON or structured text for request-specific data

    // For documents, it's often better to have a separate Document entity
    // linking to the request and storing URLs or blob references.
    // For now, let's assume URLs are stored or it's handled differently.
    // @ElementCollection
    // @CollectionTable(name = "request_documents", joinColumns = @JoinColumn(name = "request_id"))
    // @Column(name = "document_url")
    // private List<String> documentUrls;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ReviewHistory> reviewHistory;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RequestType getType() {
        return type;
    }

    public void setType(RequestType type) {
        this.type = type;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(User submittedBy) {
        this.submittedBy = submittedBy;
    }

    public LocalDateTime getSubmittedDate() {
        return submittedDate;
    }

    public void setSubmittedDate(LocalDateTime submittedDate) {
        this.submittedDate = submittedDate;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public List<ReviewHistory> getReviewHistory() {
        return reviewHistory;
    }

    public void setReviewHistory(List<ReviewHistory> reviewHistory) {
        this.reviewHistory = reviewHistory;
    }
}
