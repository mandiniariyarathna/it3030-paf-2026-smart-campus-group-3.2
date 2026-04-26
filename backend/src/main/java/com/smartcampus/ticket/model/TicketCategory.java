package com.smartcampus.ticket.model;

public enum TicketCategory {
    MAINTENANCE,
    IT_TECHNICAL,
    FACILITY_RESOURCE_BASED,
    SAFETY_SECURITY,
    GENERAL,

    // Legacy categories kept for backward compatibility with existing records.
    ELECTRICAL,
    PLUMBING,
    IT_EQUIPMENT,
    HVAC,
    STRUCTURAL,
    OTHER
}
