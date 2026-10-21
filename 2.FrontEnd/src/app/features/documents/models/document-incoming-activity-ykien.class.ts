export class DocumentIncomingActivityYKienModel {
  id: string | null = null;
  documentId: string | null = null;
  actId: string | null = null;
  personYKien: string | null = null;
  yKien: string | null = null;
  replyYKienId: string | null = null;
  refrenceFileId: string | null = null;

  constructor(init?: Partial<DocumentIncomingActivityYKienModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.actId = null;
    this.personYKien = null;
    this.yKien = null;
    this.replyYKienId = null;
    this.refrenceFileId = null;
    
  }
}
