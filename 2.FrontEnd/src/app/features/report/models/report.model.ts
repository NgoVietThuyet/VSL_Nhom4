import { BaseFilter } from "../../../shared/models";

export class ReportDto extends BaseFilter {
    id: string = '';
    definitionId: string = '';
    periodCode: string = '';
    organizeId: string = '';
    statusCode: string = '';
    title: string = '';
    submittedBy: string = '';
    submittedDate?: Date;
    approvedBy: string = '';
    approvedDate?: Date;
    returnedBy: string = '';
    returnedDate?: Date;
    reason: string = '';
    notes: string = '';
    isAggregated: boolean = false;
    definitionName?: string;
    periodName?: string;
    organizeName?: string;
    statusName?: string;
    statusColor?: string;
    assignedTo?: string;
}

export class ReportDataDto {
    id: string = '';
    reportId: string = '';
    cellCode: string = '';
    value: string = '';
    numericValue?: number;
    notes: string = '';
}

export class ReportHistoryDto {
    id: string = '';
    reportId: string = '';
    action: string = '';
    fromStatus: string = '';
    toStatus: string = '';
    actionBy: string = '';
    actionDate?: Date;
    comment: string = '';
}

export class ReportPermissionDto extends BaseFilter {
    id: string = '';
    definitionId: string = '';
    accountGroupId: string = '';
    accountId: string = '';
    canView: boolean = true;
    canEdit: boolean = false;
    canApprove: boolean = false;
    notes: string = '';
}

export interface ReportEntryDto {
    report: ReportDto;
    structure: any[];
    data: ReportDataDto[];
    formulas: any[];
    canView?: boolean;
    canEdit?: boolean;
    canApprove?: boolean;
}
