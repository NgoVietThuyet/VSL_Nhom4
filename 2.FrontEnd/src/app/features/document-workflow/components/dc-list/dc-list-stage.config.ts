import {
  LoaiVanBanBo,
  PHAN_LOAI_DON_VI_LABELS,
  PHAN_LOAI_LABELS,
  TabVanBanDen,
  TabVanBanDi,
  TrangThaiVanBanDen,
  InboxRole,
} from '../../models';

/** Tab danh sách — label UPPERCASE như QLVB. */
export interface DcListTabDef {
  key: string;
  label: string;
  icon: string;
  filterPhanLoai?: number | null;
  filterTrangThai?: number | null;
  /** Gửi BE — lọc hàng đợi activity theo vai trò. */
  inboxRole?: string;
}

export interface DcStageListConfig {
  tabs: DcListTabDef[];
  defaultTabKey: string;
  keywordPlaceholder: string;
  showPhanLoaiFilter: boolean;
}

const IN_TIEP_NHAN: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDen.TiepNhan, label: 'TIẾP NHẬN', icon: 'file-protect' },
    { key: TabVanBanDen.TraLai, label: 'TRẢ LẠI', icon: 'file-protect', filterTrangThai: TrangThaiVanBanDen.TraLai },
    { key: TabVanBanDen.TraCuu, label: 'TRA CỨU THÔNG TIN', icon: 'search', filterPhanLoai: LoaiVanBanBo.TraCuu },
  ],
  defaultTabKey: TabVanBanDen.TiepNhan,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số ký hiệu, số đến',
  showPhanLoaiFilter: true,
};

const IN_SO_LOAI_BO: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDen.XuLy, label: 'VĂN BẢN TRÌNH LĐB', icon: 'file-protect', filterPhanLoai: LoaiVanBanBo.VbTrinh },
    { key: TabVanBanDen.XuLy, label: 'VĂN BẢN THỰC HIỆN', icon: 'file-protect', filterPhanLoai: LoaiVanBanBo.VbThucHien },
    { key: TabVanBanDen.XuLy, label: 'PHIẾU CHUYỂN', icon: 'file-protect', filterPhanLoai: LoaiVanBanBo.VbChuyenTiep },
    { key: TabVanBanDen.XuLy, label: 'VĂN BẢN NHẬN ĐỂ BIẾT', icon: 'file-protect', filterPhanLoai: LoaiVanBanBo.VbNhanDeBiet },
    { key: TabVanBanDen.TraLai, label: 'TRẢ LẠI', icon: 'file-protect', filterTrangThai: TrangThaiVanBanDen.TraLai },
    { key: TabVanBanDen.TraCuu, label: 'TRA CỨU THÔNG TIN', icon: 'search', filterPhanLoai: LoaiVanBanBo.TraCuu },
  ],
  defaultTabKey: TabVanBanDen.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số ký hiệu, số đến',
  showPhanLoaiFilter: true,
};

const IN_XU_LY: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDen.XuLy, label: 'XỬ LÝ CHÍNH', icon: 'file-protect', inboxRole: InboxRole.XuLyChinh },
    { key: TabVanBanDen.XuLy, label: 'PHỐI HỢP', icon: 'file-protect', inboxRole: InboxRole.PhoiHop },
    { key: TabVanBanDen.XuLy, label: 'NHẬN ĐỂ BIẾT', icon: 'file-protect', inboxRole: InboxRole.NhanDeBiet },
    { key: TabVanBanDen.HoanThanh, label: 'HOÀN THÀNH', icon: 'check-circle' },
    { key: TabVanBanDen.TraCuu, label: 'TRA CỨU THÔNG TIN', icon: 'search', filterPhanLoai: LoaiVanBanBo.TraCuu },
  ],
  defaultTabKey: TabVanBanDen.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số ký hiệu, số đến',
  showPhanLoaiFilter: false,
};

const IN_XIN_Y_KIEN: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDen.XuLy, label: 'CHỜ Ý KIẾN', icon: 'comment', inboxRole: InboxRole.ChoYKien },
    { key: TabVanBanDen.TraCuu, label: 'TRA CỨU THÔNG TIN', icon: 'search', filterPhanLoai: LoaiVanBanBo.TraCuu },
  ],
  defaultTabKey: TabVanBanDen.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số ký hiệu, số đến',
  showPhanLoaiFilter: false,
};

const IN_DEBIET: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDen.XuLy, label: 'NHẬN ĐỂ BIẾT', icon: 'file-protect', inboxRole: InboxRole.NhanDeBiet },
    { key: TabVanBanDen.TraCuu, label: 'TRA CỨU THÔNG TIN', icon: 'search', filterPhanLoai: LoaiVanBanBo.TraCuu },
  ],
  defaultTabKey: TabVanBanDen.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số ký hiệu, số đến',
  showPhanLoaiFilter: false,
};

const OUT_DU_THAO: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDi.DuThao, label: 'DỰ THẢO', icon: 'file-protect', inboxRole: InboxRole.DuThaoCuaToi },
    { key: TabVanBanDi.XuLy, label: 'ĐÃ TRÌNH KÝ', icon: 'file-protect', inboxRole: InboxRole.ChoKyDuyet },
    { key: TabVanBanDi.TraCuu, label: 'TRA CỨU', icon: 'search' },
  ],
  defaultTabKey: TabVanBanDi.DuThao,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số văn bản, ký hiệu',
  showPhanLoaiFilter: false,
};

const OUT_TRINH_KY: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDi.XuLy, label: 'CHỜ KÝ DUYỆT', icon: 'audit', inboxRole: InboxRole.ChoKyDuyet },
    { key: TabVanBanDi.BanHanh, label: 'CHỜ BAN HÀNH', icon: 'check-circle', inboxRole: InboxRole.ChoBanHanh },
    { key: TabVanBanDi.TraCuu, label: 'TRA CỨU', icon: 'search' },
  ],
  defaultTabKey: TabVanBanDi.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số văn bản, ký hiệu',
  showPhanLoaiFilter: false,
};

const OUT_BAN_HANH: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDi.BanHanh, label: 'BAN HÀNH', icon: 'check-circle', inboxRole: InboxRole.ChoBanHanh },
    { key: TabVanBanDi.TraCuu, label: 'TRA CỨU', icon: 'search' },
  ],
  defaultTabKey: TabVanBanDi.BanHanh,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số văn bản, ký hiệu',
  showPhanLoaiFilter: false,
};

const OUT_XU_LY: DcStageListConfig = {
  tabs: [
    { key: TabVanBanDi.XuLy, label: 'ĐANG XỬ LÝ', icon: 'sync', inboxRole: InboxRole.ChoKyDuyet },
    { key: TabVanBanDi.TraCuu, label: 'TRA CỨU', icon: 'search' },
  ],
  defaultTabKey: TabVanBanDi.XuLy,
  keywordPlaceholder: 'Tìm kiếm theo trích yếu, số văn bản, ký hiệu',
  showPhanLoaiFilter: false,
};

const INCOMING_STAGE: Record<string, DcStageListConfig> = {
  'tiep-nhan': IN_TIEP_NHAN,
  'so-loai': IN_SO_LOAI_BO,
  'xu-ly': IN_XU_LY,
  'xin-y-kien': IN_XIN_Y_KIEN,
  'de-biet': IN_DEBIET,
};

const OUTGOING_STAGE: Record<string, DcStageListConfig> = {
  'du-thao': OUT_DU_THAO,
  'trinh-ky': OUT_TRINH_KY,
  'xu-ly': OUT_XU_LY,
  'ban-hanh': OUT_BAN_HANH,
};

export function getIncomingStageConfig(stage: string): DcStageListConfig {
  return INCOMING_STAGE[stage] ?? IN_TIEP_NHAN;
}

export function getOutgoingStageConfig(stage: string): DcStageListConfig {
  return OUTGOING_STAGE[stage] ?? OUT_DU_THAO;
}

export function getPhanLoaiOptions(cap: 'bo' | 'don-vi'): { value: number; label: string }[] {
  const labels = cap === 'bo' ? PHAN_LOAI_LABELS : PHAN_LOAI_DON_VI_LABELS;
  return Object.entries(labels).map(([k, v]) => ({ value: +k, label: v }));
}
