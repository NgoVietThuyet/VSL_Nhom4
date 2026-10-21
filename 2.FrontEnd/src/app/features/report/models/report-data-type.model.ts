import { BaseFilter } from "../../../shared/models";

export class ReportDataTypeDto extends BaseFilter {
    code: string = '';
    name: string = '';
    clrType: string = '';
    format: string = '';
    notes: string = '';
    orderNumber: number = 0;
}
