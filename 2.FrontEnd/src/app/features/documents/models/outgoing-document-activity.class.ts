export class OutGoingDocumentActivityModel {
  id: string | null = null;
  documentId: string | null = null;
  personAction: string | null = null;
  prevActId: string | null = null;
  fileEdxmlId: string | null = null;
  isDone: boolean | null = false;
  trangThai: number | null = null;
  isDongYDuThao: boolean | null = false;
  refrenceFileId: string | null = null;
  orgCodeAction: string | null = null;
  isNeedCreateEdxml: boolean | null = false;
  isCreatedEdxml: boolean | null = false;
  isTransfered: boolean | null = false;
  isThuHoi: boolean | null = false;
  isDaChoSo: boolean | null = false;
  isDaXem: boolean | null = false;
  isActive: boolean | null = false;
  isDakyDT: boolean | null = false;
  isDakyTT: boolean | null = false;
  newNoiDungYKien: string | null = null;
  constructor(init?: Partial<OutGoingDocumentActivityModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.personAction = null;
    this.prevActId = null;
    this.isDone = null;
    this.trangThai = null;
    this.isDongYDuThao = null;
    this.refrenceFileId = null;
    this.orgCodeAction = null;
    this.isNeedCreateEdxml = null;
    this.isCreatedEdxml = null;
    this.isTransfered = null;
    this.fileEdxmlId = null;
    this.isDaChoSo = false;
    this.isDaXem = false;
    this.isActive = false;
    this.isDakyDT = false;
    this.isDakyTT = false;
    this.newNoiDungYKien = null;
  }
}
