export interface FileFlowProfile {
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

export class DocumentOutgoingProfileModel {
  id: string | null = null;
  documentId: string | null = null;
  iwProfileId: string | null = null;
  workName: string | null = null;
  jobDescription: string | null = null;
  referenceFileId: string | null = null;
  fileFlowProfile: FileFlowProfile[] | null = null;
  workType: string | null = null;
  securityLevel: string | null = null;
  createBy: string | null = null;

  constructor(init?: Partial<DocumentOutgoingProfileModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.iwProfileId = null;
    this.workName = null;
    this.jobDescription = null;
    this.referenceFileId = null;
    this.fileFlowProfile = null;
    this.workType = null;
    this.securityLevel = null;
    this.createBy = null;
  }
}
