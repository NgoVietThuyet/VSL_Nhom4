import { DO_KHAN, DO_MAT, LINH_VUC, LOAI_VAN_BAN_CONG_VAN, PHUONG_THUC_NHAN } from "../../../shared/constants/global.constants";

export interface UserXuLy {
  personAction: string;
  isDone: boolean;
  isActive: boolean;
  actType: number;
  createDate?: any;
  updateDate?: any;
}

export class DocumentIncomingModel {
  id: string | null = null;
  infoId: string | null = null;
  originDocumentId: string | null = null;
  donViGuiId: string | null = null;
  donViGuiName: string | null = null;
  donViGuiShortName: string | null = null;
  donViNhanId: string | null = null;
  ngayVbDen: any | null;
  ngayVaoSo: any | null;
  hanTraLoi: any | null = null;
  soPhu: string | null = null;
  bookId: string | null = null;
  soVanBan: string | null = null;
  loaiVanBanName : string | null = null;
  phuongThucNhanCode: number | null = PHUONG_THUC_NHAN.GIAY;
  doMatCode: number | null = DO_MAT.THUONG;
  doKhanCode: number | null = DO_KHAN.THUONG;
  loaiVanBanCode: number | null = LOAI_VAN_BAN_CONG_VAN;
  linhVucCode: number | null = LINH_VUC.HANH_CHINH;
  phanLoaiId: number | null = null;
  isVanThuCreated: boolean | null = false;
  isThuKiCreated: boolean | null = false;
  isOcrAiCreated: boolean | null = false;
  isLgspCreated: boolean | null = false;
  refrenceFileId: string | null = null;
  trangThai: string | null = null;
  soHieuLuuKho: string | null = null;
  viTriLuuTru: string | null = null;
  bookName: string | null = null;
  deXuatLanhDaoXuLy : string | null = null;
  outgoingDocumentId : string | null = null;
  phanLoaiText : string | null = null;
  isNeedConfirm: boolean = false;
  lanhDaoXuLyVbBo : any = '';
  countPhieuChoBanHanh: number | null = null;
  soDenBoTruong : any = '';
  butPheBoTruong : any = '';
  butPheThuTruong : any = '';
  ghiChu : any = '';

  constructor(init?: Partial<DocumentIncomingModel>) {
    Object.assign(this, init);
  }

  reset(): void {
    this.id = null;
    this.infoId = null;
    this.originDocumentId = null;
    this.donViGuiId = null;
    this.donViNhanId = null;
    this.ngayVbDen = new Date();
    this.ngayVaoSo = new Date();
    this.hanTraLoi = null;
    this.soPhu = null;
    this.bookId = null;
    this.soVanBan = null;
    this.loaiVanBanName = null
    this.phuongThucNhanCode = PHUONG_THUC_NHAN.GIAY;
    this.doMatCode = DO_MAT.THUONG;
    this.doKhanCode = DO_KHAN.THUONG;
    this.loaiVanBanCode = LOAI_VAN_BAN_CONG_VAN;
    this.linhVucCode = LINH_VUC.HANH_CHINH;
    this.phanLoaiId = null;
    this.isVanThuCreated = null;
    this.isThuKiCreated = null;
    this.isOcrAiCreated = null;
    this.isLgspCreated = null;
    this.refrenceFileId = null;
    this.trangThai = null;
    this.soHieuLuuKho = null;
    this.viTriLuuTru = null;
    this.countPhieuChoBanHanh = null;
    this.soDenBoTruong = null;
    this.butPheBoTruong = null;
    this.butPheThuTruong = null;
    this.ghiChu = null;
  }
}
