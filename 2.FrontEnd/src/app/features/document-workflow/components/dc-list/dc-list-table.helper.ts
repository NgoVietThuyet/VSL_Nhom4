/** Số/ký hiệu hiển thị trên lưới (đồng bộ task-document). */
export function formatDcSoKh(item: {
  soHieu?: string;
  soDen?: string;
  soVanBan?: string;
}): string {
  const hieu = item.soHieu?.trim();
  if (hieu) return hieu;
  const so = item.soVanBan?.trim() || item.soDen?.trim();
  return so ?? '';
}

export function formatDcDoiTac(item: { noiGui?: string; noiNhan?: string }): string {
  return (item.noiGui ?? item.noiNhan ?? '').trim();
}

export function getDcUrgencyColor(level: string | undefined | null): string | null {
  switch (level) {
    case 'HOA_TOC': return '#f50';
    case 'THUONG_KHAN': return '#d46b08';
    case 'KHAN': return '#d4b106';
    default: return null;
  }
}

export function getDcConfidentialityInfo(level: string | undefined | null) {
  switch (level) {
    case 'MAT_DAC_BIET': return { text: 'A', class: 'circle-letter-red' };
    case 'TOI_MAT': return { text: 'B', class: 'circle-letter-green' };
    case 'MAT': return { text: 'C', class: 'circle-letter-blue' };
    default: return null;
  }
}

export function getDcLabelByCode(list: { value: string; label: string }[], code?: string | null): string {
  if (!code) return '';
  return list.find(x => x.value === code)?.label ?? code;
}
