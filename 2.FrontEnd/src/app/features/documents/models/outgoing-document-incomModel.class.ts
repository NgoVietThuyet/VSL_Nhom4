export interface FileFlowIncom {
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

export class DocumentOutgoingIncomModel {
  id: string | null = null;
  documentId: string | null = null;
  incomingDocumentId: string | null = null;
  incomingDocumentNumber: string | null = null;
  refrenceFileId: string | null = null;
  fileFlowIncom: FileFlowIncom[] | null = null;
  trichYeu: string | null = null;
  ngayVanBan: Date | null = null;
  createBy: string | null = null;

  constructor(init?: Partial<DocumentOutgoingIncomModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.incomingDocumentId = null;
    this.incomingDocumentNumber = null;
    this.refrenceFileId = null;
    this.fileFlowIncom = null;
    this.createBy = null;
  }
}
