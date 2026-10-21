import { BaseFilter } from "../../../shared/models";

export class ReportTemplateDto extends BaseFilter {
    id: string = '';
    definitionId: string = '';
    name: string = '';
    fileName: string = '';
    contentType: string = '';
    fileSize: number = 0;
    notes: string = '';
}
