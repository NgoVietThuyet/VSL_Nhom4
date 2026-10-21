import { BaseFilter } from "../../../shared/models";

export class ReportStatusDto extends BaseFilter {
    code: string = '';
    name: string = '';
    color: string = '';
    nodeType: string = '';
    notes: string = '';
    orderNumber: number = 0;
}
