package com.yussufrajab.csms.enums;

public enum RetirementType {
    COMPULSORY("Compulsory"),
    VOLUNTARY("Voluntary"),
    ILLNESS("Illness");

    private final String displayName;

    RetirementType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
