export class OutgoingDocumentFilterModel {
  keyWord: any | null = null;
  fromDate: any | null = null;
  toDate: any | null = null;
  phanLoaiVanBan: any | null = null;
  loaiXuLyVanBan: any | null = null;
  trangThaiVanBan: any | null = null;
  trangThaiActivity: any | null = null;
  childTab: any | null = null;
  donViGuiId: any | null = null;
  bookId: any | null = null;
  ngayVaoSoFrom: any | null = null;
  ngayVaoSoTo: any | null = null;
  hanTraLoiFrom: any | null = null;
  hanTraLoiTo: any | null = null;
  phuongThucNhanCode: any | null = null;
  doMatCode: any | null = null;
  doKhanCode: any | null = null;
  loaiVanBanCode: any | null = null;
  linhVucId: any | null = null;
  ngayVanBanDenFrom: any | null = null;
  ngayVanBanDenTo: any | null = null;
  isDeXuatBanHanh: boolean = false;
  isHanTraLoi: boolean = false;
  isChoSo: boolean = false;
  type: any | null = null;
  personAction: any | null = null;
  listKhoiDonViId: any = null;
  donViNoiBoId: any = null;
  donViNhanId: any = null;
  constructor(init?: Partial<OutgoingDocumentFilterModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.fromDate = null;
    this.toDate = null;
    this.phanLoaiVanBan = null;
    this.loaiXuLyVanBan = null;
    this.trangThaiVanBan = null;
    this.trangThaiActivity = null;
    this.childTab = null;
    this.donViGuiId = null;
    this.bookId = null;
    this.ngayVaoSoFrom = null;
    this.ngayVaoSoTo = null;
    this.hanTraLoiFrom = null;
    this.hanTraLoiTo = null;
    this.keyWord = null;
    this.hanTraLoiFrom = null;
    this.hanTraLoiTo = null;
    this.phuongThucNhanCode = null;
    this.doMatCode = null;
    this.doKhanCode = null;
    this.loaiVanBanCode = null;
    this.linhVucId = null;
    this.ngayVanBanDenFrom = null;
    this.ngayVanBanDenTo = null;
    this.isDeXuatBanHanh = false;
    this.isHanTraLoi = false;
    this.isChoSo = false;
    this.personAction = null;
    this.type = null;
    this.listKhoiDonViId = null;
    this.donViNoiBoId = null;
    this.donViNhanId = null;
  }

countValue(): number {
  const excludeFields: (keyof OutgoingDocumentFilterModel)[] = [
    'phanLoaiVanBan',
    'loaiXuLyVanBan',
    // thêm nếu cần loại trừ trường nào
  ];
  let count = 0;

  const keys = Object.keys(this) as (keyof OutgoingDocumentFilterModel)[];

  for (const key of keys) {
    if (excludeFields.includes(key)) continue;
    const value = this[key];
    if (typeof value === 'string' && value.trim() === '') continue;

    if (typeof value === 'boolean' && value === false) continue;

    if (value !== null && value !== undefined) {
      count++;
    }
  }

  return count;
}

}
