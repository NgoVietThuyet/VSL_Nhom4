import { BaseFilter } from "../../../shared/models";

export class ContactDto extends BaseFilter {
    id: string = '';
    ownerUserName: string = '';
    contactUserName: string = '';
    contactUserFullName: string = '';
    displayName: string = '';
    phone: string = '';
    email: string = '';
    address: string = '';
    notes: string = '';
    isFavorite: boolean = false;
}
