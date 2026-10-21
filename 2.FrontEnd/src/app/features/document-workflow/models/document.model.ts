export interface PagedResult<T> {
  data: T[];
  totalRecord: number;
  totalPage: number;
  currentPage: number;
  pageSize: number;
}

export interface DocumentBaseFilter {
  currentPage?: number;
  pageSize?: number;
  keyWord?: string;
  isPaging?: boolean;
  tab?: string;
  stage?: string;
  inboxRole?: string;
  filterTrangThai?: number | null;
  filterPhanLoai?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  documentTypeId?: string;
  fieldId?: string;
  urgencyLevelId?: string;
  securityLevelId?: string;
}

export interface DocumentIncoming {
  id?: string;
  capXuLy: number;
  soDen?: string;
  soHieu?: string;
  trichYeu?: string;
  noiDung?: string;
  documentTypeId?: string;
  fieldId?: string;
  urgencyLevelId?: string;
  securityLevelId?: string;
  ngayVanBan?: string | null;
  ngayDen?: string | null;
  hanXuLy?: string | null;
  noiGui?: string;
  issuerOrganizationId?: string;
  organizationId?: string;
  bookId?: string;
  bookName?: string;
  fileId?: string;
  phanLoai?: number | null;
  trangThai: number;
  leaderUsername?: string;
  handlerUsername?: string;
  deXuatLanhDaoXuLy?: string | null;
  xinYKienText?: string;
  note?: string;
  createDate?: string;
  createBy?: string;
}

export interface DocumentIncomingFilter extends DocumentBaseFilter {
  capXuLy?: number;
  organizationId?: string;
  filterPhanLoai?: number | null;
}

export interface DocumentOutgoing {
  id?: string;
  kieuVanBan: number;
  soVanBan?: string;
  soHieu?: string;
  trichYeu?: string;
  noiDung?: string;
  documentTypeId?: string;
  fieldId?: string;
  urgencyLevelId?: string;
  securityLevelId?: string;
  ngayVanBan?: string | null;
  hanXuLy?: string | null;
  organizationId?: string;
  bookId?: string;
  bookName?: string;
  countToTrinh?: number;
  countPhieuDuThao?: number;
  noiNhan?: string;
  incomingDocumentId?: string;
  fileId?: string;
  trangThai: number;
  ngayBanHanh?: string | null;
  drafterUsername?: string;
  signerUsername?: string;
  note?: string;
  createDate?: string;
  createBy?: string;
}

export interface DocumentOutgoingFilter extends DocumentBaseFilter {
  organizationId?: string;
  filterKieuVanBan?: number | null;
}

export interface DocumentActivity {
  id?: string;
  entityType?: string;
  documentId?: string;
  actionType?: string;
  fromStatus?: number | null;
  toStatus?: number | null;
  fromUsername?: string;
  toUsername?: string;
  vaiTroXuLy?: string;
  yKien?: string;
  note?: string;
  actedAt?: string;
}

export interface DocumentIncomingPhieu {
  id?: string;
  documentId?: string;
  tieuDe?: string;
  loaiPhieuId?: number | null;
  fileId?: string;
  notes?: string;
}

export interface DocumentOutgoingPhieu {
  id?: string;
  documentId?: string;
  tieuDe?: string;
  fileId?: string;
  isDuThao?: boolean;
  isToTrinh?: boolean;
  notes?: string;
  nguoiKy?: string;
}

export interface DocumentAction {
  id: string;
  toUsernames?: string[];
  toOrganizationIds?: string[];
  vaiTroXuLy?: string;
  phanLoai?: number | null;
  yKien?: string;
  note?: string;
  hanXuLy?: string | null;
  bookId?: string;
}
