package com.yussufrajab.csms.enums;

public enum ProbationPeriodStatus {
    LESS_THAN_12_MONTHS("Less than 12 months"),
    MONTHS_12_TO_18("12-18 months"),
    MORE_THAN_18_MONTHS("More than 18 months");

    private final String displayName;

    ProbationPeriodStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
