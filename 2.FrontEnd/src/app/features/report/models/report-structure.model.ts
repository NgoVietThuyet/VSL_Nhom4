import { BaseFilter } from "../../../shared/models";

export class ReportStructureDto extends BaseFilter {
    id: string = '';
    definitionId: string = '';
    pId: string = '';
    code: string = '';
    name: string = '';
    nodeType: string = ''; // RowGroup | Row | ColumnGroup | Column | Cell
    orderNumber: number = 0;
    dataTypeCode: string = '';
    isInput: boolean = false;
    isFormula: boolean = false;
    formula: string = '';
    format: string = '';
    validationRule: string = '';
    rowSpan: number = 1;
    colSpan: number = 1;
    style: string = '';
    expanded: boolean = true;
    decimalRound: number | null = null;
}
