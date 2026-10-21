import { BaseFilter } from '../../../shared/models';

export class HrmEmployeeDto extends BaseFilter {
    id: string = '';
    employeeCode: string = '';
    userName: string = '';
    fullName: string = '';
    gender: string = '';
    birthDate?: any = null;
    birthPlace: string = '';
    nationality: string = 'Việt Nam';
    idNumber: string = '';
    idIssueDate?: any = null;
    idIssuePlace: string = '';
    taxCode: string = '';
    email: string = '';
    phone: string = '';
    address: string = '';
    organizeId: string = '';
    organizeName?: string = '';
    titleId: string = '';
    titleName?: string = '';
    lineManagerId: string = '';
    lineManagerName?: string = '';
    joinDate?: any = null;
    leaveDate?: any = null;
    status: string = 'ACTIVE';
    avatarPath: string = '';
    bankAccount: string = '';
    bankName: string = '';
    note: string = '';
    statusFilter?: string = '';
    organizeIdFilter?: string = '';
    titleIdFilter?: string = '';
    shiftId: string = '';
    shiftName?: string = '';
}

export class HrmEmployeeContactDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    contactName: string = '';
    relationship: string = '';
    phone: string = '';
    email: string = '';
    address: string = '';
    isEmergency: boolean = false;
}

export class HrmEmployeeDocumentDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    documentType: string = '';
    documentName: string = '';
    documentNumber: string = '';
    issueDate?: any = null;
    expiryDate?: any = null;
    filePath: string = '';
    explorerId: string = '';
    note: string = '';
}

export class HrmContractDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    employeeCode?: string = '';
    contractCode: string = '';
    contractType: string = 'FIXED_TERM';
    fromDate?: any = null;
    toDate?: any = null;
    basicSalary: number | null = null;
    allowanceTotal: number | null = null;
    currency: string = 'VND';
    position: string = '';
    workPlace: string = '';
    status: string = 'DRAFT';
    filePath: string = '';
    wfInstanceId: string = '';
    salaryStructureId?: string = '';
    salaryStructureName?: string = '';
    note: string = '';
    formula?: string = '';
    statusFilter?: string = '';
    typeFilter?: string = '';
    salaryItems?: any[] = [];
    salarySnapshots?: HrmContractSalarySnapshotDto[] = [];
}

export class HrmContractSalarySnapshotDto {
    id: string = '';
    contractId: string = '';
    fromDate?: any = null;
    toDate?: any = null;
    salaryStructureId: string = '';
    salaryStructureName?: string = '';
    formula: string = '';
    basicSalary: number | null = null;
    allowanceTotal: number | null = null;
    itemsJson: string = '';
    salaryItems?: any[] = []; // Used in UI for editing
}

export class HrmContractHistoryDto {
    id: string = '';
    contractId: string = '';
    changeType: string = '';
    fromValue: string = '';
    toValue: string = '';
    changeDate?: any = null;
    changedBy: string = '';
    note: string = '';
}

export class HrmShiftDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    startTime: string = '';
    endTime: string = '';
    breakMinutes: number = 0;
    workHours: number = 8;
    color: string = '#1890ff';
    note: string = '';
}

export class HrmShiftAssignmentDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    shiftId: string = '';
    shiftName?: string = '';
    weekDay: number = 1;
    fromDate?: any = null;
    toDate?: any = null;
}

export class HrmAttendanceDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    employeeCode?: string = '';
    workDate?: any = null;
    shiftId: string = '';
    shiftName?: string = '';
    checkIn?: any = null;
    checkOut?: any = null;
    source: string = 'WEB';
    workHours: number = 0;
    overtimeHours: number = 0;
    lateMinutes: number = 0;
    earlyMinutes: number = 0;
    status: string = 'PRESENT';
    leaveRequestId: string = '';
    note: string = '';
    yearFilter?: number | null = null;
    monthFilter?: number | null = null;
    dateFilter?: any = null;
    organizeIdFilter?: string = '';
    statusFilter?: string = '';
}

export class HrmAttendanceSummaryDto {
    employeeId: string = '';
    employeeName: string = '';
    year: number = 0;
    month: number = 0;
    totalWorkDays: number = 0;
    totalPresent: number = 0;
    totalAbsent: number = 0;
    totalLeave: number = 0;
    totalLateMinutes: number = 0;
    totalOvertimeHours: number = 0;
    details: HrmAttendanceDto[] = [];
}

export class HrmLeaveTypeDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    maxDaysPerYear: number = 0;
    isPaid: boolean = true;
    color: string = '#1890ff';
    description: string = '';
}

export class HrmLeaveBalanceDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    year: number = 0;
    leaveTypeId: string = '';
    leaveTypeName?: string = '';
    totalEntitlement: number = 0;
    used: number = 0;
    balance: number = 0;
}

export class HrmLeaveRequestDto extends BaseFilter {
    id: string = '';
    code: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    leaveTypeCode: string = '';
    leaveTypeName?: string = '';
    fromDate?: any = null;
    toDate?: any = null;
    totalDays: number = 0;
    reason: string = '';
    handoverTo: string = '';
    status: string = 'DRAFT';
    wfInstanceId: string = '';
    statusFilter?: string = '';
}

export class HrmSalaryStructureDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    description: string = '';
    formula: string = '';
    items: HrmSalaryItemDto[] = [];
}

export class HrmSalaryItemDto {
    id: string = '';
    structureId: string = '';
    itemCode: string = '';
    itemName: string = '';
    type: string = 'EARNING_DAILY'; // EARNING_DAILY / EARNING_FIXED / DEDUCTION_FIXED / DEDUCTION_PERCENT
    amount: number = 0;
    isTaxable: boolean = true;
    formula: string = '';
}

export class HrmPayrollPeriodDto extends BaseFilter {
    id: string = '';
    code: string = '';
    year: number = 0;
    month: number = 0;
    fromDate?: any = null;
    toDate?: any = null;
    status: string = 'OPEN';
    totalEmployees: number = 0;
    totalGross: number = 0;
    totalNet: number = 0;
    note: string = '';
}

export class HrmPayslipDto extends BaseFilter {
    id: string = '';
    periodId: string = '';
    periodCode?: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    employeeCode?: string = '';
    workDays: number = 0;
    gross: number = 0;
    totalAllowance: number = 0;
    totalDeduction: number = 0;
    tax: number = 0;
    insurance: number = 0;
    net: number = 0;
    status: string = 'DRAFT';
    paidDate?: any = null;
    note: string = '';
    items: HrmPayslipItemDto[] = [];
}

export class HrmPayslipItemDto {
    id: string = '';
    payslipId: string = '';
    itemCode: string = '';
    itemName: string = '';
    type: string = 'EARNING';
    itemType: string = 'EARNING';
    amount: number = 0;
    note: string = '';
}

export class HrmPayrollCalculationResultDto {
    created: number = 0;
    updated: number = 0;
    skipped: number = 0;
    warnings: string[] = [];
}

export class HrmInsuranceDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    socialInsuranceNo: string = '';
    healthInsuranceNo: string = '';
    hospitalName: string = '';
    registeredDate?: any = null;
    baseSalary: number = 0;
    employeeRate: number = 0;
    companyRate: number = 0;
    status: string = 'ACTIVE';
    note: string = '';
}

export class HrmTaxDto extends BaseFilter {
    id: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    taxCode: string = '';
    dependents: number = 0;
    personalDeduction: number = 11000000;
    dependentDeduction: number = 4400000;
    effectiveFrom?: any = null;
    note: string = '';
}

export class HrmTrainingCourseDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    description: string = '';
    trainer: string = '';
    location: string = '';
    fromDate?: any = null;
    toDate?: any = null;
    maxParticipants: number = 0;
    cost: number = 0;
    currency: string = 'VND';
    status: string = 'PLANNED';
    note: string = '';
}

export class HrmTrainingEnrollmentDto extends BaseFilter {
    id: string = '';
    courseId: string = '';
    courseName?: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    enrollDate?: any = null;
    completedDate?: any = null;
    score: number | null = null;
    result: string = '';
    certificate: string = '';
    status: string = 'ENROLLED';
    note: string = '';
}

export class HrmEvaluationDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    periodFrom?: any = null;
    periodTo?: any = null;
    status: string = 'DRAFT';
    note: string = '';
    details: HrmEvaluationDetailDto[] = [];
}

export class HrmEvaluationDetailDto {
    id: string = '';
    evaluationId: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    employeeCode?: string = '';
    evaluatorId: string = '';
    evaluatorName?: string = '';
    criteria: string = '';
    score: number | null = null;
    comment: string = '';
}

export class HrmRewardDto extends BaseFilter {
    id: string = '';
    code: string = '';
    employeeId: string = '';
    employeeName?: string = '';
    type: string = 'REWARD';
    title: string = '';
    description: string = '';
    amount: number | null = null;
    currency: string = 'VND';
    effectiveDate?: any = null;
    decisionNo: string = '';
    status: string = 'DRAFT';
    note: string = '';
    typeFilter?: string = '';
}

export class HrmRecruitmentPositionDto extends BaseFilter {
    id: string = '';
    code: string = '';
    title: string = '';
    organizeId: string = '';
    organizeName?: string = '';
    quantity: number = 1;
    jobDescription: string = '';
    requirements: string = '';
    salaryFrom: number | null = null;
    salaryTo: number | null = null;
    currency: string = 'VND';
    deadline?: any = null;
    status: string = 'OPEN';
    candidateCount: number = 0;
    hiredCount: number = 0;
    note: string = '';
    statusFilter?: string = '';
}

export class HrmCandidateDto extends BaseFilter {
    id: string = '';
    positionId: string = '';
    positionTitle?: string = '';
    fullName: string = '';
    email: string = '';
    phone: string = '';
    resumePath: string = '';
    source: string = '';
    experience: string = '';
    expectedSalary: number | null = null;
    stage: string = '';
    rating: number | null = null;
    note: string = '';
    stageFilter?: string = '';
}

export class HrmInterviewDto extends BaseFilter {
    id: string = '';
    candidateId: string = '';
    candidateName?: string = '';
    positionTitle?: string = '';
    interviewDate?: any = null;
    interviewTime: string = '';
    location: string = '';
    interviewers: string = '';
    result: string = '';
    score: number | null = null;
    feedback: string = '';
    status: string = 'SCHEDULED';
    calendarEventId: string = '';
}

export class HrmDashboardSummaryDto {
    totalEmployees: number = 0;
    activeEmployees: number = 0;
    onLeaveToday: number = 0;
    newHiresMonth: number = 0;
    resignedMonth: number = 0;
    contractExpiring: number = 0;
    birthdaysThisWeek: any[] = [];
    byOrganize: any[] = [];
    byStatus: any[] = [];
    turnoverRate: number = 0;
}
