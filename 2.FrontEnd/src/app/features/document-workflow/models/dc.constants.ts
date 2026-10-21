/**
 * Hằng số module Điều hành Văn bản (DC).
 * Khớp 1-1 với Project.Core/Entities/DC/DcConstants.cs (BE).
 */

/** Chiều cao vùng cuộn bảng danh sách — đồng bộ task-management (TK_LIST_TABLE_SCROLL_Y). */
export const DC_LIST_TABLE_SCROLL_Y = 'calc(100vh - 200px)';

// ── Cấp xử lý ───────────────────────────────────────────────
export const CapXuLy = {
  Bo: 10,
  DonVi: 20,
} as const;

export const CAP_XU_LY_LABELS: Record<number, string> = {
  [CapXuLy.Bo]: 'Cấp Bộ',
  [CapXuLy.DonVi]: 'Cấp Đơn vị',
};

// ── Trạng thái Văn bản đến ──────────────────────────────────
export const TrangThaiVanBanDen = {
  ChuaTiepNhan: 10,
  DaTiepNhan: 15,
  DangXuLy: 20,
  HoanThanh: 30,
  ThuHoi: 40,
  TraLai: 50,
  ThayThe: 60,
  TuChoi: 70,
  CapNhat: 80,
} as const;

export const TRANG_THAI_VBD_LABELS: Record<number, string> = {
  [TrangThaiVanBanDen.ChuaTiepNhan]: 'Chưa tiếp nhận',
  [TrangThaiVanBanDen.DaTiepNhan]: 'Đã tiếp nhận',
  [TrangThaiVanBanDen.DangXuLy]: 'Đang xử lý',
  [TrangThaiVanBanDen.HoanThanh]: 'Hoàn thành',
  [TrangThaiVanBanDen.ThuHoi]: 'Thu hồi',
  [TrangThaiVanBanDen.TraLai]: 'Trả lại',
  [TrangThaiVanBanDen.ThayThe]: 'Thay thế',
  [TrangThaiVanBanDen.TuChoi]: 'Từ chối',
  [TrangThaiVanBanDen.CapNhat]: 'Cập nhật',
};

export const TRANG_THAI_VBD_COLORS: Record<number, string> = {
  [TrangThaiVanBanDen.ChuaTiepNhan]: 'default',
  [TrangThaiVanBanDen.DaTiepNhan]: 'cyan',
  [TrangThaiVanBanDen.DangXuLy]: 'processing',
  [TrangThaiVanBanDen.HoanThanh]: 'success',
  [TrangThaiVanBanDen.ThuHoi]: 'warning',
  [TrangThaiVanBanDen.TraLai]: 'orange',
  [TrangThaiVanBanDen.ThayThe]: 'purple',
  [TrangThaiVanBanDen.TuChoi]: 'error',
  [TrangThaiVanBanDen.CapNhat]: 'blue',
};

// ── Phân loại văn bản đến (cấp Bộ) ──────────────────────────
export const LoaiVanBanBo = {
  VbTrinh: 10,
  VbThucHien: 20,
  VbNhanDeBiet: 30,
  VbChuyenTiep: 35,
  TraLai: 39,
  TraCuu: 40,
} as const;

export const PHAN_LOAI_LABELS: Record<number, string> = {
  [LoaiVanBanBo.VbTrinh]: 'VB Trình',
  [LoaiVanBanBo.VbThucHien]: 'VB Thực hiện',
  [LoaiVanBanBo.VbNhanDeBiet]: 'VB Nhận để biết',
  [LoaiVanBanBo.VbChuyenTiep]: 'VB Chuyển tiếp',
  [LoaiVanBanBo.TraLai]: 'Trả lại',
  [LoaiVanBanBo.TraCuu]: 'Lưu tra cứu',
};

// ── Trạng thái Văn bản đi ───────────────────────────────────
export const TrangThaiVanBanDi = {
  DuThao: 10,
  ChoXuLy: 20,
  DangThucHien: 25,
  TraLai: 30,
  ChoBanHanh: 39,
  DaPhatHanh: 40,
  CapNhat: 45,
  ThuHoi: 50,
  ChoBanHanhMotPhan: 59,
  BanHanhMotPhan: 60,
  ThayThe: 70,
} as const;

export const TRANG_THAI_VBDI_LABELS: Record<number, string> = {
  [TrangThaiVanBanDi.DuThao]: 'Dự thảo',
  [TrangThaiVanBanDi.ChoXuLy]: 'Chờ xử lý',
  [TrangThaiVanBanDi.DangThucHien]: 'Đang thực hiện',
  [TrangThaiVanBanDi.TraLai]: 'Trả lại',
  [TrangThaiVanBanDi.ChoBanHanh]: 'Chờ ban hành',
  [TrangThaiVanBanDi.DaPhatHanh]: 'Đã ban hành',
  [TrangThaiVanBanDi.CapNhat]: 'Cập nhật',
  [TrangThaiVanBanDi.ThuHoi]: 'Thu hồi',
  [TrangThaiVanBanDi.ChoBanHanhMotPhan]: 'Chờ ban hành tờ trình',
  [TrangThaiVanBanDi.BanHanhMotPhan]: 'Ban hành tờ trình',
  [TrangThaiVanBanDi.ThayThe]: 'Thay thế',
};

export const TRANG_THAI_VBDI_COLORS: Record<number, string> = {
  [TrangThaiVanBanDi.DuThao]: 'default',
  [TrangThaiVanBanDi.ChoXuLy]: 'processing',
  [TrangThaiVanBanDi.DangThucHien]: 'blue',
  [TrangThaiVanBanDi.TraLai]: 'orange',
  [TrangThaiVanBanDi.ChoBanHanh]: 'gold',
  [TrangThaiVanBanDi.DaPhatHanh]: 'success',
  [TrangThaiVanBanDi.CapNhat]: 'cyan',
  [TrangThaiVanBanDi.ThuHoi]: 'warning',
  [TrangThaiVanBanDi.ChoBanHanhMotPhan]: 'gold',
  [TrangThaiVanBanDi.BanHanhMotPhan]: 'lime',
  [TrangThaiVanBanDi.ThayThe]: 'purple',
};

export const KieuVanBanDi = {
  ToTrinh: 10,
  DuThao: 20,
} as const;

export const KIEU_VAN_BAN_LABELS: Record<number, string> = {
  [KieuVanBanDi.ToTrinh]: 'Tờ trình',
  [KieuVanBanDi.DuThao]: 'Dự thảo',
};

// ── Tab keys ────────────────────────────────────────────────
export const TabVanBanDen = {
  TiepNhan: 'tiep_nhan',
  TraLai: 'tra_lai',
  XuLy: 'xu_ly',
  HoanThanh: 'hoan_thanh',
  TraCuu: 'tra_cuu',
} as const;

export const PHAN_LOAI_DON_VI_LABELS: Record<number, string> = {
  10: 'VB Nhận để biết',
  20: 'VB Xin ý kiến',
  25: 'Trả lại',
  30: 'Lưu tra cứu',
};

export const LoaiVanBanDonVi = {
  VbNhanDeBiet: 10,
  VbXinYKien: 20,
  TraLai: 25,
  TraCuu: 30,
} as const;

export const TabVanBanDi = {
  DuThao: 'du_thao',
  XuLy: 'xu_ly',
  BanHanh: 'ban_hanh',
  TraCuu: 'tra_cuu',
} as const;

export const InboxRole = {
  XuLyChinh: 'xu_ly_chinh',
  PhoiHop: 'phoi_hop',
  NhanDeBiet: 'nhan_de_biet',
  ChoYKien: 'cho_y_kien',
  DuThaoCuaToi: 'du_thao_cua_toi',
  ChoKyDuyet: 'cho_ky_duyet',
  ChoBanHanh: 'cho_ban_hanh',
} as const;

export const BookType = {
  Incoming: 'INCOMING',
  Outgoing: 'OUTGOING',
} as const;

export const LoaiPhieuVanBanDen = {
  PhieuTrinh: 10,
  PhieuThongBao: 20,
} as const;

export const LOAI_PHIEU_DEN_LABELS: Record<number, string> = {
  [LoaiPhieuVanBanDen.PhieuTrinh]: 'Phiếu trình',
  [LoaiPhieuVanBanDen.PhieuThongBao]: 'Phiếu thông báo',
};

export const VaiTroXuLy = {
  XuLyChinh: 'XU_LY_CHINH',
  PhoiHop: 'PHOI_HOP',
  NhanDeBiet: 'NHAN_DE_BIET',
  ChuTri: 'CHU_TRI',
  YKien: 'Y_KIEN',
} as const;

// ── Action type labels (lịch sử) ────────────────────────────
export const ACTION_TYPE_LABELS: Record<string, string> = {
  TAO_MOI: 'Tạo mới',
  TIEP_NHAN: 'Tiếp nhận',
  TU_CHOI: 'Từ chối',
  CAP_NHAT_THONG_TIN: 'Cập nhật thông tin',
  PHAN_LOAI: 'Phân loại',
  CHUYEN_XU_LY: 'Chuyển xử lý',
  CHI_DAO: 'Lãnh đạo chỉ đạo',
  THEM_XU_LY: 'Thêm xử lý',
  CHUYEN_TIEP_VAN_BAN: 'Chuyển tiếp văn bản',
  Y_KIEN: 'Cho ý kiến',
  DUYET_PHUONG_AN: 'Duyệt phương án',
  HOAN_THANH: 'Hoàn thành xử lý',
  XAC_NHAN_HOAN_THANH: 'Xác nhận hoàn thành',
  THU_HOI: 'Thu hồi',
  KHOI_PHUC: 'Khôi phục',
  TRA_LAI: 'Trả lại',
  XU_LY_LAI: 'Xử lý lại',
  LUU_TRA_CUU: 'Lưu tra cứu',
  LUU_SO: 'Lưu số',
  DA_XEM: 'Đã xem',
  // Văn bản đi
  TRINH_KY: 'Trình ký',
  XIN_Y_KIEN: 'Xin ý kiến',
  CHO_Y_KIEN: 'Cho ý kiến',
  CHUYEN_CHO_Y_KIEN: 'Chuyển cho ý kiến',
  DONG_Y_DU_THAO: 'Đồng ý dự thảo',
  HOAN_THANH_TO_TRINH: 'Hoàn thành tờ trình',
  HOAN_THANH_DU_THAO: 'Hoàn thành dự thảo',
  DE_XUAT_BAN_HANH: 'Đề xuất ban hành',
  DE_NGHI_RA_SOAT_BAN_HANH: 'Đề nghị rà soát',
  CHO_SO: 'Cho số',
  BAN_HANH: 'Ban hành',
  XOA_DU_THAO: 'Xoá dự thảo',
};
