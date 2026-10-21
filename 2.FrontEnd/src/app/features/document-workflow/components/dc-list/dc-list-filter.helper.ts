import { emptyDocumentColFilter } from '../../../task-management/components/task-list-filter/task-list-filter.helper';
import { DocumentBaseFilter } from '../../models';

export function emptyDcColFilter() {
  return {
    ...emptyDocumentColFilter(),
    fromDate: null as Date | null,
    toDate: null as Date | null,
  };
}

function toDateString(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Gộp bộ lọc cột + từ khóa vào filter gọi API DC. */
export function applyDcColFilter(
  filter: DocumentBaseFilter,
  colFilter: Record<string, any>,
  keyWord: string,
): void {
  const extra = [colFilter['documentNumber'], colFilter['subject']]
    .map((s: string) => s?.trim())
    .filter(Boolean);
  const kw = [keyWord, ...extra].map(s => s?.trim()).filter(Boolean).join(' ');
  filter.keyWord = kw || undefined;

  // Chỉ ghi đè từ panel lọc nâng cao khi có giá trị (giữ filter thanh toolbar).
  if (colFilter['documentTypeId']) filter.documentTypeId = colFilter['documentTypeId'];
  if (colFilter['fieldId']) filter.fieldId = colFilter['fieldId'];
  if (colFilter['urgencyLevelId']) filter.urgencyLevelId = colFilter['urgencyLevelId'];
  if (colFilter['confidentialityLevelId']) filter.securityLevelId = colFilter['confidentialityLevelId'];
  if (colFilter['filterProcessingStatus'] != null && colFilter['filterProcessingStatus'] !== '') {
    filter.filterTrangThai = colFilter['filterProcessingStatus'];
  }
  const from = toDateString(colFilter['fromDate']);
  const to = toDateString(colFilter['toDate']);
  if (from) filter.fromDate = from;
  if (to) filter.toDate = to;
}
