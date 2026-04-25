package com.smartcampus.technician.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianLoginResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String role;
}
