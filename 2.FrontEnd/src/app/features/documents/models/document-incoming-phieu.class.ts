export class DocumentIncomingPhieuModel {
    id: string | null = null;
    tieuDe: string | null = null;
    templatePhieuId: string | null = null;
    trangThai: number | null = null;
    trangThaiXuLy: number | null = null;
    fileId: string | null = null;
    fileKySoId: string | null = null;
    documentId: string | null = null;
    loaiPhieuId: any = null;
    notes: string | null = null;
    isChoSo: boolean | null = null;
    isBanHanh: boolean | null = null;
    documentOutgoingId: string | null = null;
    yKien : any[] = [];
    comment: any[] = [];
    file : any;
    fileKySo : any;
    accountLoginInfo : any;
    createBy : any;
    listUserXuLy : any[] = []
    originalFileId : any;
    
    // Thuộc tính cho template tạm thời
    isTemp?: boolean = false;
    files?: any[] = [];
    name?: string = undefined;
    
    // Thuộc tính để đánh dấu trạng thái chỉnh sửa
    isEdited?: boolean = false;
    hasChanges?: boolean = false;
   
    constructor(init?: Partial<DocumentIncomingPhieuModel>) {
        Object.assign(this, init);
    }
}
