import { BaseFilter } from "../../../shared/models";

export class ReportCategoryDto extends BaseFilter {
    code: string = '';
    name: string = '';
    pCode: string = '';
    notes: string = '';
    orderNumber: number = 0;
    expanded: boolean = true;
}
