export class DocumentIncomingActivityPlanModel {
  id: string | null = null;
  name : string | null = null;
  documentId: string | null = null;
  actId: string | null = null;
  personAction: string | null = null;
  orgActionId: string | null = null;
  refrenceFileId: string | null = null;
  isYKien: boolean | null = false;
  isXuLyChinh: boolean | null = false;
  isPhoiHop: boolean | null = false;
  isNhanDeBiet: boolean | null = false;
  isChuyenTruoc: boolean | null = false;
  isChuTri: boolean | null = false;
  notes: string | null = null;
  type : string| null = null;
  constructor(init?: Partial<DocumentIncomingActivityPlanModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.actId = null;
    this.personAction = null;
    this.orgActionId = null;
    this.refrenceFileId = null;
    this.isYKien = false;
    this.isXuLyChinh = false;
    this.isPhoiHop = false;
    this.isNhanDeBiet = false;
    this.isChuyenTruoc = false;
    this.isChuTri = false;
    this.notes = null;
    this.type = null;
    this.name = null;
  }
}
