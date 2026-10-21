import { BaseFilter } from '../../../shared/models';
import { AssignmentStatusCode, ReceiveListTabKey, TaskReceiveAssignmentRole } from './tk.constants';

export class TaskReceiveDto extends BaseFilter {
  id: string = '';
  dispatchId: string = '';
  parentReceiveId: string = '';
  taskId: string = '';
  documentId: string = '';
  organizationId: string = '';
  userId: string = '';
  assignmentRole: number = TaskReceiveAssignmentRole.Primary;
  /** AssignmentStatus (0..3) — đổi từ `status` cũ. */
  assignmentStatus: number = AssignmentStatusCode.NotAssigned;
  progressPercent: number = 0;
  dueDate: string | null = null;
  receivedAt: string | null = null;
  acceptedAt: string | null = null;
  completedAt: string | null = null;
  lastReportAt: string | null = null;
  note: string = '';
  createDate: string | null = null;
  // Populated
  organizationName: string = '';
  taskTitle: string = '';
  taskCode: string = '';
  documentSymbol: string = '';
  parentOrgId: string = '';
  receiveListTab: ReceiveListTab = ReceiveListTabKey.NotAccepted;
  title?: string;
  topicGroupId?: string;
  documentNumber?: string;
  issuerOrganizationId?: string;
  leadOrganizationId?: string;
  coordinateOrganizations?: string;
  fieldId?: string;
  taskDueDate?: string | null;
  priorityLevelId?: string;
  filterTaskStatus?: number;
  filterAssignmentStatus?: number;
  starredOnly?: boolean;
}

export class UpdateProgressDto {
  receiveId: string = '';
  progressPercent: number = 0;
  note: string = '';
}

export type ReceiveListTab =
  | typeof ReceiveListTabKey.NotAccepted
  | typeof ReceiveListTabKey.InProgress
  | typeof ReceiveListTabKey.Overdue
  | typeof ReceiveListTabKey.Completed
  | typeof ReceiveListTabKey.Accepted;

export const RECEIVE_LIST_TABS: { key: ReceiveListTab; label: string; icon: string }[] = [
  { key: ReceiveListTabKey.NotAccepted, label: 'CHƯA TIẾP NHẬN', icon: 'inbox' },
  { key: ReceiveListTabKey.InProgress, label: 'ĐANG THỰC HIỆN', icon: 'sync' },
  { key: ReceiveListTabKey.Overdue, label: 'QUÁ HẠN', icon: 'warning' },
  { key: ReceiveListTabKey.Completed, label: 'HOÀN THÀNH', icon: 'check-circle' },
];
