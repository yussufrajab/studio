package com.yussufrajab.csms.enums;

public enum TerminationDismissalScenario {
    // For Termination (Confirmed Employees) - FR6.1
    MISCONDUCT_CONFIRMED("Misconduct (Confirmed Employee)"), // Generic, details in docs
    // Could add more specific termination reasons if needed from FR6.1 docs list
    // e.g., ABSCONDMENT, POOR_PERFORMANCE, REDUNDANCY etc.

    // For Dismissal (Unconfirmed Employees / Probation) - FR6.2
    UNCONFIRMED_OUT_OF_PROBATION("Unconfirmed - Out of Probation"), // From SRS Workflow section
    NOT_RETURNING_AFTER_LEAVE("Not Returning After Leave"), // From SRS Workflow section
    DISCIPLINARY_PROBATION("Disciplinary (Probationary Employee)"), // From SRS Workflow section

    // General one from SRS Workflow for Termination module (but actor is DO)
    // This might be a general category that then branches based on docs.
    MISCONDUCT("Misconduct");


    private final String displayName;

    TerminationDismissalScenario(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
