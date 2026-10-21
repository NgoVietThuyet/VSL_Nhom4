import { BaseFilter } from "../../../shared/models";

export class ReportPeriodDto extends BaseFilter {
    code: string = '';
    name: string = '';
    periodTypeCode: string = '';
    year: number | null = null;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    isOpen: boolean = true;
    notes: string = '';
    orderNumber: number = 0;
}
