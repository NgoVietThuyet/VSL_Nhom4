import { InboxRole, LoaiVanBanBo, TabVanBanDen, TabVanBanDi, TrangThaiVanBanDen } from '../models';

export interface DcWorkflowNavigateHint {
  cap: 'bo' | 'don-vi';
  stage: string;
  tabKey?: string;
  tabIndex?: number;
}

/** Gợi ý màn hình sau action VB đến (người gửi / người nhận). */
export function navigateAfterIncomingAction(
  actionKey: string,
  cap: 'bo' | 'don-vi',
  trangThai?: number,
  phanLoai?: number | null,
): DcWorkflowNavigateHint | null {
  switch (actionKey) {
    case 'tiepNhan':
      return { cap, stage: 'so-loai', tabKey: TabVanBanDen.XuLy, tabIndex: 0 };
    case 'tuChoi':
      return { cap, stage: 'tiep-nhan', tabKey: TabVanBanDen.TraCuu };
    case 'luuTraCuu':
      return { cap, stage: 'tiep-nhan', tabKey: TabVanBanDen.TraCuu };
    case 'traLai':
      return { cap, stage: 'tiep-nhan', tabKey: TabVanBanDen.TraLai };
    case 'thuHoi':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDen.XuLy };
    case 'hoanThanh':
    case 'xacNhanHoanThanh':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDen.HoanThanh };
    case 'trinhXinYKien':
      return { cap, stage: 'xin-y-kien', tabKey: TabVanBanDen.XuLy, tabIndex: 0 };
    case 'chuyenTiep':
    case 'chuyenTiepVanBan':
      return { cap, stage: 'so-loai', tabKey: TabVanBanDen.XuLy, tabIndex: 2 };
    case 'chuyenXuLy':
    case 'themXuLy':
    case 'duyetPhuongAn':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDen.XuLy, tabIndex: 0 };
    case 'chiDao':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDen.XuLy };
    case 'xuLyLai':
    case 'khoiPhuc':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDen.XuLy };
    default:
      if (trangThai === TrangThaiVanBanDen.ChuaTiepNhan) {
        return { cap, stage: 'tiep-nhan', tabKey: TabVanBanDen.TiepNhan };
      }
      if (phanLoai === LoaiVanBanBo.VbChuyenTiep) {
        return { cap, stage: 'so-loai', tabKey: TabVanBanDen.XuLy, tabIndex: 2 };
      }
      return null;
  }
}

/** Gợi ý màn hình sau action VB đi. */
export function navigateAfterOutgoingAction(
  actionKey: string,
  cap: 'bo' | 'don-vi',
): DcWorkflowNavigateHint | null {
  switch (actionKey) {
    case 'trinhKy':
      return { cap, stage: 'trinh-ky', tabKey: TabVanBanDi.XuLy };
    case 'dongYDuThao':
    case 'hoanThanh':
      return { cap, stage: 'xu-ly', tabKey: TabVanBanDi.XuLy };
    case 'traLai':
      return { cap, stage: 'du-thao', tabKey: TabVanBanDi.DuThao };
    case 'banHanh':
      return { cap, stage: 'ban-hanh', tabKey: TabVanBanDi.BanHanh };
    case 'thuHoi':
      return { cap, stage: 'du-thao', tabKey: TabVanBanDi.DuThao };
    case 'xuLyLai':
      return { cap, stage: 'trinh-ky', tabKey: TabVanBanDi.XuLy };
    case 'khoiPhuc':
      return { cap, stage: 'du-thao', tabKey: TabVanBanDi.DuThao };
    default:
      return null;
  }
}

export function buildDocumentWorkflowUrl(hint: DcWorkflowNavigateHint): string[] {
  const base = ['/document-workflow', hint.cap];
  if (hint.stage === 'bao-cao') {
    return ['/document-workflow', 'bao-cao'];
  }
  const isIncoming = ['tiep-nhan', 'so-loai', 'xu-ly', 'xin-y-kien', 'de-biet'].includes(hint.stage);
  if (isIncoming) {
    return [...base, 'van-ban-den', hint.stage];
  }
  return [...base, 'van-ban-di', hint.stage];
}

/** Map tab label index → inboxRole cho Search API. */
export function resolveIncomingInboxRole(stage: string, tabIndex: number, tabs: { inboxRole?: string }[]): string | undefined {
  const tab = tabs[tabIndex];
  if (tab?.inboxRole) return tab.inboxRole;
  if (stage === 'xin-y-kien') return InboxRole.ChoYKien;
  if (stage === 'de-biet') return InboxRole.NhanDeBiet;
  if (stage === 'xu-ly') {
    if (tabIndex === 1) return InboxRole.PhoiHop;
    if (tabIndex === 2) return InboxRole.NhanDeBiet;
    return InboxRole.XuLyChinh;
  }
  return undefined;
}

export function resolveOutgoingInboxRole(stage: string, tabIndex: number, tabs: { inboxRole?: string }[]): string | undefined {
  const tab = tabs[tabIndex];
  if (tab?.inboxRole) return tab.inboxRole;
  if (stage === 'du-thao' && tabIndex === 0) return InboxRole.DuThaoCuaToi;
  if (stage === 'du-thao' && tabIndex === 1) return InboxRole.ChoKyDuyet;
  if (stage === 'trinh-ky') return InboxRole.ChoKyDuyet;
  if (stage === 'ban-hanh') return InboxRole.ChoBanHanh;
  return undefined;
}
