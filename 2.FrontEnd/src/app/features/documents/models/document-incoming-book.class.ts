export class DocumentIncomingBookModel {
  id: string | null = null;
  documentId: string | null = null;
  bookId: string | null = null;
  ngayVaoSo: any | null = new Date();
  soPhu: string | null = null;
  soVanBan: string | null = null;
  infoId: string | null = null;
  donViGuiId: string | null = null;
  donViNhanId: string | null = null;

  constructor(init?: Partial<DocumentIncomingBookModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.bookId = null;
    this.ngayVaoSo = new Date();
    this.soPhu = null;
    this.soVanBan = null;
    this.infoId = null;
    this.donViGuiId = null;
    this.donViNhanId = null;
  }
}
