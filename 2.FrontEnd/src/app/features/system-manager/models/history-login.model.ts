import { BaseFilter } from "../../../shared/models";

export class HistoryLoginDto extends BaseFilter {
    id: string = '';
    userName: string = '';
    logonTime: any = null;
    browser: string = '';
    version: string = '';
    isMobile: string = '';
    os: string = '';
    mobileModel: string = '';
    manufacturer: string = '';
    iPAddress: string = '';
    status: string = '';
    reason: string = '';
}