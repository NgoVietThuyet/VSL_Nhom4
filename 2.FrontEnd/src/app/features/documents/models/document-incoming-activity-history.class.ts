export class DocumentIncomingActivityHistoryModel {
  id: string | null = null;
  documentId: string | null = null;
  actId: string | null = null;
  personAction: string | null = null;
  notes: string | null = null;
  actionType: string | null = null;
    refrenceFileId: string | null = null;

  constructor(init?: Partial<DocumentIncomingActivityHistoryModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.actId = null;
    this.personAction = null;
    this.notes = null;
    this.actionType = null;
    this.refrenceFileId = null;
  }
}
