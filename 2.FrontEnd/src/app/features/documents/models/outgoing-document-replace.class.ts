export interface FileFlowReplace {
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

export class DocumentOutgoingReplaceModel {
  id: string | null = null;
  documentId: string | null = null;
  replaceDocumentId: string | null = null;
  ngayPhatHanh: Date | null = null;
  trichYeu: string | null = null;
  replaceRefrenceFileId: string | null = null;
  fileFlowReplace: FileFlowReplace[] | null = null;
  soKyHieuVb: string | null = null;
createBy: string | null = null;
  constructor(init?: Partial<DocumentOutgoingReplaceModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.replaceDocumentId = null;
    this.ngayPhatHanh = null;
    this.trichYeu = null;
    this.replaceRefrenceFileId = null;
    this.fileFlowReplace = null;
    this.soKyHieuVb = null;
    this.createBy = null;
  }
}
