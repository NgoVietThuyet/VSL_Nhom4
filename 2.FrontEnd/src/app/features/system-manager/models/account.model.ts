import { BaseFilter } from "../../../shared/models";
import { AccountGroupDto } from "./account-group.model";

export class AccountDto extends BaseFilter {
    userName: string = '';
    fullName: string = '';
    phone: string = '';
    email: string = '';
    address: string = '';
    orgId: string = '';
    titleCode: string = '';
    avatarFileId: string = '';
    accountGroups: AccountGroupDto[] = [];
    rights: string[] = [];
}