import { DcOption } from '../../services/dc-master-data.service';
import { DocumentIncoming, DocumentOutgoing, KIEU_VAN_BAN_LABELS } from '../../models';
import {
  getDcConfidentialityInfo,
  getDcLabelByCode,
  getDcUrgencyColor,
} from './dc-list-table.helper';

export interface DocumentIncomingListRow extends DocumentIncoming {
  stt: number;
  urgencyColor: string;
  urgencyLabel: string;
  confClass: string;
  confText: string;
  securityLabel: string;
  phuongAnTitle: string;
  showConfidentiality: boolean;
  showUrgencyIcon: boolean;
}

export interface DocumentOutgoingListRow extends DocumentOutgoing {
  stt: number;
  kyHieuDisplay: string;
  orgDisplay: string;
  signerDisplay: string;
  ngayBanHanhDisplay: Date | string | null;
  kieuLabel: string;
  urgencyColor: string;
  urgencyLabel: string;
  confClass: string;
  confText: string;
  securityLabel: string;
  showConfidentiality: boolean;
  showUrgencyIcon: boolean;
}

function buildPhuongAnTitle(item: DocumentIncoming): string {
  const parts: string[] = [];
  if (item.leaderUsername) parts.push(`Chỉ đạo: ${item.leaderUsername}`);
  if (item.handlerUsername) parts.push(`Xử lý: ${item.handlerUsername}`);
  if (item.note) parts.push(item.note);
  return parts.join(' | ');
}

export function mapIncomingListRows(
  data: DocumentIncoming[],
  currentPage: number,
  pageSize: number,
  urgencyOptions: DcOption[],
  securityOptions: DcOption[],
): DocumentIncomingListRow[] {
  const base = (currentPage - 1) * pageSize;
  return data.map((item, i) => {
    const conf = getDcConfidentialityInfo(item.securityLevelId);
    const urgencyColor = getDcUrgencyColor(item.urgencyLevelId) ?? '';
    return {
      ...item,
      stt: base + i + 1,
      urgencyColor,
      urgencyLabel: getDcLabelByCode(urgencyOptions, item.urgencyLevelId),
      confClass: conf?.class ?? '',
      confText: conf?.text ?? '',
      securityLabel: getDcLabelByCode(securityOptions, item.securityLevelId),
      phuongAnTitle: buildPhuongAnTitle(item),
      showConfidentiality: !!conf?.text,
      showUrgencyIcon: !!urgencyColor,
    };
  });
}

export function mapOutgoingListRows(
  data: DocumentOutgoing[],
  currentPage: number,
  pageSize: number,
  urgencyOptions: DcOption[],
  securityOptions: DcOption[],
  organizes: DcOption[],
): DocumentOutgoingListRow[] {
  const base = (currentPage - 1) * pageSize;
  const orgMap = new Map(organizes.map(o => [o.value, o.label]));
  return data.map((item, i) => {
    const conf = getDcConfidentialityInfo(item.securityLevelId);
    const urgencyColor = getDcUrgencyColor(item.urgencyLevelId) ?? '';
    const kyHieuDisplay = [item.soVanBan, item.soHieu].filter(Boolean).join(' ') || '—';
    const orgDisplay = item.organizationId
      ? (orgMap.get(item.organizationId) ?? item.organizationId)
      : ((item.noiNhan ?? '').trim() || '—');
    return {
      ...item,
      stt: base + i + 1,
      kyHieuDisplay,
      orgDisplay,
      signerDisplay: item.signerUsername || item.drafterUsername || '—',
      ngayBanHanhDisplay: item.ngayBanHanh || item.ngayVanBan || null,
      kieuLabel: KIEU_VAN_BAN_LABELS[item.kieuVanBan] ?? '—',
      urgencyColor,
      urgencyLabel: getDcLabelByCode(urgencyOptions, item.urgencyLevelId),
      confClass: conf?.class ?? '',
      confText: conf?.text ?? '',
      securityLabel: getDcLabelByCode(securityOptions, item.urgencyLevelId),
      showConfidentiality: !!conf?.text,
      showUrgencyIcon: !!urgencyColor,
    };
  });
}
