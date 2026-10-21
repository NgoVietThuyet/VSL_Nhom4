import { BaseFilter } from '../../../shared/models';
import { TaskReceiveDto } from './task-receive.model';
import { TaskReceiveAssignmentRole } from './tk.constants';

export class TaskDispatchDto extends BaseFilter {
  id: string = '';
  taskId: string = '';
  parentDispatchId: string = '';
  documentId: string = '';
  dispatchCode: string = '';
  organizationId: string = '';
  userId: string = '';
  attachmentId: string = '';
  progressPercent: number = 0;
  note: string = '';
  dispatchedAt: string | null = null;
  createDate: string | null = null;
  // Populated
  organizationName: string = '';
  taskTitle: string = '';
  receives: TaskReceiveDto[] = [];
}

export class DispatchRequestDto {
  taskId: string = '';
  parentDispatchId: string = '';
  parentReceiveId: string = '';
  documentId: string = '';
  attachmentId: string = '';
  note: string = '';
  dispatchOrgId: string = '';
  targets: DispatchTargetDto[] = [];
}

export class DispatchTargetDto {
  organizationId: string = '';
  assignmentRole: number = TaskReceiveAssignmentRole.Primary;
  dueDate: string | null = null;
}

export class GiaoTiepRequestDto {
  parentTaskId: string = '';
  documentId: string = '';
  description: string = '';
  title: string = '';
  topicGroupId: string = '';
  fieldId: string = '';
  leadOrganizationId: string = '';
  coordinateOrganizations: string = '';
  priorityLevelId: string = '';
  dueDate: string | null = null;
  startDate: string | null = null;
  note: string = '';
  issuerOrganizationId: string = '';
  parentReceiveId: string = '';
  dispatchOrgId: string = '';
  targets: DispatchTargetDto[] = [];
}

export const ASSIGNMENT_ROLE_LABELS: Record<number, string> = {
  [TaskReceiveAssignmentRole.Primary]: 'Chủ trì',
  [TaskReceiveAssignmentRole.Coordinator]: 'Phối hợp',
  [TaskReceiveAssignmentRole.Observer]: 'Theo dõi',
};

export const ASSIGNMENT_ROLE_COLORS: Record<number, string> = {
  [TaskReceiveAssignmentRole.Primary]: 'red',
  [TaskReceiveAssignmentRole.Coordinator]: 'blue',
  [TaskReceiveAssignmentRole.Observer]: 'default',
};
