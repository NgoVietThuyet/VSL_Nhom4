import { TaskInformationDto } from './task-information.model';
import { OcrStage, TaskInformationStatus } from './tk.constants';

export type { OcrStage } from './tk.constants';

export interface ExtractedTask {
  order: number;
  taskContent: string;
  deadline: string;
  deadlineDate: Date | null;
  regions: Array<{ pageIndex: number; xmin: number; ymin: number; xmax: number; ymax: number }>;
  pageWidth?: number;
  pageHeight?: number;
  selected?: boolean;
  id?: string;
  topicGroupId?: string;
  leadOrganizationId?: string;
  leadOrganizationIds?: string[];
  coordinateOrganizationIds?: string[];
  priorityLevelId?: string;
  status?: number;
  isFromDocument?: boolean;
  fieldId?: string;
  requiresReportFile?: boolean;
  issuerOrganizationId?: string;
  leaderUserName?: string;
  startDate?: Date | null;
  note?: string;
  dispatchOrgId?: string;
}

export interface ExtractedDoc {
  title: string;
  documentNumber: string;
  documentTypeId: string;
  fieldId: string;
  urgencyLevelId: string;
  confidentialityLevelId: string;
  issuerOrganizationId: string;
  sendingAgencyText: string;
  issueDate: Date | null;
  effectiveDate: Date | null;
  expireDate: Date | null;
  summary: string;
  leaderUsername: string;
  signerUsername: string;
}

export function emptyExtractedDoc(): ExtractedDoc {
  return {
    title: '', documentNumber: '', documentTypeId: '', fieldId: '',
    urgencyLevelId: '', confidentialityLevelId: '', issuerOrganizationId: '',
    sendingAgencyText: '', issueDate: null, effectiveDate: null, expireDate: null,
    summary: '', leaderUsername: '', signerUsername: '',
  };
}

export function emptyExtractedTask(order: number): ExtractedTask {
  return {
    order,
    taskContent: '',
    deadline: '',
    deadlineDate: null,
    regions: [],
    selected: false,
    topicGroupId: '',
    leadOrganizationId: '',
    leadOrganizationIds: [],
    coordinateOrganizationIds: [],
    priorityLevelId: '',
    status: TaskInformationStatus.NotStarted,
    isFromDocument: true,
  };
}

export function mergeExtractedTask(current: ExtractedTask, updated: ExtractedTask): ExtractedTask {
  const leadIds = updated.leadOrganizationIds?.length
    ? [...updated.leadOrganizationIds]
    : (updated.leadOrganizationId ?? '').split(',').map(id => id.trim()).filter(Boolean);
  const coordIds = [...(updated.coordinateOrganizationIds ?? [])];
  const deadlineDate = updated.deadlineDate
    ? new Date(updated.deadlineDate as unknown as string)
    : null;
  const startDate = updated.startDate
    ? new Date(updated.startDate as unknown as string)
    : null;

  return {
    ...current,
    ...updated,
    order: current.order,
    id: current.id,
    selected: current.selected,
    regions: updated.regions?.length ? [...updated.regions] : [...(current.regions ?? [])],
    pageWidth: updated.pageWidth ?? current.pageWidth,
    pageHeight: updated.pageHeight ?? current.pageHeight,
    leadOrganizationIds: leadIds,
    leadOrganizationId: leadIds.join(','),
    coordinateOrganizationIds: coordIds,
    deadlineDate,
    startDate,
  };
}

export function mapExtractedTaskToInformationDto(t: ExtractedTask, order?: number): TaskInformationDto {
  const dto = new TaskInformationDto();
  if (t.id) dto.id = t.id;
  dto.taskCode = String(t.order ?? order ?? 1);
  dto.description = t.taskContent ?? '';
  dto.title = (t.taskContent ?? '').slice(0, 200);
  dto.dueDate = t.deadlineDate
    ? formatExtractedDateForApi(t.deadlineDate)
    : parseExtractedDeadlineToIso(t.deadline);
  dto.priorityLevelId = t.priorityLevelId ?? '';
  dto.topicGroupId = t.topicGroupId ?? '';
  const leadIds = t.leadOrganizationIds?.length
    ? t.leadOrganizationIds
    : (t.leadOrganizationId ?? '').split(',').map(id => id.trim()).filter(Boolean);
  dto.leadOrganizationId = leadIds.join(',');
  dto.coordinateOrganizations = (t.coordinateOrganizationIds ?? []).join(',');
  dto.taskStatus = t.status ?? 0;
  dto.isFromDocument = t.isFromDocument ?? true;
  dto.fieldId = t.fieldId ?? '';
  if (t.dispatchOrgId) dto.dispatchOrgId = t.dispatchOrgId;
  dto.requiresReportFile = t.requiresReportFile ?? false;
  if (t.leaderUserName) dto.leaderUserName = t.leaderUserName;
  dto.startDate = t.startDate ? formatExtractedDateForApi(t.startDate) : null;
  if (t.note) dto.note = t.note;
  if (t.issuerOrganizationId) dto.issuerOrganizationId = t.issuerOrganizationId;
  if (t.regions?.length) {
    dto.highlightRegions = JSON.stringify({
      regions: t.regions,
      pageWidth: t.pageWidth ?? null,
      pageHeight: t.pageHeight ?? null,
    });
  }
  return dto;
}

function formatExtractedDateForApi(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function parseExtractedDeadlineToIso(value?: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
