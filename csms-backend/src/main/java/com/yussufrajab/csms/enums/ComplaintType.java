package com.yussufrajab.csms.enums;

public enum ComplaintType {
    UNCONFIRMED_EMPLOYEE("Unconfirmed Employee"), // FR2 from Complaints SRS
    GENERAL_JOB_RELATED("General Job-Related"),   // FR2 from Complaints SRS
    OTHER("Other");                               // FR2 from Complaints SRS

    private final String displayName;

    ComplaintType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
