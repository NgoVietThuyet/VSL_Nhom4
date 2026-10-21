export interface FileFlowPhieu {
  id: string | null;
  refrenceFileId: string | null;
  refrencePdfFileId?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  path: string | null;
  pathPdfFile: string | null;
  createDate: string;
  createBy: string | null;
  type: number | null;
  phieuId: any | null;
  trangThaiPhieu: string | null;
  loaiPhieuId: string | null;
  notes: string | null;
  bookId?: string | null;
}

export class OutgoingDocumentListPhieuDuThaoModel {
  id: string | null = null;
  documentId: string | null = null;
  trangThai: number | null = null;
  refrenceFileId: string | null = null;
  refrencePdfFileId: string | null = null;
  notes: string | null = null;
  ngayVaoSo: any | null = null;
  soPhieu: any | null = null;
  soPhu?: string; 
  nguoiKy: string | null = null;
  chucVuNguoiKy: string | null = null;
  isChoSo: boolean | null = null;
  isBanHanh: boolean | null = null;
  isDaKy: string | null = null;
  isKyDienTu: string | null = null;
  isDuThao: boolean | null = null;
  isToTrinh: boolean | null = null;
  fileFlowPhieu: FileFlowPhieu | null = null;
  filePDFFlowPhieu: FileFlowPhieu | null = null;
  isDongYDuThao: string | null = null;
  isHoanThanhVBTT: boolean | null = null;
  nguoiDongYDuThao: string | null = null;
  ngayDongYDuThao: string | null = null;
  bookId?: string | null = null;
  tieuDePhieu: string | null = null;
  fileType: string = '';
  fileName: string = '';
  fileSize: number = 0;
  createDate: Date | null = null;
  ngayPhatHanh: any | null = null;
  lstVersionFileFlowPhieuDT: any[] = [];
  lstVersionFileFlowPhieuTT: any[] = [];
  tieuDePhieuVersion: string | null = null;
  phieuId?: string | null = null;
  // Thông tin vị trí số, ngày, tháng, năm trên phiếu (camelCase)
  soVB_X?: number;
  soVB_Y?: number;
  soVB_Font?: number;
  ngayBH_X?: number;
  ngayBH_Y?: number;
  ngayBH_Font?: number;
  thangBH_X?: number;
  thangBH_Y?: number;
  thangBH_Font?: number;
  namBH_X?: number;
  namBH_Y?: number;
  namBH_Font?: number;
  isNam?: boolean;
  isThang?: boolean;
  isNgay?: boolean;
  isVanBan?: boolean;

  constructor(init?: Partial<OutgoingDocumentListPhieuDuThaoModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  reset(): void {
    this.id = null;
    this.documentId = null;
    this.trangThai = null;
    this.refrenceFileId = null;
    this.refrencePdfFileId = null;
    this.notes = null;
    this.ngayVaoSo = null;
    this.soPhieu = null;
    this.nguoiKy = null;
    this.chucVuNguoiKy = null;
    this.isChoSo = null;
    this.isBanHanh = null;
    this.isDaKy = null;
    this.isKyDienTu = null;
    this.isDuThao = null;
    this.isToTrinh = null;
    this.fileFlowPhieu = null;
    this.isDongYDuThao = null;
    this.isHoanThanhVBTT = null;
    this.nguoiDongYDuThao = null;
    this.ngayDongYDuThao = null;
    this.bookId = null;
    this.filePDFFlowPhieu = null;
  }
}
