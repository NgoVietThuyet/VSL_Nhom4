import { BaseFilter } from "../../../shared/models";

export class RightDto extends BaseFilter {
    id: string = '';
    name: string = '';
    pId: string = '';
    orderNumber: number = 0;
    expanded : boolean = true;
}