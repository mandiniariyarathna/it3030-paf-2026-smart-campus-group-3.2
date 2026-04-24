package com.smartcampus.resource.model;

import java.time.DayOfWeek;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityWindow {

    private DayOfWeek dayOfWeek;
    private String startTime;
    private String endTime;
}
