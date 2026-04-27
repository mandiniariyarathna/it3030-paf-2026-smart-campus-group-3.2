export const CATEGORY_LABEL_MAP = {
  MAINTENANCE: 'Maintenance',
  IT_TECHNICAL: 'IT & Technical',
  FACILITY_RESOURCE_BASED: 'Facility / Resource-Based',
  SAFETY_SECURITY: 'Safety & Security',
  GENERAL: 'General',
  // Legacy categories for backward compatibility
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  IT_EQUIPMENT: 'IT Equipment',
  HVAC: 'HVAC',
  STRUCTURAL: 'Structural',
  OTHER: 'Other',
};

export function getCategoryLabel(category) {
  return CATEGORY_LABEL_MAP[category] || category;
}
