import { BaseFilter } from "../../../shared/models";
import { MenuRightDto } from "./menu-right.model";

export class MenuDto extends BaseFilter {
    id: string = '';
    name: string = '';
    pId: string = '';
    orderNumber: number = 0;
    url: string = '';
    icon: string = '';
    expanded: boolean = true;
    menuRights: MenuRightDto[] = []
}