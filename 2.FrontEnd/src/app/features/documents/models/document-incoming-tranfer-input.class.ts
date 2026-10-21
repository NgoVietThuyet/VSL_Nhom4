import { DocumentIncomingActivityPlanModel } from "./document-incoming-activity-plan.class";
import { DocumentIncomingActivityYKienModel } from "./document-incoming-activity-ykien.class";
import { DocumentIncomingActivityModel } from "./document-incoming-activity.class";
import { DocumentIncomingFilterModel } from "./document-incoming-filter.class";
import { DocumentIncomingInfoModel } from "./document-incoming-info.class";
import { DocumentIncomingPhieuModel } from "./document-incoming-phieu.class";
import { DocumentIncomingModel, UserXuLy } from "./document-incoming.class";

export class DocumentIncomingTranferInputModel {
    document: DocumentIncomingModel = new DocumentIncomingModel();
    info: DocumentIncomingInfoModel = new DocumentIncomingInfoModel()
    activity: DocumentIncomingActivityModel = new DocumentIncomingActivityModel();
    prevActivity: DocumentIncomingActivityModel = new DocumentIncomingActivityModel();
    plans: any[] = [];
    planFinals: any[] = [];
    filter: DocumentIncomingFilterModel = new DocumentIncomingFilterModel();
    yKien: DocumentIncomingActivityYKienModel = new DocumentIncomingActivityYKienModel();
    lstIdChecked: any[] = [];
    accountLoginInfo: any;
    danhSachYKien: any[] = [];
    danhSachPhieuYKien: any[] = [];
    files: any[] = [];
    filesMaHoaGoc: any[] = [];
    yKienFiles: any[] = [];
    nguoiNhanYKienXuLy: string = '';
    orgId: string = '';
    idSelectedSoVanBan : any;   
    listPhieu : DocumentIncomingPhieuModel[] = []
    listActions : any[] = []
    isTraLaiVanThu : boolean = false;
    isNeedConfirm : boolean = false;
    hanXuLy: any = null;
    trangThaiUyQuyen : any = null;
    isMultiProcess : boolean = false;
    indexTab : number = 10;
    skipPhieuUpdate : boolean = false;
    isFullTreeEmpty : boolean = false;
    isChuyenTruocVanBan : boolean = false;
    listUserXuLy: UserXuLy[] = [];
    isEncryptServer : boolean = true;
    templateId : string = '';
    loaiPhieuId : number | null = null;
    isYKienKhac : boolean = false;
    constructor(init?: Partial<DocumentIncomingTranferInputModel>) {
        Object.assign(this, init);
    }
}

export class DocumentTranferInputModel {
    bookId: string = '';
    ngayVanBanFrom: any | null = null;
    ngayVanBanTo: any | null = null;
    idDonVi: string = '';
    isNgoaiNganh: string = '';

    constructor(init?: Partial<DocumentTranferInputModel>) {
        Object.assign(this, init);
    }
}
