package com.yussufrajab.csms.enums;

public enum ResignationNoticeType {
    THREE_MONTH_NOTICE("3-Month Notice"),
    TWENTY_FOUR_HOUR_NOTICE_WITH_PAYMENT("24-Hour Notice with Payment");

    private final String displayName;

    ResignationNoticeType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
