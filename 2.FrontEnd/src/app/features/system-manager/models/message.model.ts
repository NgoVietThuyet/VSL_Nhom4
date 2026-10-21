import { BaseFilter } from "../../../shared/models";

export class MessageDto extends BaseFilter {
    code: string = '';
    lang: string = '';
    message: string = '';
    type: string = '';
}