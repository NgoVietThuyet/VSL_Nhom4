export class DocumentIncomingFilterModel {
  keyWord: any | null = null;
  fromDate: any | null = null;
  toDate: any | null = null;
  phanLoaiVanBan: any | null = null;
  loaiXuLyVanBan: any | null = null;
  trangThaiVanBan: any | null = null;
  searchTabPhieuVanBanDen: any | null = null;
  filterTagVanBanDen: any | null = null;
  donViGuiId: any | null = null;
  donViNhanId: any | null = null;
  bookId: any | null = null;
  doMatCode: any | null = null;
  phuongThucNhanCode: any | null = null;
  loaiVanBanCode: any | null = null;
  linhVucCode: any | null = null;
  nguoiKy: any | null = null;
  nguoiTao: any | null = null;
  ngayVaoSoFrom: any | null = null;
  ngayVaoSoTo: any | null = null;
  hanTraLoiFrom: any | null = null;
  hanTraLoiTo: any | null = null;
  hanXuLyFrom: any | null = null;
  hanXuLyTo: any | null = null;
  ngayVanBanDenFrom: any | null = null;
  ngayVanBanDenTo: any | null = null;
  deXuatLanhDaoXuLy: any | null = null;
  vaiTroXuLy: any | null = null;

  isQuaHan: any = null;
  isHoanThanh: any = null;
  isHoanThanhChuaXuLy: any = null;
  isHoanThanhDaXuLy: any = null;
  type: any = null;
  objectAction: any = null;
  orgId: any = null;
  listKhoiDonViId: any = null;
  isNgoaiNganh: any = null;
  soLoai_phanLoaiVanBan: any = null;
  isOcrAiCreated: any = null;
  isLgspCreated: any = null;
  isCapTrenDaXuLy: any | null = null;
  trangThaiPhieuVB: any | null = null;
  doMatLoaiVanBan: any | null = null;
  filterTrangThaiVanBan: any | null = null;
  filterLoaiPhieu: any | null = null;
  personAction: any | null = null;
  constructor(init?: Partial<DocumentIncomingFilterModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.keyWord = null;
    this.fromDate = null;
    this.toDate = null;
    this.donViGuiId = null;
    this.bookId = null;
    this.doMatCode = null;
    this.phuongThucNhanCode = null;
    this.linhVucCode = null;
    this.nguoiKy = null;
    this.nguoiTao = null;

    this.ngayVaoSoFrom = null;
    this.ngayVaoSoTo = null;

    this.hanTraLoiFrom = null;
    this.hanTraLoiTo = null;

    this.hanXuLyFrom = null;
    this.hanXuLyTo = null;

    this.ngayVanBanDenFrom = null;
    this.ngayVanBanDenTo = null;
    this.filterTagVanBanDen = null;
    this.listKhoiDonViId = null;
    this.isNgoaiNganh = null;
    this.loaiVanBanCode = null;
    this.isOcrAiCreated = null;
    this.isLgspCreated = null
    this.isCapTrenDaXuLy = null;
    this.deXuatLanhDaoXuLy = null;
    this.trangThaiPhieuVB = null;
    this.doMatLoaiVanBan = null;
    this.filterTrangThaiVanBan = null;
    this.personAction = null;
  }

  resetForSoLoai(): void {
    this.keyWord = null;
    this.fromDate = null;
    this.toDate = null;
    this.donViGuiId = null;
    this.bookId = null;
    this.doMatCode = null;
    this.phuongThucNhanCode = null;
    this.linhVucCode = null;
    this.nguoiKy = null;
    this.nguoiTao = null;

    this.ngayVaoSoFrom = null;
    this.ngayVaoSoTo = null;

    this.hanTraLoiFrom = null;
    this.hanTraLoiTo = null;

    this.hanXuLyFrom = null;
    this.hanXuLyTo = null;

    this.ngayVanBanDenFrom = null;
    this.ngayVanBanDenTo = null;
    this.filterTagVanBanDen = null;
    this.listKhoiDonViId = null;
    this.isNgoaiNganh = null;
    this.loaiVanBanCode = null;
    this.isOcrAiCreated = null;
    this.isLgspCreated = null
    this.isCapTrenDaXuLy = null;
    this.deXuatLanhDaoXuLy = null;
    this.trangThaiPhieuVB = null;
    this.doMatLoaiVanBan = null;
    this.trangThaiVanBan = null;
    this.filterTrangThaiVanBan = null;
    this.vaiTroXuLy = null;
    this.donViNhanId = null;
  }

  countValue(): number {
    const excludeFields: (keyof DocumentIncomingFilterModel)[] = [
      'phanLoaiVanBan',
      'trangThaiVanBan',
      'loaiXuLyVanBan',
      'searchTabPhieuVanBanDen',
      'filterLoaiPhieu',
      // thêm nếu cần loại trừ trường nào
    ];
    let count = 0;

    const keys = Object.keys(this) as (keyof DocumentIncomingFilterModel)[];

    for (const key of keys) {
      if (excludeFields.includes(key)) continue;

      const value = this[key];

      if (typeof value === 'string' && value.trim() === '') continue;

      if (
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        count++;
      }
    }

    return count;
  }

  countValueForSoLoai(): number {
    const excludeFields: (keyof DocumentIncomingFilterModel)[] = [
      'phanLoaiVanBan',
      'loaiXuLyVanBan',
      'searchTabPhieuVanBanDen',
      'filterLoaiPhieu',
      // thêm nếu cần loại trừ trường nào
    ];
    let count = 0;

    const keys = Object.keys(this) as (keyof DocumentIncomingFilterModel)[];

    for (const key of keys) {
      if (excludeFields.includes(key)) continue;

      const value = this[key];

      if (typeof value === 'string' && value.trim() === '') continue;

      if (
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        count++;
      }
    }

    return count;
  }
}
