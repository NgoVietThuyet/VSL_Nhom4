export class OutgoingDocumentInfoModel {
  id: string | null = null;
  soKyHieuVb: string | null = null;
  trichYeu: string | null = null;
  trichYeuKhongDau: string | null = null;
  ngayBanHanh: any | null = null;
  phuongThucNhanCode: string | null = null;
  doMatCode: string | null = null;
  doKhanCode: string | null = null;
  nguoiKy: string | null = null;
  chucVuNguoiKy: string | null = null;
  noiDung: string | null = null;

  constructor(init?: Partial<OutgoingDocumentInfoModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.soKyHieuVb = null;
    this.trichYeu = null;
    this.trichYeuKhongDau = null;
    this.ngayBanHanh = null;
    this.noiDung = null;
    this.phuongThucNhanCode = null;
    this.doMatCode = null;
    this.doKhanCode = null;
    this.nguoiKy = null;
    this.chucVuNguoiKy = null;
  }
}
