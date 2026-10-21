import { BaseFilter } from "../../../shared/models";
import { AccountGroupRightDto } from "./account-group-right.model";


export class AccountGroupDto extends BaseFilter {
    id: string = '';
    orgId: string = '';
    name: string = '';
    notes: string = '';
    accountGroupRights : AccountGroupRightDto[] = []
}