import { BaseFilter } from "../../../shared/models";

export class ReportDefinitionDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    categoryCode: string = '';
    periodTypeCode: string = '';
    unit: string = '';
    version: string = '';
    statusCode: string = '';
    description: string = '';
    notes: string = '';
    orderNumber: number = 0;
}
