export function emptyTaskColFilter() {
  return {
    keyword: '',
    topicGroupId: '',
    documentNumber: '',
    issuerOrganizationId: '',
    leadOrganizationId: '',
    coordinateOrganizationId: '',
    fieldId: '',
    dueDate: null as Date | null,
    priorityLevelId: '',
    /** TaskStatus filter (0..9). */
    filterTaskStatus: null as number | null,
    /** AssignmentStatus filter (0..3). */
    filterAssignmentStatus: null as number | null,
  };
}

export function emptyDocumentColFilter() {
  return {
    documentNumber: '',
    subject: '',
    documentTypeId: '',
    fieldId: '',
    urgencyLevelId: '',
    confidentialityLevelId: '',
    /** ProcessingStatus filter (0..2). */
    filterProcessingStatus: null as number | null,
    fromDate: null as Date | null,
    toDate: null as Date | null,
  };
}
