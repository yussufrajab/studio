package com.example.csms.model;

public enum RequestType {
    EMPLOYEE_CONFIRMATION("Employee Confirmation"),
    LWOP("Leave Without Pay (LWOP)"),
    PROMOTION("Promotion"),
    COMPLAINTS("Complaints"),
    CHANGE_OF_CADRE("Change of Cadre"),
    RETIREMENT("Retirement"),
    RESIGNATION("Resignation (Employee)"),
    SERVICE_EXTENSION("Service Extension"),
    TERMINATION("Termination"),
    DISMISSAL("Dismissal");

    private final String displayName;

    RequestType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
