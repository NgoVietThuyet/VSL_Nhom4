import { BaseFilter } from "../../../shared/models";

export class TitleDto extends BaseFilter {
    code: string = '';
    name: string = '';
    notes : string = '';
    orderNumber : number = 0;
    isLeader: boolean = false;
}