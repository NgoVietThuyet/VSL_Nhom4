import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
} from '@angular/core';
import { DcFilePreview } from '../../../document-workflow/components/dc-file-preview/dc-file-preview';
import { dcFilePreviewTabTitle } from '../../../document-workflow/components/dc-file-preview-tabs/dc-file-preview-tabs.model';
import { Subject, catchError, forkJoin, merge, of, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskCreateModal } from '../task-create-modal/task-create-modal';
import { ExtractedTask } from '../../models/task-document-drawer.model';
import { EnvironmentService, GlobalService } from '../../../../core';
import { readCssSystemPrimary } from '../../../../core/utils/theme-tokens';
import { TaskInformationService } from '../../services/task-information.service';
import { TaskDocumentService } from '../../services/task-document.service';
import { TaskReceiveService } from '../../services/task-receive.service';
import { TaskDispatchService } from '../../services/task-dispatch.service';
import { TaskWorkflowService } from '../../services/task-workflow.service';
import { FileService } from '../../../../shared/services/file.service';
import { LocalStorageUtils } from '../../../../shared/utils';
import { ChatBotService } from '../../../chat-bot/services/chat-bot.service';
import {
  ChatBotAttachmentDto, ChatBotAttachmentStatus,
} from '../../../chat-bot/models/chat-bot.model';
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS,
  ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS,
  AssignmentStatusCode,
  TaskStatusCode,
  isTaskTerminal, isTaskPending,
  STATUS_HISTORY_ACTION_LABELS,
  TaskInformationDto,
  PRIORITY_LABELS,
  priorityFallbackColor,
  PROPOSAL_TYPE_LABELS,
  ProposalTypeCode,
  TaskApprovalDto,
  TaskApproveExtendDto,
  TaskPendingProposalDto,
} from '../../models';
import {
  TASK_DISCUSS_TYPE, TaskDiscussAttachment, TaskDiscussItem, TaskHistoryItem,
} from '../../models/task-detail-drawer.model';
import { GiaoTiepRequestDto } from '../../models';
import { TASK_LOG_STATUS } from '../../statics/task-log-status.static';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { AccountService } from '../../../system-manager/services/account.service';
import { TaskProgressReportService } from '../../services/task-progress-report.service';

interface FilePreviewTab {
  fileId: string;
  fileName: string;
  title: string;
  isOriginal: boolean;
}

@Component({
  selector: 'app-task-detail-drawer',
  standalone: true,
  imports: [SharedModules, TaskCreateModal, DcFilePreview],
  templateUrl: './task-detail-drawer.html',
  styleUrl: './task-detail-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailDrawer implements OnInit, OnDestroy {
  readonly primaryBadgeStyle = {
    backgroundColor: readCssSystemPrimary(),
    marginLeft: '4px',
  };

  private destroy$ = new Subject<void>();
  private loadCancel$ = new Subject<void>();

  @ViewChild('commentFileInput') commentFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('proposalFileInput') proposalFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('redispatchTaskModal') redispatchTaskModal?: TaskCreateModal;

  @Input() mainTasks: any[] = [];
  @Input() organizes: any[] = [];
  @Input() taskPriorities: any[] = [];
  @Input() documentFields: any[] = [];
  @Input() viewOnly = false;
  @Input() receiveMode = false;
  @Input() taskList: any[] = [];
  @Output() saved = new EventEmitter<void>();

  visible = false;
  loading = false;
  saving = false;
  taskId = '';
  task: TaskInformationDto = new TaskInformationDto();
  dueDateModel: Date | null = null;
  coordinateOrgIds: string[] = [];

  pdfPreviewTabs: FilePreviewTab[] = [];
  pdfPreviewSelectedIndex = 0;
  activePreviewFileId: string | null = null;

  originalFile: ChatBotAttachmentDto | null = null;
  attachmentFiles: ChatBotAttachmentDto[] = [];

  comments: TaskDiscussItem[] = [];
  directives: TaskDiscussItem[] = [];
  historyItems: TaskHistoryItem[] = [];
  receives: any[] = [];
  receivesLoading = false;
  discussLoading = false;
  taskHistory: { id: string; title: string }[] = [];

  redispatchSaving = false;
  private _activeReceiveForDispatch: any = null;

  readonly userOrgIds: string[] = (() => {
    const info = LocalStorageUtils.getItem('accountInfo') as any;
    const ids: string[] = Array.isArray(info?.orgIds) ? info.orgIds : [];
    const primary: string = info?.orgId ?? '';
    return ids.length ? ids : (primary ? [primary] : []);
  })();
  commentSending = false;
  directiveSending = false;

  newComment = '';
  commentPendingAttachments: TaskDiscussAttachment[] = [];
  commentUploading = false;
  directiveDraft = '';
  directiveMentions: string[] = [];
  directivePendingAttachments: TaskDiscussAttachment[] = [];
  directiveUploading = false;

  // ── Proposal modal ──────────────────────────────────────────────
  proposalModalVisible = false;
  proposalKind: 'complete' | 'extend' | 'pause' | 'stop' = 'complete';
  proposalNote = '';
  proposalNewDueDate: Date | null = null;
  proposalAttachments: TaskDiscussAttachment[] = [];
  proposalUploading = false;
  proposalSending = false;
  @Input() proposal: TaskPendingProposalDto | null = null;
  @Output() actionDone = new EventEmitter<void>();

  // ── Approve/Reject từ drawer ──────────────────────────────────────
  drawerActionModalVisible = false;
  drawerActiveAction: 'approve' | 'reject' = 'approve';
  drawerActionNote = '';
  drawerActionAttachments: TaskDiscussAttachment[] = [];
  drawerActionUploading = false;
  drawerActionSending = false;
  drawerExtendUseProposedDate = true;
  drawerExtendAdjustedDueDate: Date | null = null;
  drawerExtendAdjustReason = '';

  // ── Báo cáo tiến độ ─────────────────────────────────────────────────
  progressReports: any[] = [];
  progressReportGroups: { orgId: string; orgName: string; reports: any[] }[] = [];
  progressReportsLoading = false;
  reportModalVisible = false;
  reportContent = '';
  reportPendingAttachments: TaskDiscussAttachment[] = [];
  reportUploading = false;
  reportSending = false;

  readonly proposalTypeLabels = PROPOSAL_TYPE_LABELS;

  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  readonly assignmentStatusLabels = ASSIGNMENT_STATUS_LABELS;
  readonly assignmentStatusColors = ASSIGNMENT_STATUS_COLORS;
  readonly taskStatusOptions = Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  readonly taskLogStatus = TASK_LOG_STATUS;
  readonly statusHistoryLabels = STATUS_HISTORY_ACTION_LABELS;
  readonly isTaskTerminal = isTaskTerminal;
  readonly isTaskPending = isTaskPending;
  readonly TaskStatusCode = TaskStatusCode;

  private accounts: any[] = [];

  constructor(
    private taskService: TaskInformationService,
    private docService: TaskDocumentService,
    private receiveService: TaskReceiveService,
    private dispatchService: TaskDispatchService,
    private workflowService: TaskWorkflowService,
    private fileService: FileService,
    private chatBotService: ChatBotService,
    private modal: NzModalService,
    private env: EnvironmentService,
    private global: GlobalService,
    private cdr: ChangeDetectorRef,
    private notification: NzNotificationService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private fieldService: DocumentFieldService,
    private accountService: AccountService,
    private progressReportService: TaskProgressReportService,
  ) {}

  ngOnInit(): void {
    this.loadMissingMasterData();
  }

  ngOnDestroy(): void {
    this.loadCancel$.next();
    this.loadCancel$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get drawerTitle(): string {
    const t = this.task.description || this.task.title || 'Nhiệm vụ';
    return t.length > 80 ? t.slice(0, 80) + '…' : t;
  }

  get mentionOptions(): { value: string; label: string }[] {
    return this.organizes.map(o => ({ value: o.id, label: o.name ?? o.id }));
  }

  open(taskId: string): void {
    this.taskHistory = [];
    this.loadCancel$.next();
    this.taskId = taskId;
    this.visible = true;
    this.loading = true;
    this.resetPreview();
    this.comments = [];
    this.directives = [];
    this.cdr.markForCheck();
    this.loadTask(taskId);
  }

  openWithTask(task: TaskInformationDto): void {
    this.taskHistory = [];
    this.loadCancel$.next();
    this.taskId = task.id;
    this.task = { ...new TaskInformationDto(), ...task };
    this.visible = true;
    this.loading = false; // task đã có sẵn, không cần spinner chờ
    this.resetPreview();
    this.comments = [];
    this.directives = [];
    this.coordinateOrgIds = (this.task.coordinateOrganizations ?? '')
      .split(',').map(s => s.trim()).filter(Boolean);
    this.dueDateModel = this.parseDate(this.task.dueDate);
    this.cdr.markForCheck();
    this.loadDocumentAndHistory();
  }

  openSubTask(subTask: any): void {
    this.taskHistory.push({ id: this.taskId, title: this.drawerTitle });
    this.navigateTo(subTask.id ?? subTask.Id ?? '');
  }

  close(): void {
    if (this.taskHistory.length > 0) {
      const parent = this.taskHistory.pop()!;
      this.navigateTo(parent.id);
      return;
    }
    this.visible = false;
    this.task = new TaskInformationDto();
    this.taskHistory = [];
    this.newComment = '';
    this.commentPendingAttachments = [];
    this.directiveDraft = '';
    this.directiveMentions = [];
    this.directivePendingAttachments = [];
    this.progressReports = [];
    this.progressReportGroups = [];
    this.reportModalVisible = false;
    this.reportContent = '';
    this.reportPendingAttachments = [];
    this.resetPreview();
    this.cdr.markForCheck();
  }

  private navigateTo(taskId: string): void {
    this.loadCancel$.next();
    this.taskId = taskId;
    this.loading = true;
    this.receives = [];
    this.historyItems = [];
    this.comments = [];
    this.directives = [];
    this.newComment = '';
    this.commentPendingAttachments = [];
    this.directiveDraft = '';
    this.directiveMentions = [];
    this.directivePendingAttachments = [];
    this.resetPreview();
    this.cdr.markForCheck();
    this.loadTask(taskId);
  }

  showProposalButton(): boolean {
    return this.canPropose() || this.canResume();
  }

  canAccept(): boolean {
    return !!this.task.canAccept;
  }

  canRedispatch(): boolean {
    if (this.viewOnly) return false;
    return this.task.receiveAssignmentStatus === 2 && !isTaskTerminal(this.task.taskStatus);
  }

  openRedispatchModal(): void {
    this._activeReceiveForDispatch = null;
    const today = new Date();
    const defaults: Partial<ExtractedTask> = {
      taskContent: this.task.description || this.task.title || '',
      topicGroupId: this.task.topicGroupId ?? '',
      fieldId: this.task.fieldId ?? '',
      issuerOrganizationId: this.task.issuerOrganizationId ?? '',
      startDate: today,
      deadlineDate: this.task.dueDate ? new Date(this.task.dueDate) : null,
    };
    this.redispatchTaskModal?.openWithDefaults(1, defaults);
    this.cdr.markForCheck();
  }

  hasSubTaskForUnit(r: any): boolean {
    return !!(r.subTaskId ?? r.SubTaskId);
  }

  openReceiveUnitDetail(r: any): void {
    const subTaskId = r.subTaskId ?? r.SubTaskId;
    if (subTaskId) {
      this.openSubTask({ id: subTaskId });
    }
  }

  canRedispatchForUnit(r: any): boolean {
    if (this.viewOnly) return false;
    return this.userOrgIds.includes(r.organizationId)
      && r.assignmentStatus === AssignmentStatusCode.Accepted
      && !isTaskTerminal(this.task.taskStatus);
  }

  openRedispatchForUnit(r: any): void {
    this._activeReceiveForDispatch = r;
    const today = new Date();
    const defaults: Partial<ExtractedTask> = {
      taskContent: this.task.description || this.task.title || '',
      topicGroupId: this.task.topicGroupId ?? '',
      fieldId: this.task.fieldId ?? '',
      issuerOrganizationId: this.task.issuerOrganizationId ?? '',
      startDate: today,
      deadlineDate: this.task.dueDate ? new Date(this.task.dueDate) : null,
    };
    this.redispatchTaskModal?.openWithDefaults(1, defaults);
    this.cdr.markForCheck();
  }

  onRedispatchSave(task: ExtractedTask): void {
    const leadIds = task.leadOrganizationIds ?? [];
    const coordIds = (task.coordinateOrganizationIds ?? []).filter((id: string) => !leadIds.includes(id));
    if (!leadIds.length && !coordIds.length) {
      this.notification.warning('Cảnh cáo','Vui lòng chọn ít nhất một đơn vị thực hiện');
      return;
    }

    const dueDate = task.deadlineDate
      ? `${task.deadlineDate.getFullYear()}-${String(task.deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(task.deadlineDate.getDate()).padStart(2, '0')}`
      : null;

    const parentReceiveId = this._activeReceiveForDispatch?.id ?? this.task.receiveId ?? (this.task as any).ReceiveId ?? '';

    const request: GiaoTiepRequestDto = {
      parentTaskId: this.taskId,
      documentId: this.task.documentId ?? '',
      description: task.taskContent ?? '',
      title: (task.taskContent ?? '').slice(0, 200),
      topicGroupId: task.topicGroupId ?? '',
      fieldId: task.fieldId ?? '',
      leadOrganizationId: leadIds.join(','),
      coordinateOrganizations: coordIds.join(','),
      priorityLevelId: task.priorityLevelId ?? '',
      dueDate,
      startDate: task.startDate
        ? `${task.startDate.getFullYear()}-${String(task.startDate.getMonth() + 1).padStart(2, '0')}-${String(task.startDate.getDate()).padStart(2, '0')}`
        : null,
      note: task.note ?? '',
      issuerOrganizationId: task.issuerOrganizationId ?? '',
      parentReceiveId,
      dispatchOrgId: task.dispatchOrgId ?? '',
      targets: [
        ...leadIds.map((id: string) => ({ organizationId: id, assignmentRole: 1, dueDate })),
        ...coordIds.map((id: string) => ({ organizationId: id, assignmentRole: 2, dueDate })),
      ],
    };

    this.redispatchSaving = true;
    this.cdr.markForCheck();

    this.dispatchService.giaoTiep(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this._activeReceiveForDispatch = null;
        this.redispatchSaving = false;
        this.saved.emit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.redispatchSaving = false;
        this.cdr.markForCheck();
      },
    });
  }

  canPropose(): boolean {
    return !!this.task.canPropose;
  }

  canResume(): boolean {
    return !!this.task.canResume;
  }

  acceptTask(): void {
    if (!this.task.receiveId) { this.notification.warning('Cảnh cáo','Không tìm thấy bản giao việc'); return; }
    this.receiveService.accept(this.task.receiveId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadTask(this.taskId);
        this.saved.emit();
      },
    });
  }

  resumeTask(): void {
    if (!this.task.receiveId) { this.notification.warning('Cảnh cáo','Không tìm thấy bản giao việc'); return; }
    this.workflowService.resume({ taskId: this.taskId, receiveId: this.task.receiveId, note: '', attachmentFileIds: [] })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.notification.success('Thành công','Đã tiếp tục nhiệm vụ');
          this.loadTask(this.taskId);
          this.saved.emit();
        },
      });
  }

  openProposalModal(kind: 'complete' | 'extend' | 'pause' | 'stop'): void {
    this.proposalKind = kind;
    this.proposalNote = '';
    this.proposalNewDueDate = null;
    this.proposalAttachments = [];
    this.proposalModalVisible = true;
    this.cdr.markForCheck();
  }

  closeProposalModal(): void {
    this.proposalModalVisible = false;
    this.cdr.markForCheck();
  }

  submitProposal(): void {
    if (this.proposalKind === 'extend' && !this.proposalNewDueDate) {
      this.notification.warning('Cảnh cáo','Vui lòng chọn ngày gia hạn');
      return;
    }
    if (this.proposalKind === 'extend' && this.proposalNewDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(this.proposalNewDueDate);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) {
        this.notification.warning('Cảnh cáo', 'Ngày gia hạn không được là ngày trong quá khứ');
        return;
      }
    }
    this.proposalSending = true;
    this.cdr.markForCheck();

    const payload = {
      taskId: this.taskId,
      note: this.proposalNote,
      newDueDate: this.proposalNewDueDate ? this.proposalNewDueDate.toISOString() : null,
      attachmentFileIds: this.proposalAttachments.map(f => f.fileId),
    };

    const call$ = this.proposalKind === 'complete' ? this.workflowService.proposeComplete(payload)
      : this.proposalKind === 'extend' ? this.workflowService.proposeExtend(payload)
      : this.proposalKind === 'pause' ? this.workflowService.proposePause(payload)
      : this.workflowService.proposeStop(payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.proposalSending = false;
        this.proposalModalVisible = false;
        this.loadTask(this.taskId);
        this.saved.emit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.proposalSending = false;
        this.cdr.markForCheck();
      },
    });
  }

  disablePastDates = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  onProposalFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    (event.target as HTMLInputElement).value = '';
    this.proposalUploading = true;
    this.cdr.markForCheck();
    this.fileService.uploadFiles(files, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const uploaded: any[] = res?.data ?? res ?? [];
        const mapped: TaskDiscussAttachment[] = uploaded
          .map((f: any) => ({ fileId: f.id ?? f.Id, fileName: f.fileName ?? f.FileName ?? 'file', icon: f.icon ?? f.Icon, fileSize: f.fileSize ?? f.FileSize }))
          .filter(f => !!f.fileId);
        this.proposalAttachments = [...this.proposalAttachments, ...mapped];
        this.proposalUploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.proposalUploading = false;
        this.notification.error('Thất bại','Upload file thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  removeProposalFile(f: TaskDiscussAttachment): void {
    this.proposalAttachments = this.proposalAttachments.filter(x => x.fileId !== f.fileId);
    this.cdr.markForCheck();
  }

  get proposalModalTitle(): string {
    const map: Record<string, string> = {
      complete: 'Đề xuất hoàn thành',
      extend:   'Đề xuất gia hạn',
      pause:    'Đề xuất tạm dừng',
      stop:     'Đề xuất dừng',
    };
    return map[this.proposalKind] ?? 'Đề xuất';
  }

  save(): void {
    if (!this.task.id) return;
    if (!this.task.description?.trim() && !this.task.title?.trim()) {
      this.notification.warning('Cảnh cáo','Vui lòng nhập nội dung nhiệm vụ');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    const payload: TaskInformationDto = {
      ...this.task,
      coordinateOrganizations: this.coordinateOrgIds.join(','),
      dueDate: this.dueDateModel
        ? this.dueDateModel.toISOString()
        : this.task.dueDate,
    };
    this.taskService.update(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.notification.success('Thành công','Đã cập nhật nhiệm vụ');
        this.loadHistory();
        this.saved.emit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  viewFile(file: ChatBotAttachmentDto, isOriginal: boolean): void {
    this.openOrActivatePdfTab(file, isOriginal);
  }

  trackPdfTab(_: number, tab: FilePreviewTab): string {
    return tab.fileId;
  }

  onPdfTabIndexChange(index: number): void {
    this.pdfPreviewSelectedIndex = index;
    this.syncActivePreviewFromTab();
    this.cdr.markForCheck();
  }

  closePdfPreviewTab({ index }: { index: number }): void {
    this.pdfPreviewTabs = this.pdfPreviewTabs.filter((_, i) => i !== index);
    if (this.pdfPreviewTabs.length === 0) {
      this.activePreviewFileId = null;
      this.cdr.markForCheck();
      return;
    }
    if (index < this.pdfPreviewSelectedIndex) {
      this.pdfPreviewSelectedIndex--;
    } else if (index === this.pdfPreviewSelectedIndex) {
      this.pdfPreviewSelectedIndex = Math.min(index, this.pdfPreviewTabs.length - 1);
    }
    this.syncActivePreviewFromTab();
    this.cdr.markForCheck();
  }

  downloadFile(a: ChatBotAttachmentDto, e?: Event): void {
    e?.stopPropagation();
    if (!a.id) return;
    this.fileService.download(a.id);
  }

  getFileIconUrl(file: ChatBotAttachmentDto): string {
    return file.icon || 'img/file.png';
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  getCreateByDisplay(file: ChatBotAttachmentDto): string {
    if (!file.createBy) return '';
    const acc = this.accounts.find((a: any) => a.userName === file.createBy);
    return acc?.fullName || file.createBy;
  }

  isFileProcessing(file: ChatBotAttachmentDto): boolean {
    return file.status === 'uploading' || file.status === 'ocr';
  }

  isOcrDone(file: ChatBotAttachmentDto): boolean {
    return file.status === 'ready' && (file.ocrTextLength ?? 0) > 0;
  }

  fileStatusLabel(file: ChatBotAttachmentDto): string {
    switch (file.status) {
      case 'uploading': return 'Đang upload...';
      case 'ocr': return 'Đang OCR...';
      case 'error': return file.error || 'Lỗi';
      default: return '';
    }
  }

  sendComment(): void {
    const content = this.newComment.trim();
    const attachmentIds = this.commentPendingAttachments.map(f => f.fileId);
    if ((!content && !attachmentIds.length) || !this.taskId || this.commentUploading || this.commentSending) return;

    this.commentSending = true;
    this.cdr.markForCheck();
    this.taskService.insertDiscuss({
      taskId: this.taskId,
      discussType: TASK_DISCUSS_TYPE.COMMENT,
      content,
      attachmentFileIds: attachmentIds,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.newComment = '';
        this.commentPendingAttachments = [];
        this.commentSending = false;
        this.loadDiscuss(TASK_DISCUSS_TYPE.COMMENT);
        this.cdr.markForCheck();
      },
      error: () => {
        this.commentSending = false;
        this.cdr.markForCheck();
      },
    });
  }

  onCommentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendComment();
    }
  }

  triggerCommentFilePicker(): void {
    this.commentFileInput?.nativeElement.click();
  }

  onCommentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.uploadDiscussFiles(files, 'comment');
  }

  removeCommentPendingFile(file: TaskDiscussAttachment): void {
    this.commentPendingAttachments = this.commentPendingAttachments.filter(f => f.fileId !== file.fileId);
    this.cdr.markForCheck();
  }

  previewDiscussFile(file: TaskDiscussAttachment, event?: Event): void {
    event?.stopPropagation();
    if (!file.fileId) return;
    this.openOrActivatePdfTabById(file.fileId, file.fileName || 'File', false);
  }

  downloadDiscussFile(file: TaskDiscussAttachment, event?: Event): void {
    event?.stopPropagation();
    this.fileService.download(file.fileId);
  }

  canSendComment(): boolean {
    return !!(this.newComment.trim() || this.commentPendingAttachments.length) && !this.commentUploading && !this.commentSending;
  }

  sendDirective(): void {
    const content = this.directiveDraft.trim();
    if (!content || !this.taskId || this.directiveSending) return;

    this.directiveSending = true;
    this.cdr.markForCheck();
    this.taskService.insertDiscuss({
      taskId: this.taskId,
      discussType: TASK_DISCUSS_TYPE.DIRECTIVE,
      content,
      mentionIds: [...this.directiveMentions],
      attachmentFileIds: this.directivePendingAttachments.map(f => f.fileId),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.directiveDraft = '';
        this.directiveMentions = [];
        this.directivePendingAttachments = [];
        this.directiveSending = false;
        this.loadDiscuss(TASK_DISCUSS_TYPE.DIRECTIVE);
        this.cdr.markForCheck();
      },
      error: () => {
        this.directiveSending = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDirectiveFilesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.uploadDiscussFiles(files, 'directive');
  }

  removeDirectivePendingFile(file: TaskDiscussAttachment): void {
    this.directivePendingAttachments = this.directivePendingAttachments.filter(f => f.fileId !== file.fileId);
    this.cdr.markForCheck();
  }

  getLeadOrgNameList(): string[] {
    const raw = this.task.leadOrganizationId ?? '';
    if (!raw.trim()) return [];
    return raw.split(',').map(id => id.trim()).filter(Boolean)
      .map(id => this.organizes.find(o => o.id === id)?.name ?? id);
  }

  getLeadOrgNames(): string {
    return this.getLeadOrgNameList().join(', ');
  }

  getCoordinateOrgNameList(): string[] {
    if (!this.coordinateOrgIds?.length) return [];
    return this.coordinateOrgIds
      .map(id => this.organizes.find(o => o.id === id)?.name ?? id);
  }

  getCoordinateOrgNames(): string {
    return this.getCoordinateOrgNameList().join(', ');
  }

  getOrgName(id: string | null | undefined): string {
    if (!id) return '';
    return this.organizes.find(o => o.id === id)?.name ?? id;
  }

  getTopicGroupName(id: string | null | undefined): string {
    if (!id) return '';
    return this.mainTasks.find(g => g.id === id)?.name ?? id;
  }

  getFieldName(code: string | null | undefined): string {
    if (!code) return '';
    return this.documentFields.find(f => f.code === code)?.name ?? code;
  }

  getPriorityName(code: string | null | undefined): string {
    if (!code) return '';
    return this.taskPriorities.find(p => p.code === code)?.name ?? PRIORITY_LABELS[code] ?? code;
  }

  getPriorityColor(code: string | null | undefined): string {
    if (!code) return '#d9d9d9';
    return this.taskPriorities.find(p => p.code === code)?.color ?? priorityFallbackColor(code);
  }

  getHistoryActionLabel(action: string | null | undefined): string {
    return TASK_LOG_STATUS.getLabel(action);
  }

  getHistoryContent(log: TaskHistoryItem): string {
    if (!log.description) return '';
    const label = TASK_LOG_STATUS.getDescriptionLabel(log.action);
    return label ? `${label}: ${log.description}` : log.description;
  }

  formatDateTime(v: string | null | undefined): string {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  getDiscussDisplayName(item: TaskDiscussItem): string {
    return item.fullName || item.createBy || '—';
  }

  getDiscussAvatarUrl(item: TaskDiscussItem): string | null {
    return this.global.getAccountAvatarUrl(item.createBy, item.avatarFileId);
  }

  getDiscussAvatarText(item: TaskDiscussItem): string {
    return this.global.getInitialsAvatar(this.getDiscussDisplayName(item));
  }

  getDiscussAvatarColor(item: TaskDiscussItem): string {
    return this.global.getAvatarColor(item.createBy || this.getDiscussDisplayName(item));
  }

  getCurrentUserAvatarUrl(): string | null {
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    return this.global.getAccountAvatarUrl(
      account?.userName,
      account?.avatarFileId,
      account?.avatarVersion,
    );
  }

  getCurrentUserAvatarText(): string {
    return this.global.getInitialsAvatar(this.currentUserName());
  }

  getCurrentUserAvatarColor(): string {
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    return this.global.getAvatarColor(account?.userName || this.currentUserName());
  }

  trackById = (_: number, x: { id: string }) => x.id;

  currentUserName(): string {
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    return account?.fullName || account?.userName || 'Tôi';
  }

  currentUserLogin(): string {
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    return account?.userName || account?.UserName || '';
  }

  isOwnDiscuss(item: TaskDiscussItem): boolean {
    const login = this.currentUserLogin();
    return !!login && !!item.createBy && item.createBy === login;
  }

  private mapDiscussItem(x: any): TaskDiscussItem {
    return {
      id: x.id ?? x.Id ?? '',
      taskId: x.taskId ?? x.TaskId,
      discussType: x.discussType ?? x.DiscussType,
      content: x.content ?? x.Content ?? '',
      mentionIdList: x.mentionIdList ?? x.MentionIdList ?? [],
      attachments: (x.attachments ?? x.Attachments ?? []).map((f: any) => ({
        fileId: f.fileId ?? f.FileId ?? '',
        fileName: f.fileName ?? f.FileName ?? '',
        icon: f.icon ?? f.Icon,
        fileSize: f.fileSize ?? f.FileSize,
      })),
      fullName: x.fullName ?? x.FullName,
      createBy: x.createBy ?? x.CreateBy,
      avatarFileId: x.avatarFileId ?? x.AvatarFileId,
      createDate: x.createDate ?? x.CreateDate,
    };
  }

  private loadAllDiscuss(): void {
    if (!this.taskId) return;
    this.discussLoading = true;
    this.cdr.markForCheck();
    forkJoin({
      comments: this.taskService.getDiscuss(this.taskId, TASK_DISCUSS_TYPE.COMMENT),
      directives: this.taskService.getDiscuss(this.taskId, TASK_DISCUSS_TYPE.DIRECTIVE),
    }).pipe(takeUntil(merge(this.loadCancel$, this.destroy$))).subscribe({
      next: ({ comments, directives }: any) => {
        const commentList: any[] = comments?.data ?? comments ?? [];
        const directiveList: any[] = directives?.data ?? directives ?? [];
        this.comments = commentList.map(x => this.mapDiscussItem(x));
        this.directives = directiveList.map(x => this.mapDiscussItem(x));
        this.discussLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.comments = [];
        this.directives = [];
        this.discussLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ════════════════════════════════════════════════════════════
  // BÁO CÁO TIẾN ĐỘ
  // ════════════════════════════════════════════════════════════

  canStartWorking(): boolean {
    if (this.viewOnly) return false;
    return this.task.receiveAssignmentStatus === AssignmentStatusCode.Accepted;
  }

  startWorkingTask(): void {
    if (!this.task.receiveId) { this.notification.warning('Cảnh cáo', 'Không tìm thấy bản giao việc'); return; }
    this.receiveService.startWorking(this.task.receiveId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.loadTask(this.taskId); this.saved.emit(); },
    });
  }

  canReport(): boolean {
    if (this.viewOnly) return false;
    const s = this.task.receiveAssignmentStatus;
    if (s == null) return false;
    // Accepted (2) = chưa thực hiện; InProgress (10) = đang thực hiện; 4-7 = chờ phê duyệt
    return s === AssignmentStatusCode.Accepted
        || s === AssignmentStatusCode.InProgress
        || (s >= 4 && s <= 7);
  }

  openReportModal(): void {
    this.reportContent = '';
    this.reportPendingAttachments = [];
    this.reportModalVisible = true;
    this.cdr.markForCheck();
  }

  closeReportModal(): void {
    this.reportModalVisible = false;
    this.reportContent = '';
    this.reportPendingAttachments = [];
    this.cdr.markForCheck();
  }

  onReportFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.reportUploading = true;
    this.cdr.markForCheck();
    this.chatBotService.uploadAttachments(files, '', false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const items: any[] = res?.data?.attachments ?? res?.attachments ?? [];
        this.reportPendingAttachments = [
          ...this.reportPendingAttachments,
          ...items.map((a: any) => ({ fileId: a.id, fileName: a.fileName ?? a.id })),
        ];
        this.reportUploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.reportUploading = false;
        this.notification.error('Thất bại', 'Upload file thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  removeReportPendingFile(file: TaskDiscussAttachment): void {
    this.reportPendingAttachments = this.reportPendingAttachments.filter(f => f.fileId !== file.fileId);
    this.cdr.markForCheck();
  }

  submitProgressReport(): void {
    if (this.reportSending) return;
    this.reportSending = true;
    this.cdr.markForCheck();

    const payload = {
      taskId: this.taskId,
      reportContent: this.reportContent.trim() || undefined,
      attachmentFileIds: this.reportPendingAttachments.map(f => f.fileId),
    };

    this.progressReportService.add(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.reportSending = false;
        this.reportModalVisible = false;
        this.reportContent = '';
        this.reportPendingAttachments = [];
        this.loadProgressReports();
        this.cdr.markForCheck();
      },
      error: () => { this.reportSending = false; this.cdr.markForCheck(); },
    });
  }

  deleteProgressReport(id: string): void {
    this.progressReportService.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.loadProgressReports(); },
    });
  }

  reportStatusLabel(status?: string): string {
    if (status === 'on_time') return 'Đúng hạn';
    if (status === 'late') return 'Trễ hạn';
    return '';
  }

  reportStatusColor(status?: string): string {
    if (status === 'on_time') return 'success';
    if (status === 'late') return 'error';
    return 'default';
  }

  isOwnReport(report: any): boolean {
    const info = LocalStorageUtils.getItem('accountInfo') as any;
    const userName = (info?.userName ?? '').toLowerCase();
    return (report.createBy ?? '').toLowerCase() === userName;
  }

  private loadProgressReports(): void {
    if (!this.taskId) return;
    this.progressReportsLoading = true;
    this.cdr.markForCheck();
    this.progressReportService.getByTask(this.taskId)
      .pipe(takeUntil(merge(this.loadCancel$, this.destroy$)))
      .subscribe({
        next: (res: any) => {
          this.progressReports = Array.isArray(res) ? res : (res?.data ?? []);
          this.progressReportGroups = this.buildProgressReportGroups(this.progressReports);
          this.progressReportsLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.progressReports = [];
          this.progressReportGroups = [];
          this.progressReportsLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private buildProgressReportGroups(reports: any[]): { orgId: string; orgName: string; reports: any[] }[] {
    const map = new Map<string, { orgId: string; orgName: string; reports: any[] }>();
    for (const r of reports) {
      const key = r.reportingOrgId ?? '';
      if (!map.has(key))
        map.set(key, { orgId: key, orgName: r.reportingOrgName ?? r.reportingOrgId ?? 'Không xác định', reports: [] });
      map.get(key)!.reports.push(r);
    }
    return Array.from(map.values());
  }

  private loadDiscuss(type: number): void {
    if (!this.taskId) return;
    this.discussLoading = true;
    this.cdr.markForCheck();
    this.taskService.getDiscuss(this.taskId, type).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const list: any[] = res?.data ?? res ?? [];
        const mapped = list.map(x => this.mapDiscussItem(x));
        if (type === TASK_DISCUSS_TYPE.COMMENT) this.comments = mapped;
        else this.directives = mapped;
        this.discussLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        if (type === TASK_DISCUSS_TYPE.COMMENT) this.comments = [];
        else this.directives = [];
        this.discussLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private uploadDiscussFiles(files: File[], target: 'comment' | 'directive'): void {
    if (target === 'comment') this.commentUploading = true;
    else this.directiveUploading = true;
    this.cdr.markForCheck();

    this.fileService.uploadFiles(files, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const uploaded: any[] = res?.data ?? res ?? [];
        const mapped: TaskDiscussAttachment[] = uploaded.map((f: any) => ({
          fileId: f.id ?? f.Id,
          fileName: f.fileName ?? f.FileName ?? 'file',
          icon: f.icon ?? f.Icon,
          fileSize: f.fileSize ?? f.FileSize,
        })).filter(f => !!f.fileId);

        if (target === 'comment') {
          this.commentPendingAttachments = [...this.commentPendingAttachments, ...mapped];
          this.commentUploading = false;
        } else {
          this.directivePendingAttachments = [...this.directivePendingAttachments, ...mapped];
          this.directiveUploading = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        if (target === 'comment') this.commentUploading = false;
        else this.directiveUploading = false;
        this.notification.error('Thất bại','Upload file thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  private parseDate(v: string | null | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  private loadTask(taskId: string): void {
    this.taskService.detail(taskId).pipe(takeUntil(merge(this.loadCancel$, this.destroy$))).subscribe({
      next: (res: any) => {
        this.task = { ...new TaskInformationDto(), ...(res ?? {}) };
        this.coordinateOrgIds = (this.task.coordinateOrganizations ?? '')
          .split(',').map(s => s.trim()).filter(Boolean);
        this.dueDateModel = this.parseDate(this.task.dueDate);
        // Ẩn spinner ngay khi có task info — sub-data load song song ở nền
        this.loading = false;
        this.cdr.markForCheck();
        this.loadDocumentAndHistory();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getOrgNameById(id: string | null | undefined): string {
    if (!id) return '—';
    return this.organizes.find(o => o.id === id)?.name ?? id;
  }

  getAssignmentRoleLabel(role: number): string {
    const map: Record<number, string> = { 1: 'Chủ trì', 2: 'Phối hợp', 3: 'Theo dõi' };
    return map[role] ?? '—';
  }

  private loadDocumentAndHistory(): void {
    // Tất cả fires song song — không chờ nhau
    if (this.task.documentId) {
      this.docService.detail(this.task.documentId)
        .pipe(takeUntil(merge(this.loadCancel$, this.destroy$)), catchError(() => of(null)))
        .subscribe({ next: (doc: any) => { this.loadFiles(doc); this.cdr.markForCheck(); } });
    }
    this.loadHistory();
    this.loadAllDiscuss();
    this.loadReceives();
    this.loadProgressReports();
  }

  private loadReceives(): void {
    if (!this.taskId) return;
    this.receivesLoading = true;
    this.cdr.markForCheck();

    const parentReceiveId = this.task.receiveId ?? (this.task as any).ReceiveId;
    const req$ = this.receiveMode && parentReceiveId
      ? this.receiveService.downstream(parentReceiveId)
      : this.receiveService.byTask(this.taskId);

    req$.pipe(takeUntil(merge(this.loadCancel$, this.destroy$)), catchError(() => of([])))
      .subscribe({
        next: (res: any) => {
          this.receives = Array.isArray(res) ? res : (res?.data ?? []);
          this.receivesLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.receives = [];
          this.receivesLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadHistory(): void {
    if (!this.taskId) return;
    this.workflowService.historyByTask(this.taskId).pipe(takeUntil(merge(this.loadCancel$, this.destroy$))).subscribe({
      next: (history: any) => {
        const list: any[] = history?.data ?? history ?? [];
        this.historyItems = list.map((x: any) => ({
          id: x.id,
          fullName: [x.actorFullName ?? x.actorUserId ?? '', x.actorOrgName ? `(${x.actorOrgName})` : ''].filter(Boolean).join(' '),
          action: x.action,
          actionLabel: x.actionLabel,
          description: x.note ?? x.description ?? '',
          createDate: x.createDate,
          newDeadline: x.newDeadline,
        }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.historyItems = [];
        this.cdr.markForCheck();
      },
    });
  }

  private loadFiles(doc: any): void {
    this.originalFile = null;
    this.attachmentFiles = [];
    if (!doc) return;

    this.task.documentNumber = doc.documentNumber ?? this.task.documentNumber;
    this.task.documentSymbol = doc.documentSymbol ?? this.task.documentSymbol;
    this.task.documentSubject = doc.subject ?? this.task.documentSubject;
    this.task.issuerOrganizationId = doc.issuerOrganizationId ?? this.task.issuerOrganizationId;

    const resolveOriginal = (referenceList: any[]) => {
      if (!doc.originalFileId) return;

      const inReference = referenceList.find(f => (f.id ?? f.Id) === doc.originalFileId);
      if (inReference) {
        this.setOriginalFileFromDto(inReference);
        return;
      }

      this.fileService.getById(doc.originalFileId).pipe(
        takeUntil(merge(this.loadCancel$, this.destroy$)),
        catchError(() => of(null)),
      ).subscribe((file) => {
        if (file) {
          this.setOriginalFileFromDto(file);
          return;
        }
        this.loadOriginalFileViaAttachmentStatus(doc.originalFileId);
      });
    };

    if (doc.referenceFileId) {
      this.fileService.getByRefrence(doc.referenceFileId).pipe(
        takeUntil(merge(this.loadCancel$, this.destroy$)),
        catchError(() => of([])),
      ).subscribe((files) => {
        const list = Array.isArray(files) ? files : [];
        this.attachmentFiles = list
          .filter(f => (f.id ?? f.Id) !== doc.originalFileId)
          .map(f => this.enrichAttachment(this.mapFileDtoToAttachment(f)));
        if (!doc.originalFileId) this.initDefaultPreviewTab();
        resolveOriginal(list);
        this.cdr.markForCheck();
      });
    } else {
      this.attachmentFiles = [];
      if (!doc.originalFileId) this.initDefaultPreviewTab();
      resolveOriginal([]);
    }
  }

  private setOriginalFileFromDto(fileDto: any): void {
    const item = this.enrichAttachment(this.mapFileDtoToAttachment({ ...fileDto, status: 'ready' }));
    this.originalFile = item;
    if (item.status === 'ready') this.initDefaultPreviewTab();
    this.enrichOriginalOcrStatus(item.id);
    this.cdr.markForCheck();
  }

  private loadOriginalFileViaAttachmentStatus(fileId: string): void {
    this.chatBotService.getAttachmentStatus(fileId).pipe(
      takeUntil(merge(this.loadCancel$, this.destroy$)),
      catchError(() => of(null)),
    ).subscribe((data) => {
      const item = this.mapToAttachment(data);
      if (!item) {
        this.originalFile = this.enrichAttachment(this.mapFileDtoToAttachment({
          id: fileId,
          fileName: 'Văn bản gốc',
          status: 'ready',
        }));
        this.initDefaultPreviewTab();
        this.cdr.markForCheck();
        return;
      }
      this.originalFile = this.enrichAttachment(item);
      if (this.originalFile.status === 'ready') this.initDefaultPreviewTab();
      this.cdr.markForCheck();
    });
  }

  private enrichOriginalOcrStatus(fileId: string): void {
    if (!fileId) return;
    this.chatBotService.getAttachmentStatus(fileId).pipe(
      takeUntil(merge(this.loadCancel$, this.destroy$)),
      catchError(() => of(null)),
    ).subscribe((data) => {
      const item = this.mapToAttachment(data);
      if (!item || this.originalFile?.id !== fileId) return;
      this.originalFile = this.enrichAttachment({
        ...this.originalFile,
        status: item.status,
        ocrTextLength: item.ocrTextLength,
        error: item.error,
      });
      this.cdr.markForCheck();
    });
  }

  private mapToAttachment(data: any): ChatBotAttachmentDto | null {
    if (!data) return null;
    const d = data.data ?? data;
    if (!d?.id && !d?.Id) return null;
    return this.mapFileDtoToAttachment(d);
  }

  private mapFileDtoToAttachment(f: any): ChatBotAttachmentDto {
    const item = new ChatBotAttachmentDto();
    item.id = f.id ?? f.Id ?? '';
    item.fileName = f.fileName ?? f.FileName ?? '';
    item.fileSize = Number(f.fileSize ?? f.FileSize ?? 0);
    item.mimeType = f.mimeType ?? f.MimeType ?? '';
    item.extension = f.extension ?? f.extention ?? f.Extention ?? '';
    item.icon = f.icon ?? f.Icon ?? '';
    item.status = (f.status ?? f.Status ?? 'ready') as ChatBotAttachmentStatus;
    item.ocrTextLength = Number(f.ocrTextLength ?? f.OcrTextLength ?? 0);
    item.createDate = f.createDate ?? f.CreateDate ?? '';
    item.createBy = f.createBy ?? f.CreateBy ?? '';
    item.conversationId = f.conversationId ?? f.ConversationId ?? '';
    item.error = f.error ?? f.Error ?? null;
    return item;
  }

  private enrichAttachment(item: ChatBotAttachmentDto): ChatBotAttachmentDto {
    if (item.createBy) return item;
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    const createBy = account?.fullName || account?.userName || account?.UserName || '';
    return createBy ? { ...item, createBy } : item;
  }

  private initDefaultPreviewTab(): void {
    if (this.pdfPreviewTabs.length > 0) return;
    if (this.originalFile?.id && this.originalFile.status === 'ready') {
      this.openOrActivatePdfTab(this.originalFile, true);
      return;
    }
    const first = this.attachmentFiles.find(a => a.id && a.status === 'ready');
    if (first) this.openOrActivatePdfTab(first, false);
  }

  private openOrActivatePdfTab(file: ChatBotAttachmentDto, isOriginal: boolean): void {
    if (!file.id || file.status !== 'ready') return;
    this.openOrActivatePdfTabById(file.id, file.fileName || 'File', isOriginal);
  }

  private openOrActivatePdfTabById(fileId: string, fileName: string, isOriginal: boolean): void {
    const idx = this.pdfPreviewTabs.findIndex(t => t.fileId === fileId);
    if (idx >= 0) {
      this.pdfPreviewSelectedIndex = idx;
      this.syncActivePreviewFromTab();
      this.cdr.markForCheck();
      return;
    }
    this.pdfPreviewTabs = [...this.pdfPreviewTabs, this.createPdfPreviewTab(fileId, fileName, isOriginal)];
    this.pdfPreviewSelectedIndex = this.pdfPreviewTabs.length - 1;
    this.syncActivePreviewFromTab();
    this.cdr.markForCheck();
  }

  private createPdfPreviewTab(fileId: string, fileName: string, isOriginal: boolean): FilePreviewTab {
    const name = fileName || 'File';
    return {
      fileId,
      fileName: name,
      title: dcFilePreviewTabTitle(name),
      isOriginal,
    };
  }

  private syncActivePreviewFromTab(): void {
    const tab = this.pdfPreviewTabs[this.pdfPreviewSelectedIndex];
    this.activePreviewFileId = tab?.fileId ?? null;
  }

  private clearPdfPreviewTabs(): void {
    this.pdfPreviewTabs = [];
    this.pdfPreviewSelectedIndex = 0;
    this.activePreviewFileId = null;
  }

  private resetPreview(): void {
    this.clearPdfPreviewTabs();
    this.originalFile = null;
    this.attachmentFiles = [];
  }

  private loadMissingMasterData(): void {
    const load = (svc: any, target: 'mainTasks' | 'organizes' | 'taskPriorities' | 'documentFields') => {
      if ((this[target] as any[]).length) return;
      svc.search({ isPaging: false } as any).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: any) => { this[target] = r?.data ?? r ?? []; this.cdr.markForCheck(); },
      });
    };
    load(this.organizeService, 'organizes');
    load(this.mainTaskService, 'mainTasks');
    load(this.taskPriorityService, 'taskPriorities');
    load(this.fieldService, 'documentFields');
    if (!this.accounts.length) {
      this.accountService.listUsers().pipe(takeUntil(this.destroy$)).subscribe({
        next: (list) => { this.accounts = list; this.cdr.markForCheck(); },
      });
    }
  }

  docSidebarVisible = false;
  openFromSidebar(item: any): void {
    if (item.id === this.taskId) return;
    this.taskHistory = [];
    this.loadCancel$.next();
    this.taskId = item.id;
    this.loading = true;
    this.receives = [];
    this.historyItems = [];
    this.comments = [];
    this.directives = [];
    this.newComment = '';
    this.commentPendingAttachments = [];
    this.directiveDraft = '';
    this.directiveMentions = [];
    this.directivePendingAttachments = [];
    this.resetPreview();
    this.cdr.markForCheck();
    this.loadTask(item.id);
  }

  formatDocNumber(item: TaskInformationDto): string {
    return item.documentNumber || item.documentSymbol || '';
  }

  // ── Drawer action modal ───────────────────────────────────────────
openApproveFromDrawer(): void {
  this.drawerActiveAction = 'approve';
  this.resetDrawerActionModal();
  this.drawerActionModalVisible = true;
  this.cdr.markForCheck();
}

openRejectFromDrawer(): void {
  this.drawerActiveAction = 'reject';
  this.resetDrawerActionModal();
  this.drawerActionModalVisible = true;
  this.cdr.markForCheck();
}

closeDrawerActionModal(): void {
  this.drawerActionModalVisible = false;
  this.cdr.markForCheck();
}

get drawerActionModalTitle(): string {
  if (!this.proposal) return '';
  const typeLabel = this.proposalTypeLabels[this.proposal.proposalType] ?? '';
  return this.drawerActiveAction === 'approve'
    ? `Phê duyệt: ${typeLabel}`
    : `Từ chối: ${typeLabel}`;
}

get isDrawerExtendApproval(): boolean {
  return this.drawerActiveAction === 'approve'
    && (this.proposal?.proposalType as number) === ProposalTypeCode.Extend;
}

submitDrawerAction(): void {
  if (this.drawerActiveAction === 'reject' && !this.drawerActionNote.trim()) {
    this.notification.warning('Cảnh cáo', 'Vui lòng nhập lý do từ chối');
    return;
  }
  if (this.isDrawerExtendApproval && !this.drawerExtendUseProposedDate && !this.drawerExtendAdjustedDueDate) {
    this.notification.warning('Cảnh cáo', 'Vui lòng chọn ngày hoàn thành mới');
    return;
  }
  if (!this.proposal) return;

  this.drawerActionSending = true;
  this.cdr.markForCheck();

  const base: TaskApprovalDto = {
    taskId: this.proposal.taskId,
    receiveId: this.proposal.receiveId,
    note: this.drawerActionNote,
    attachmentFileIds: this.drawerActionAttachments.map(f => f.fileId),
  };

  let call$;
  if (this.drawerActiveAction === 'reject') {
    call$ = this.drawerRejectCall(base);
  } else if (this.isDrawerExtendApproval) {
    const extendDto: TaskApproveExtendDto = {
      ...base,
      useProposedDate: this.drawerExtendUseProposedDate,
      adjustedDueDate: this.drawerExtendAdjustedDueDate
        ? this.drawerExtendAdjustedDueDate.toISOString()
        : null,
      adjustReason: this.drawerExtendAdjustReason,
    };
    call$ = this.workflowService.approveExtend(extendDto);
  } else {
    call$ = this.drawerApproveCall(base);
  }

  call$.pipe(takeUntil(this.destroy$)).subscribe({
    next: () => {
      this.drawerActionSending = false;
      this.drawerActionModalVisible = false;
      this.notification.success(
        'Thành công',
        this.drawerActiveAction === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối',
      );
      this.actionDone.emit();
      this.close();
      this.cdr.markForCheck();
    },
    error: () => {
      this.drawerActionSending = false;
      this.cdr.markForCheck();
    },
  });
}

private drawerApproveCall(base: TaskApprovalDto) {
  const t = this.proposal!.proposalType as number;
  if (t === ProposalTypeCode.Complete) return this.workflowService.approveComplete(base);
  if (t === ProposalTypeCode.Pause)    return this.workflowService.approvePause(base);
  return this.workflowService.approveStop(base);
}

private drawerRejectCall(base: TaskApprovalDto) {
  const t = this.proposal!.proposalType as number;
  if (t === ProposalTypeCode.Complete) return this.workflowService.rejectComplete(base);
  if (t === ProposalTypeCode.Extend)   return this.workflowService.rejectExtend(base);
  if (t === ProposalTypeCode.Pause)    return this.workflowService.rejectPause(base);
  return this.workflowService.rejectStop(base);
}

onDrawerActionFilesSelected(event: Event): void {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  if (!files.length) return;
  (event.target as HTMLInputElement).value = '';
  this.drawerActionUploading = true;
  this.cdr.markForCheck();
  this.fileService.uploadFiles(files, false).pipe(takeUntil(this.destroy$)).subscribe({
    next: (res: any) => {
      const uploaded: any[] = res?.data ?? res ?? [];
      const mapped: TaskDiscussAttachment[] = uploaded
        .map((f: any) => ({
          fileId: f.id ?? f.Id,
          fileName: f.fileName ?? f.FileName ?? 'file',
          icon: f.icon,
          fileSize: f.fileSize,
        }))
        .filter(f => !!f.fileId);
      this.drawerActionAttachments = [...this.drawerActionAttachments, ...mapped];
      this.drawerActionUploading = false;
      this.cdr.markForCheck();
    },
    error: () => {
      this.drawerActionUploading = false;
      this.notification.error('Lỗi', 'Upload file thất bại');
      this.cdr.markForCheck();
    },
  });
}

removeDrawerActionFile(f: TaskDiscussAttachment): void {
  this.drawerActionAttachments = this.drawerActionAttachments.filter(x => x.fileId !== f.fileId);
  this.cdr.markForCheck();
}

formatDate(v: string | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN');
}

private resetDrawerActionModal(): void {
  this.drawerActionNote = '';
  this.drawerActionAttachments = [];
  this.drawerExtendUseProposedDate = true;
  this.drawerExtendAdjustedDueDate = null;
  this.drawerExtendAdjustReason = '';
}
}
