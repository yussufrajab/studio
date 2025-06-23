package com.yussufrajab.csms.entity;

import com.yussufrajab.csms.enums.RetirementStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "employee_profiles")
public class EmployeeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Internal DB ID

    @Column(nullable = false)
    private String fullName;

    private String profileImagePath; // Store path to the image file

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String placeOfBirth;

    @Column(nullable = false)
    private String region; // e.g., Region within Zanzibar/Tanzania

    @Column(nullable = false)
    private String countryOfBirth;

    @Column(nullable = false, unique = true)
    private String payrollNumber;

    @Column(nullable = false, unique = true)
    private String zanzibarIdentificationNumber; // ZAN-ID

    @Column(nullable = false, unique = true)
    private String zssfNumber; // Zanzibar Social Security Fund Number

    @Column(nullable = false)
    private String rank; // Scheme of service rank/grade

    @Column(nullable = false)
    private String ministry;

    @Column(nullable = false)
    private String institution; // MDA (Ministry, Department, Agency)

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String appointmentType; // e.g., Permanent, Contract, Temporary

    @Column(nullable = false)
    private String contractType; // e.g., Regular, Special

    @Column(nullable = false)
    private LocalDate recentTitleDate; // Date of last promotion/appointment to current title

    @Column(nullable = false)
    private String currentReportingOffice; // Who the employee reports to

    @Column(nullable = false)
    private String currentWorkplace; // Physical location or office

    @Column(nullable = false)
    private LocalDate employmentDate; // First employment date in public service

    private LocalDate confirmationDate; // Nullable, as per SRS

    // Supporting Documents - Storing paths or references to a document management system
    // For simplicity here, storing paths. Could be a separate Document entity later.
    private String ardhilHaliPath;
    private String confirmationLetterPath; // This is the letter confirming their employment

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean loanGuaranteeStatus = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RetirementStatus retirementStatus = RetirementStatus.ACTIVE;

    // Relationships to Request Tables (lazy loaded)
    // These will be mappedBy the employee field in the respective request entities

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Complaint> complaints = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LeaveWithoutPayRequest> leaveWithoutPayRecords = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ConfirmationRequest> confirmationRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TerminationRequest> terminationRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DismissalRequest> dismissalRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PromotionRequest> promotionRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChangeOfCadreRequest> changeOfCadreRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ServiceExtensionRequest> serviceExtensionRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<RetirementRequest> retirementRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ResignationRequest> resignationRequests = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ContractualEmploymentRequest> contractualEmploymentRequests = new ArrayList<>();


    // Convenience methods to add/remove linked requests if needed, maintaining bi-directional link
    public void addComplaint(Complaint complaint) {
        complaints.add(complaint);
        complaint.setEmployee(this);
    }

    public void removeComplaint(Complaint complaint) {
        complaints.remove(complaint);
        complaint.setEmployee(null);
    }

    public void addLeaveWithoutPayRequest(LeaveWithoutPayRequest request) {
        leaveWithoutPayRecords.add(request);
        request.setEmployee(this);
    }

    public void removeLeaveWithoutPayRequest(LeaveWithoutPayRequest request) {
        leaveWithoutPayRecords.remove(request);
        request.setEmployee(null);
    }
    // Add similar add/remove methods for other request types
}
