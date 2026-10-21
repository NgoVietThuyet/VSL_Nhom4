import { BaseFilter } from "../../../shared/models";

export class ReportFormulaFunctionDto extends BaseFilter {
    code: string = '';
    name: string = '';
    syntax: string = '';
    description: string = '';
    notes: string = '';
    orderNumber: number = 0;
}
