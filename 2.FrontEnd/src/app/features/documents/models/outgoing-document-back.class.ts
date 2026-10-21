export interface FileFlowBack {
  id: string | null;
  refrenceFileId: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  path: string | null;
  createDate: string;
  createBy: string | null;
  type: number | null;
  phieuId: any | null;
  trangThaiPhieu: string | null;
  loaiPhieuId: string | null;
  notes: string | null;
}

export class DocumentOutgoingBackModel {
  id: string | null = null;
  documentId: string | null = null;
  backDocumentId: string | null = null;
  ngayPhatHanh: Date | null = null;
  trichYeu: string | null = null;
  backRefrenceFileId: string | null = null;
  fileFlowBack: FileFlowBack[] | null = null;
  soKyHieuVb: string | null = null;
  createBy: string | null = null;
  constructor(init?: Partial<DocumentOutgoingBackModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.backDocumentId = null;
    this.ngayPhatHanh = null;
    this.trichYeu = null;
    this.backRefrenceFileId = null;
    this.fileFlowBack = null;
    this.soKyHieuVb = null;
    this.createBy = null;
  }
}
