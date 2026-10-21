import { BaseFilter } from "../../../shared/models";

export class OrganizeDto extends BaseFilter {
    id: string = '';
    name: string = '';
    pId: string = '';
    orderNumber: number = 0;
    expanded: boolean = true;
    isAffiliated: boolean = false;
    isIssuedBy: boolean = false;
    leaderTitleCodes: string = '';
}