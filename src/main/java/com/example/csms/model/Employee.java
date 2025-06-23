package com.example.csms.model;

import jakarta.persistence.*;
import java.time.LocalDate; // Using LocalDate for dates
import java.util.List;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Database primary key

    @Column(unique = true) // Assuming this is a business key
    private String employeeEntityId; // From original types, might be the main identifier

    @Column(nullable = false)
    private String name;

    private String profileImageUrl;
    private LocalDate dateOfBirth;
    private String placeOfBirth;
    private String region;
    private String countryOfBirth;

    @Column(unique = true)
    private String zanId; // Assuming this is unique

    private String zssfNumber;
    private String payrollNumber;

    private String cadre;
    private String ministry;
    // private String institution; // Replaced by institutionRef
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institutionRef; // Renamed to avoid clash if 'institution' string field was kept

    private String department;
    private String appointmentType;
    private String contractType;
    private LocalDate recentTitleDate;
    private String currentReportingOffice;
    private String currentWorkplace;
    private LocalDate employmentDate;
    private LocalDate confirmationDate;
    private String status; // e.g., Active, On Leave, Terminated

    private String ardhilHaliUrl;
    private String confirmationLetterUrl;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<EmployeeCertificate> certificates;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeEntityId() {
        return employeeEntityId;
    }

    public void setEmployeeEntityId(String employeeEntityId) {
        this.employeeEntityId = employeeEntityId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getPlaceOfBirth() {
        return placeOfBirth;
    }

    public void setPlaceOfBirth(String placeOfBirth) {
        this.placeOfBirth = placeOfBirth;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCountryOfBirth() {
        return countryOfBirth;
    }

    public void setCountryOfBirth(String countryOfBirth) {
        this.countryOfBirth = countryOfBirth;
    }

    public String getZanId() {
        return zanId;
    }

    public void setZanId(String zanId) {
        this.zanId = zanId;
    }

    public String getZssfNumber() {
        return zssfNumber;
    }

    public void setZssfNumber(String zssfNumber) {
        this.zssfNumber = zssfNumber;
    }

    public String getPayrollNumber() {
        return payrollNumber;
    }

    public void setPayrollNumber(String payrollNumber) {
        this.payrollNumber = payrollNumber;
    }

    public String getCadre() {
        return cadre;
    }

    public void setCadre(String cadre) {
        this.cadre = cadre;
    }

    public String getMinistry() {
        return ministry;
    }

    public void setMinistry(String ministry) {
        this.ministry = ministry;
    }

    public Institution getInstitutionRef() {
        return institutionRef;
    }

    public void setInstitutionRef(Institution institutionRef) {
        this.institutionRef = institutionRef;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }

    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

    public LocalDate getRecentTitleDate() {
        return recentTitleDate;
    }

    public void setRecentTitleDate(LocalDate recentTitleDate) {
        this.recentTitleDate = recentTitleDate;
    }

    public String getCurrentReportingOffice() {
        return currentReportingOffice;
    }

    public void setCurrentReportingOffice(String currentReportingOffice) {
        this.currentReportingOffice = currentReportingOffice;
    }

    public String getCurrentWorkplace() {
        return currentWorkplace;
    }

    public void setCurrentWorkplace(String currentWorkplace) {
        this.currentWorkplace = currentWorkplace;
    }

    public LocalDate getEmploymentDate() {
        return employmentDate;
    }

    public void setEmploymentDate(LocalDate employmentDate) {
        this.employmentDate = employmentDate;
    }

    public LocalDate getConfirmationDate() {
        return confirmationDate;
    }

    public void setConfirmationDate(LocalDate confirmationDate) {
        this.confirmationDate = confirmationDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getArdhilHaliUrl() {
        return ardhilHaliUrl;
    }

    public void setArdhilHaliUrl(String ardhilHaliUrl) {
        this.ardhilHaliUrl = ardhilHaliUrl;
    }

    public String getConfirmationLetterUrl() {
        return confirmationLetterUrl;
    }

    public void setConfirmationLetterUrl(String confirmationLetterUrl) {
        this.confirmationLetterUrl = confirmationLetterUrl;
    }

    public List<EmployeeCertificate> getCertificates() {
        return certificates;
    }

    public void setCertificates(List<EmployeeCertificate> certificates) {
        this.certificates = certificates;
    }
}
