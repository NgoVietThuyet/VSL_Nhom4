export class DocumentIncomingActivityModel {
  id: string | null = null;
  documentId: string | null = null;
  personAction: string | null = null;
  prevActId: string | null = null;
  isDone: boolean | null = false;
  refrenceFileId: string | null = null;
  isVanThuCreated: boolean | null = false;
  isThuKiCreated: boolean | null = false;
  isOcrAiCreated: boolean | null = false;
  isLgspCreated: boolean | null = false;
  isYKien: boolean | null = false;
  isXuLyChinh: boolean | null = false;
  isPhoiHop: boolean | null = false;
  isNhanDeBiet: boolean | null = false;
  isChuyenTruoc: boolean | null = false;
  allowEditPhuongAn: boolean | null = false;
  orgCodeAction: string | null = null;
  originDocumentId: string | null = null;
  actType: number | null = null;
  hanXuLy: any | null = null;
  isYKienTuDo :boolean | null = false;
  isDuyetPhuongAn : boolean | null = false;
  isThuHoi : boolean | null = false;
  lstActions : any[] = [];
  createBy : string | null = null;
  isCapTrenChuyenXuLy : boolean | null = false;
  isConfirmed: boolean | null = false;
  isNeedConfirm: boolean | null = false;
  isDaKySo: boolean | null = false;
  lanhDaoChiDao: string | null = null;
  lanhDaoChiDaoCapBacName: string | null = null;
  lanhDaoChiDaoFullName: string | null = null;
  orgActionId: string | null = null;
  constructor(init?: Partial<DocumentIncomingActivityModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.personAction = null;
    this.prevActId = null;
    this.isDone = null;
    this.refrenceFileId = null;
    this.isVanThuCreated = null;
    this.isThuKiCreated = null;
    this.isOcrAiCreated = null;
    this.isLgspCreated = null;
    this.isYKien = null;
    this.isXuLyChinh = null;
    this.isPhoiHop = null;
    this.isNhanDeBiet = null;
    this.isChuyenTruoc = null;
    this.isThuHoi = null;
    this.allowEditPhuongAn = null;
    this.orgCodeAction = null;
    this.actType = null;
    this.hanXuLy = null;
    this.isConfirmed = null;
    this.isNeedConfirm = null;
    this.isDaKySo = null;
    this.orgActionId = null;
    this.lanhDaoChiDaoCapBacName = null;
    this.lanhDaoChiDaoFullName = null;
  }
}
