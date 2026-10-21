import { BaseFilter } from "../../../shared/models";

export class ReportFormulaDto extends BaseFilter {
    id: string = '';
    definitionId: string = '';
    targetCode: string = '';
    expression: string = '';
    notes: string = '';
    orderNumber: number = 0;
}
