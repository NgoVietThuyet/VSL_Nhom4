export class DocumentIncomingInfoModel {
  id: string | null = null;
  soKyHieuVB: string | null = null;
  trichYeu: string | null = null;
  ngayBanHanh: any | null = new Date();
  phuongThucNhanCode: string | null = null;
  doMatCode: string | null = null;
  doKhanCode: string | null = null;
  nguoiKy: string | null = null;
  chucVuNguoiKy: string | null = null;
  noiDung : string | null = null;

  constructor(init?: Partial<DocumentIncomingInfoModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.soKyHieuVB = null;
    this.trichYeu = null;
    this.ngayBanHanh = new Date();
    this.noiDung = null;
    this.phuongThucNhanCode = null;
    this.doMatCode = null;
    this.doKhanCode = null;
    this.nguoiKy = null;
    this.chucVuNguoiKy = null;
  }
}
