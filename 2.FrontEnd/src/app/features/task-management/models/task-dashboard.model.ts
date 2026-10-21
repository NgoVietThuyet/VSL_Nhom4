import { TaskInformationDto } from './task-information.model';

export class TaskDashboardDto {
  totalTasks: number = 0;
  totalDocuments: number = 0;
  taskStatusSummary: TaskStatusSummaryDto = new TaskStatusSummaryDto();
  assignmentStatusSummary: AssignmentStatusSummaryDto = new AssignmentStatusSummaryDto();
  documentStatusSummary: DocumentStatusSummaryDto = new DocumentStatusSummaryDto();
  tasksByStatus: TaskByStatusDto[] = [];
  tasksByOrg: TaskByOrgDto[] = [];
  tasksByMonth: TaskByMonthDto[] = [];
  tasksByField: TaskByFieldDto[] = [];
  upcomingTasks: TaskInformationDto[] = [];
  overdueTaskList: TaskInformationDto[] = [];
  priorityTasks: TaskInformationDto[] = [];
  becomeDueBuckets: BecomeDueBucketsDto = new BecomeDueBucketsDto();
  overdueBuckets: OverdueBucketsDto = new OverdueBucketsDto();
}

export class TaskStatusSummaryDto {
  notStarted = 0;
  inProgress = 0;
  completed = 0;
  overdue = 0;
  pendingComplete = 0;
  pendingExtend = 0;
  pendingPause = 0;
  pendingStop = 0;
  paused = 0;
  stopped = 0;
}

export class AssignmentStatusSummaryDto {
  notAssigned = 0;
  assignedNotAccepted = 0;
  accepted = 0;
  finished = 0;
}

export class DocumentStatusSummaryDto {
  notProcessed = 0;
  processing = 0;
  completed = 0;
}

export class TaskByStatusDto {
  status: number = 0;
  statusLabel: string = '';
  count: number = 0;
}

export class TaskByOrgDto {
  organizationId: string = '';
  organizationName: string = '';
  total: number = 0;
  completed: number = 0;
  overdue: number = 0;
  dueSoon: number = 0;
}

export class BecomeDueBucketsDto {
  from1To10: number = 0;
  from11To20: number = 0;
  from21: number = 0;
}

export class OverdueBucketsDto {
  overdue1To10: number = 0;
  overdue11To20: number = 0;
  overdue21: number = 0;
}

export class TaskByFieldDto {
  fieldId: string = '';
  fieldName: string = '';
  count: number = 0;
}

export class TaskByMonthDto {
  year: number = 0;
  month: number = 0;
  monthLabel: string = '';
  count: number = 0;
}

export class DashboardFilterDto {
  organizationId: string = '';
  year: number | null = null;
}

export class TaskTreeNodeDto {
  id: string = '';
  type: string = '';
  label: string = '';
  status: string = '';
  organizationId: string = '';
  organizationName: string = '';
  assignmentRole: number | null = null;
  progressPercent: number | null = null;
  dueDate: string | null = null;
  children: TaskTreeNodeDto[] = [];
  expanded?: boolean = true;
}
