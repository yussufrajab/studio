package com.yussufrajab.csms.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MessageResponse {
    private String message;
    private boolean success; // Optional: to indicate outcome
    private Object data; // Optional: to carry some data

    public MessageResponse(String message) {
        this.message = message;
        this.success = true; // Default to true if only message is provided
    }

    public MessageResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }
}
