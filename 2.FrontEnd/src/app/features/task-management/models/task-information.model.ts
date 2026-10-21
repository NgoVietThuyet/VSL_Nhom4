import { BaseFilter } from '../../../shared/models';
import { readCssSystemPrimary } from '../../../core/utils/theme-tokens';
import { TaskListTabKey, TaskStatusCode } from './tk.constants';

export class TaskInformationDto extends BaseFilter {
  id: string = '';
  parentTaskId: string = '';
  sourceReceiveId: string = '';
  documentId: string = '';
  taskCode: string = '';
  title: string = '';
  description: string = '';
  priorityLevelId: string = '';
  topicGroupId: string = '';
  leadOrganizationId: string = '';
  coordinateOrganizations: string = '';
  dueDate: string | null = null;
  /** TaskStatus mới (10 giá trị) — backend đặt tên `taskStatus`. */
  taskStatus: number = TaskStatusCode.NotStarted;
  lastStatusChangedAt: string | null = null;
  pendingApprovalNote: string | null = null;
  pendingNewDueDate: string | null = null;
  pendingProposerUserId: string | null = null;
  createdByOrgId: string = '';
  createdByUserId: string = '';
  dispatchOrgId: string = '';
  createDate: string | null = null;
  isFromDocument = false;
  highlightRegions: string | null = null;
  requiresReportFile: boolean = false;
  leaderUserName: string = '';
  startDate: string | null = null;
  note: string = '';
  issuerOrganizationId: string = '';
  listTab: TaskListTab = TaskListTabKey.InProgress;
  starredOnly?: boolean;
  filterTaskStatus?: number;
  filterAssignmentStatus?: number;
  // Read-only
  documentSymbol: string = '';
  documentNumber: string = '';
  documentSubject: string = '';
  fieldId: string = '';
  parentTaskTitle: string = '';
  isStarred = false;
  // Receive/coordinate list (SearchTaskList)
  receiveId?: string;
  /** AssignmentStatus của receive (0..3) — đổi tên từ receiveStatus. */
  receiveAssignmentStatus?: number;
  canAccept?: boolean;
  canPropose?: boolean;
  canResume?: boolean;
  canApprove?: boolean;
  hasDownstreamDispatch?: boolean;
}

export type TaskListTab =
  | typeof TaskListTabKey.All
  | typeof TaskListTabKey.InProgress
  | typeof TaskListTabKey.Overdue
  | typeof TaskListTabKey.Completed
  | typeof TaskListTabKey.Stopped;

export const TASK_LIST_TABS: { key: TaskListTab; label: string; icon: string; iconTheme?: 'outline' | 'fill' | 'twotone' }[] = [
  { key: TaskListTabKey.InProgress, label: 'ĐANG THỰC HIỆN', icon: 'sync' },
  { key: TaskListTabKey.Overdue, label: 'QUÁ HẠN', icon: 'warning' },
  { key: TaskListTabKey.Completed, label: 'HOÀN THÀNH', icon: 'check-circle' },
  { key: TaskListTabKey.Stopped, label: 'DỪNG', icon: 'stop' },
];

export const PRIORITY_LABELS: Record<string, string> = {
  CAO: 'Cao',
  TB: 'Trung bình',
  THAP: 'Thấp',
};

export const PRIORITY_COLORS: Record<string, string> = {
  TB: '#faad14',
  THAP: '#52c41a',
};

export function priorityFallbackColor(code: string): string {
  if (code === 'CAO') {
    return readCssSystemPrimary();
  }
  return PRIORITY_COLORS[code] ?? '#d9d9d9';
}
