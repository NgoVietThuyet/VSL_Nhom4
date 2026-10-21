import { BaseFilter } from "../../../shared/models";

export class ReportUnitDto extends BaseFilter {
    code: string = '';
    name: string = '';
    symbol: string = '';
    decimalPlaces: number | null = null;
    notes: string = '';
}
