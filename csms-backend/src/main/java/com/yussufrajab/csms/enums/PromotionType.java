package com.yussufrajab.csms.enums;

public enum PromotionType {
    EDUCATIONAL("Educational"),
    PERFORMANCE("Performance");

    private final String displayName;

    PromotionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
