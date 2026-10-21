import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, EventEmitter, Input, NgZone,
  OnDestroy, Output, ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DcFilePreview } from '../../../document-workflow/components/dc-file-preview/dc-file-preview';
import { dcFilePreviewTabTitle } from '../../../document-workflow/components/dc-file-preview-tabs/dc-file-preview-tabs.model';
import { Subject, Subscription, catchError, forkJoin, map, merge, of, switchMap, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { EnvironmentService } from '../../../../core';
import { readCssSystemPrimary } from '../../../../core/utils/theme-tokens';
import { TaskDocumentService } from '../../services/task-document.service';
import { TaskDocumentDto, TaskInformationDto, TaskStatusCode } from '../../models';
import { TaskInformationService } from '../../services/task-information.service';
import { TaskDispatchService } from '../../services/task-dispatch.service';
import { ChatBotService, TaskExtractionStreamEvent } from '../../../chat-bot/services/chat-bot.service';
import { ChatBotAttachmentDto, ChatBotAttachmentStatus } from '../../../chat-bot/models';
import { FileService } from '../../../../shared/services/file.service';
import { LocalStorageUtils } from '../../../../shared/utils';
import {
  emptyExtractedDoc, emptyExtractedTask, ExtractedDoc, ExtractedTask, OcrStage,
  mergeExtractedTask, mapExtractedTaskToInformationDto,
  DispatchRequestDto, DispatchTargetDto,
} from '../../models';
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS,
  AttachmentFileStatus, OcrStageKey, TaskReceiveAssignmentRole,
  DocumentProcessingStatusCode,
} from '../../models';
import { TaskEditModal } from '../task-edit-modal/task-edit-modal';
import { TaskCreateModal } from '../task-create-modal/task-create-modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AccountService } from '../../../system-manager/services/account.service';
import { IssuingOrgService } from '../../../master-data/services/issuing-org.service';

type FileUploadTarget = 'original' | 'attachment';

interface FilePreviewTab {
  fileId: string;
  fileName: string;
  title: string;
  isOriginal: boolean;
}

@Component({
  selector: 'app-task-document-drawer',
  standalone: true,
  imports: [SharedModules, TaskEditModal, TaskCreateModal, DcFilePreview],
  templateUrl: './task-document-drawer.html',
  styleUrl: './task-document-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDocumentDrawer implements OnDestroy {
  private destroy$ = new Subject<void>();
  private loadCancel$ = new Subject<void>();
  @ViewChild('dropZoneFileInput') dropZoneFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('attachmentFileInput') attachmentFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('createTaskModal') createTaskModal?: TaskCreateModal;

  @Input() documentTypes: any[] = [];
  @Input() documentFields: any[] = [];
  @Input() urgencyLevels: any[] = [];
  @Input() securityLevels: any[] = [];
  @Input() organizes: any[] = [];
  @Input() mainTasks: any[] = [];
  @Input() taskPriorities: any[] = [];
  @Input() account: any[] = [];
  /** Tạo nhiệm vụ thủ công — không OCR, không bắt buộc file gốc */
  @Input() manualMode = false;

  docAccounts: any[] = [];
  docAccountOptions: { label: string; value: string }[] = [];

  readonly SYSTEM_PRIMARY = readCssSystemPrimary();
  readonly fileStatus = AttachmentFileStatus;
  readonly ocrStage = OcrStageKey;
  TaskStatusCode = TaskStatusCode
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  readonly taskStatusOptions = Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  allTasksSelected = false;

  @Output() saved = new EventEmitter<{ id: string; isNew: boolean }>();
  @Output() closed = new EventEmitter<void>();
  @Output() routeSync = new EventEmitter<{ taskId?: string | null; taskIndex?: number | null }>();

  private pendingTaskRoute?: { taskId?: string | null; taskIndex?: number | null };

  visible = false;
  stage: OcrStage = OcrStageKey.Idle;
  stageMessage = '';
  analysisProgress = 0;
  chunkProgress = { current: 0, total: 0, tasksFound: 0 };
  chunkWarnings: string[] = [];

  originalFile: ChatBotAttachmentDto | null = null;
  attachmentFiles: ChatBotAttachmentDto[] = [];
  previewSource: 'original' | 'attachment' = 'original';
  activePreviewFileId: string | null = null;

  isDragOver = false;
  private uploadPollers = new Map<string, any>();
  private streamSub: Subscription | null = null;
  private progressTimer: any = null;

  editDoc: ExtractedDoc = emptyExtractedDoc();
  tasks: ExtractedTask[] = [];
  rawText = '';
  parseError = '';
  resultTabIndex = 0;
  taskContentExpanded = false;
  selectedTaskIndex: number | null = null;

  taskEditVisible = false;
  editingTask: ExtractedTask | null = null;
  editingTaskIndex: number | null = null;

  bulkEditVisible = false;
  bulkEditForm: {
    topicGroupId?: string;
    leadOrganizationIds?: string[];
    coordinateOrganizationIds?: string[];
    deadlineDate?: Date | null;
    priorityLevelId?: string;
  } = {};

  pdfPreviewTabs: FilePreviewTab[] = [];
  pdfPreviewSelectedIndex = 0;

  highlightDrawerVisible = false;
  highlightPdfUrl: SafeResourceUrl | null = null;
  highlightPdfIframeId = '';
  highlightTask: ExtractedTask | null = null;
  private highlightPdfLoadedFileId: string | null = null;

  editingItem: TaskDocumentDto | null = null;

  readonly TAB_INFO = 0;
  readonly TAB_TASKS = 1;
  readonly acceptedExtensions = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.webp';
  readonly maxFileSizeBytes = 50 * 1024 * 1024;

  get isAnalyzing(): boolean {
    return this.stage === OcrStageKey.Uploading || this.stage === OcrStageKey.Ocr || this.stage === OcrStageKey.Streaming;
  }

  get canStart(): boolean {
    if (this.manualMode) return false;
    if (this.isAnalyzing) return false;
    return this.originalFile?.status === AttachmentFileStatus.Ready;
  }

  get canSaveDocument(): boolean {
    if (this.isAnalyzing) return false;
    if (this.manualMode) {
      return !!(this.editDoc.title?.trim() || this.editDoc.documentNumber?.trim()) || this.tasks.length > 0;
    }
    return this.stage === OcrStageKey.Done || this.tasks.length > 0
      || !!this.editDoc.title || !!this.editingItem;
  }

  get isEditMode(): boolean {
    return !!this.editingItem?.id;
  }

  get canMarkCompleted(): boolean {
    return this.isEditMode
      && !this.isAnalyzing
      && this.editingItem?.processingStatus !== DocumentProcessingStatusCode.AssignmentCompleted
      && this.editingItem?.processingStatus !== DocumentProcessingStatusCode.Completed;
  }

  get selectedTaskCount(): number {
    return this.tasks.filter(t => t.selected && (t.status ?? 0) === 0).length;
  }

  get topicGroupOptions(): { value: string; label: string }[] {
    return (this.mainTasks ?? []).map(g => ({
      value: g.id ?? g.code ?? '',
      label: g.name ?? '',
    }));
  }

  readonly userOrgIds: string[] = (() => {
    const info = LocalStorageUtils.getItem('accountInfo') as any;
    const ids: string[] = Array.isArray(info?.orgIds) ? info.orgIds : [];
    const primary: string = info?.orgId ?? '';
    return ids.length ? ids : (primary ? [primary] : []);
  })();

  issuingOrgs: any[] = [];

  constructor(
    private env: EnvironmentService,
    private docService: TaskDocumentService,
    private taskInfoService: TaskInformationService,
    private dispatchService: TaskDispatchService,
    private chatBotService: ChatBotService,
    private fileService: FileService,
    private accountService: AccountService,
    private issuingOrgService: IssuingOrgService,
    private sanitizer: DomSanitizer,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private notification: NzNotificationService
  ) {
    this.loadIssuingOrgs();
  }

  private loadIssuingOrgs(): void {
    if (this.issuingOrgs.length) return;
    this.issuingOrgService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.issuingOrgs = Array.isArray(res) ? res : (res?.data ?? []);
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.loadCancel$.next();
    this.loadCancel$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  open(item?: TaskDocumentDto): void {
    this.resetState();
    this.loadDocAccounts();
    if (item?.id) {
      this.editingItem = { ...item };
      this.loadItemIntoEditDoc(item);
      this.loadDocumentDetails(item.id, item.referenceFileId ?? undefined);
    }
    this.visible = true;
    this.cdr.markForCheck();
  }

  private readonly DOC_SIGNER_TITLES = ['BO_TRUONG', 'THU_TRUONG'];
  private readonly DOC_TITLE_NAMES: Record<string, string> = {
    BO_TRUONG: 'Bộ trưởng',
    THU_TRUONG: 'Thứ trưởng',
  };

  private loadDocAccounts(orgId?: string): void {
    this.accountService.getAllByOrg(orgId, this.DOC_SIGNER_TITLES).pipe(takeUntil(this.destroy$)).subscribe({
      next: (list: any[]) => {
        this.docAccounts = list;
        this.docAccountOptions = list.map(a => {
          const name = a.fullName || a.userName;
          const titleName = a.titleCode ? this.DOC_TITLE_NAMES[a.titleCode] : '';
          return { value: a.userName, label: titleName ? `${name} - ${titleName}` : name };
        });
        this.cdr.markForCheck();
      },
      error: () => { this.docAccounts = []; this.docAccountOptions = []; },
    });
  }

  openForRoute(docId: string, opts?: { taskId?: string | null; taskIndex?: number | null }): void {
    this.pendingTaskRoute = opts && (opts.taskId || opts.taskIndex != null) ? opts : undefined;
    if (docId === 'new') {
      if (this.visible && !this.isEditMode) {
        this.tryOpenTaskFromRoute();
        return;
      }
      this.open();
      return;
    }
    this.openByDocumentId(docId, opts);
  }

  openByDocumentId(docId: string, opts?: { taskId?: string | null; taskIndex?: number | null }): void {
    this.pendingTaskRoute = opts && (opts.taskId || opts.taskIndex != null) ? opts : undefined;
    if (this.visible && this.editingItem?.id === docId) {
      this.tryOpenTaskFromRoute();
      return;
    }
    this.resetState();
    this.loadDocAccounts();
    this.editingItem = { id: docId } as TaskDocumentDto;
    this.visible = true;
    this.loadDocumentDetails(docId);
    this.cdr.markForCheck();
  }

  closeIfOpen(): void {
    if (!this.visible) return;
    this.cleanup();
    this.visible = false;
    this.taskEditVisible = false;
    this.editingTask = null;
    this.editingTaskIndex = null;
    this.pendingTaskRoute = undefined;
    this.cdr.markForCheck();
  }

  close(): void {
    this.cleanup();
    this.visible = false;
    this.closed.emit();
    this.cdr.markForCheck();
  }

  private cleanup(): void {
    this.cancelStream();
    for (const id of this.uploadPollers.keys()) this.stopPolling(id);
  }

  private resetState(): void {
    this.loadCancel$.next();
    this.stage = OcrStageKey.Idle;
    this.stageMessage = '';
    this.analysisProgress = 0;
    this.chunkProgress = { current: 0, total: 0, tasksFound: 0 };
    this.chunkWarnings = [];
    this.originalFile = null;
    this.attachmentFiles = [];
    this.previewSource = 'original';
    this.activePreviewFileId = null;
    this.isDragOver = false;
    this.editDoc = emptyExtractedDoc();
    this.tasks = [];
    this.rawText = '';
    this.parseError = '';
    this.resultTabIndex = this.TAB_INFO;
    this.taskContentExpanded = false;
    this.selectedTaskIndex = null;
    this.taskEditVisible = false;
    this.editingTask = null;
    this.editingTaskIndex = null;
    this.clearPdfPreviewTabs();
    this.closeHighlightDrawer();
    this.editingItem = null;
    for (const id of this.uploadPollers.keys()) this.stopPolling(id);
    this.uploadPollers.clear();
    this.cancelStream();
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    this.handleOriginalFiles(files);
  }

  onOriginalFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.handleOriginalFiles(Array.from(input.files));
    input.value = '';
  }

  onAttachmentFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.handleAttachmentFiles(Array.from(input.files));
    input.value = '';
  }

  openDropZoneFilePicker(): void {
    this.dropZoneFileInput?.nativeElement.click();
  }

  openAttachmentFilePicker(): void {
    this.attachmentFileInput?.nativeElement.click();
  }

  onAttachmentAddClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.isAnalyzing) return;
    this.openAttachmentFilePicker();
  }

  private handleOriginalFiles(files: File[]): void {
    if (this.isAnalyzing) return;
    const accepted = files.filter(f => this.isAllowedExt(f.name) && f.size <= this.maxFileSizeBytes);
    if (!accepted.length) { this.notification.warning('Cảnh cáo','File không hợp lệ hoặc quá 50MB'); return; }
    this.uploadFiles([accepted[0]], 'original');
  }

  private handleAttachmentFiles(files: File[]): void {
    if (this.isAnalyzing) return;
    const accepted = files.filter(f => this.isAllowedExt(f.name) && f.size <= this.maxFileSizeBytes);
    if (!accepted.length) { this.notification.warning('Cảnh cáo','File không hợp lệ hoặc quá 50MB'); return; }
    this.uploadFiles(accepted, 'attachment');
  }

  private isAllowedExt(name: string): boolean {
    const idx = name.lastIndexOf('.');
    if (idx < 0) return false;
    return this.acceptedExtensions.split(',').includes(name.substring(idx).toLowerCase());
  }

  private uploadFiles(files: File[], target: FileUploadTarget): void {
    this.cdr.markForCheck();

    this.chatBotService.uploadAttachments(files, '', true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const items: ChatBotAttachmentDto[] = (res?.data?.attachments ?? res?.attachments ?? [])
          .map((item: ChatBotAttachmentDto) => this.enrichAttachment(item));

        if (target === 'original') {
          const item = items[0];
          if (item) {
            if (this.originalFile?.id) {
              this.removePdfTabByFileId(this.originalFile.id);
              this.deleteAttachmentQuiet(this.originalFile.id);
            }
            this.originalFile = item;
            if (item.status !== AttachmentFileStatus.Ready && item.status !== AttachmentFileStatus.Error) this.startPolling(item.id);
            else if (item.status === AttachmentFileStatus.Ready) this.initDefaultPreviewTab();
          }
        } else {
          for (const item of items) {
            this.attachmentFiles = [...this.attachmentFiles, item];
            if (item.status !== AttachmentFileStatus.Ready && item.status !== AttachmentFileStatus.Error) this.startPolling(item.id);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Thất bại','Upload thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  private enrichAttachment(item: ChatBotAttachmentDto): ChatBotAttachmentDto {
    const account = LocalStorageUtils.getItem('accountInfo') as any;
    const createBy = account?.fullName || account?.userName || account?.UserName || '';
    return { ...item, createBy: item.createBy || createBy };
  }

  private startPolling(id: string): void {
    if (this.uploadPollers.has(id)) return;
    const started = Date.now();
    const h = setInterval(() => {
      if (Date.now() - started > 90_000) { this.stopPolling(id); return; }
      this.chatBotService.getAttachmentStatus(id).subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          if (!d) return;
          this.ngZone.run(() => {
            this.applyAttachmentUpdate(id, this.enrichAttachment({ ...this.findAttachment(id), ...d } as ChatBotAttachmentDto));
            if (d.status === AttachmentFileStatus.Ready) {
              this.stopPolling(id);
              if (this.originalFile?.id === id) this.initDefaultPreviewTab();
            } else if (d.status === AttachmentFileStatus.Error) {
              this.stopPolling(id);
            }
            this.cdr.markForCheck();
          });
        },
      });
    }, 1500);
    this.uploadPollers.set(id, h);
  }

  private findAttachment(id: string): ChatBotAttachmentDto {
    if (this.originalFile?.id === id) return this.originalFile;
    return this.attachmentFiles.find(a => a.id === id) ?? new ChatBotAttachmentDto();
  }

  private applyAttachmentUpdate(id: string, item: ChatBotAttachmentDto): void {
    if (this.originalFile?.id === id) {
      this.originalFile = item;
      return;
    }
    const idx = this.attachmentFiles.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.attachmentFiles[idx] = item;
      this.attachmentFiles = [...this.attachmentFiles];
    }
  }

  private stopPolling(id: string): void {
    const h = this.uploadPollers.get(id);
    if (h) { clearInterval(h); this.uploadPollers.delete(id); }
  }

  private deleteAttachmentQuiet(id: string): void {
    this.stopPolling(id);
    this.chatBotService.deleteAttachment(id).subscribe({ error: () => { } });
  }

  removeOriginalFile(e?: Event): void {
    e?.stopPropagation();
    if (!this.originalFile?.id) return;
    const fileId = this.originalFile.id;
    this.stopPolling(fileId);
    this.chatBotService.deleteAttachment(fileId).subscribe({
      next: () => {
        this.removePdfTabByFileId(fileId);
        this.originalFile = null;
        this.notification.success('Thành công', 'Xóa văn bản gốc thành công');
        this.cdr.markForCheck();
      },
      error: () => {
        this.removePdfTabByFileId(fileId);
        this.originalFile = null;
        this.notification.error('Thất bại', 'Xóa văn bản gốc thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  removeAttachmentFile(a: ChatBotAttachmentDto, e?: Event): void {
    e?.stopPropagation();
    this.stopPolling(a.id);
    this.chatBotService.deleteAttachment(a.id).subscribe({
      next: () => {
        this.attachmentFiles = this.attachmentFiles.filter(x => x.id !== a.id);
        this.removePdfTabByFileId(a.id);
        this.notification.success('Thành công','Xóa thành công');
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.attachmentFiles = this.attachmentFiles.filter(x => x.id !== a.id);
        this.notification.success('Thất bại', err?.message ?? 'Xóa thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  downloadFile(a: ChatBotAttachmentDto, e?: Event): void {
    e?.stopPropagation();
    if (!a.id) return;
    this.fileService.download(a.id);
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

  private initDefaultPreviewTab(): void {
    if (this.pdfPreviewTabs.length > 0) return;
    if (this.originalFile?.id && this.originalFile.status === AttachmentFileStatus.Ready) {
      this.openOrActivatePdfTab(this.originalFile, true);
      return;
    }
    const first = this.attachmentFiles.find(
      a => a.id && a.status === AttachmentFileStatus.Ready,
    );
    if (first) this.openOrActivatePdfTab(first, false);
  }

  private openOrActivatePdfTab(file: ChatBotAttachmentDto, isOriginal: boolean): void {
    if (!file.id || file.status !== AttachmentFileStatus.Ready) return;
    const idx = this.pdfPreviewTabs.findIndex(t => t.fileId === file.id);
    if (idx >= 0) {
      this.pdfPreviewSelectedIndex = idx;
      this.syncActivePreviewFromTab();
      this.cdr.markForCheck();
      return;
    }
    this.pdfPreviewTabs = [...this.pdfPreviewTabs, this.createPdfPreviewTab(file, isOriginal)];
    this.pdfPreviewSelectedIndex = this.pdfPreviewTabs.length - 1;
    if (isOriginal) this.selectedTaskIndex = null;
    this.syncActivePreviewFromTab();
    this.cdr.markForCheck();
  }

  private createPdfPreviewTab(file: ChatBotAttachmentDto, isOriginal: boolean): FilePreviewTab {
    const fileId = file.id!;
    const name = file.fileName || 'File';
    return {
      fileId,
      fileName: name,
      title: dcFilePreviewTabTitle(name),
      isOriginal,
    };
  }

  private removePdfTabByFileId(fileId: string): void {
    const idx = this.pdfPreviewTabs.findIndex(t => t.fileId === fileId);
    if (idx >= 0) this.closePdfPreviewTab({ index: idx });
  }

  private syncActivePreviewFromTab(): void {
    const tab = this.pdfPreviewTabs[this.pdfPreviewSelectedIndex];
    if (!tab) {
      this.activePreviewFileId = null;
      return;
    }
    this.activePreviewFileId = tab.fileId;
    this.previewSource = tab.isOriginal ? 'original' : 'attachment';
  }

  private clearPdfPreviewTabs(): void {
    this.pdfPreviewTabs = [];
    this.pdfPreviewSelectedIndex = 0;
    this.activePreviewFileId = null;
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

  formatDateTime(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  getCreateByDisplay(file: ChatBotAttachmentDto): string {
    if (!file.createBy) return '';
    const acc = this.account.find((a: any) => a.userName === file.createBy);
    return acc?.fullName || file.createBy;
  }

  isOcrDone(file: ChatBotAttachmentDto): boolean {
    return file.status === AttachmentFileStatus.Ready && ((file.ocrTextLength ?? 0) > 0 || this.stage === OcrStageKey.Done);
  }

  fileStatusLabel(file: ChatBotAttachmentDto): string {
    switch (file.status) {
      case 'uploading': return 'Đang upload...';
      case 'ocr': return 'Đang OCR...';
      case 'error': return file.error || 'Lỗi';
      default: return '';
    }
  }

  isFileProcessing(file: ChatBotAttachmentDto): boolean {
    return file.status === AttachmentFileStatus.Uploading || file.status === AttachmentFileStatus.Ocr;
  }

  startAnalysis(): void {
    if (!this.canStart || !this.originalFile?.id) return;

    this.editDoc = emptyExtractedDoc();
    this.tasks = [];
    this.rawText = '';
    this.parseError = '';
    this.chunkWarnings = [];
    this.analysisProgress = 5;
    this.chunkProgress = { current: 0, total: 0, tasksFound: 0 };
    this.resultTabIndex = this.TAB_INFO;
    this.stage = OcrStageKey.Streaming;
    this.stageMessage = 'Đang bóc tách thông tin văn bản...';
    this.startProgressTimer();
    this.cdr.markForCheck();

    this.streamSub = this.chatBotService.extractTaskStream({
      type: 'upload',
      attachmentIds: [this.originalFile.id],
    }).subscribe({
      next: (ev) => this.ngZone.run(() => this.onStreamEvent(ev)),
      error: (err) => this.ngZone.run(() => {
        this.clearProgressTimer();
        this.stage = OcrStageKey.Error;
        this.stageMessage = 'Lỗi stream: ' + (err?.message ?? '');
        this.cdr.markForCheck();
      }),
    });
  }

  private onStreamEvent(ev: TaskExtractionStreamEvent): void {
    switch (ev.type) {
      case 'meta': {
        const total = ev.totalSections ?? ev.totalChunks ?? 0;
        if (total > 0) { this.chunkProgress = { current: 0, total, tasksFound: 0 }; this.analysisProgress = 15; }
        break;
      }
      case 'progress': {
        const current = ev.sectionIndex ?? ev.chunkIndex ?? 0;
        const total = ev.totalSections ?? ev.totalChunks ?? this.chunkProgress.total;
        const tasksFound = ev.tasksFound ?? 0;
        this.chunkProgress = { current, total, tasksFound };
        this.analysisProgress = total > 0 ? Math.min(90, 15 + (current / total) * 75) : this.analysisProgress;
        this.stageMessage = total > 1
          ? `Đang bóc tách... (${Math.max(0, current - 1)}/${Math.max(1, total - 1)} đoạn, ${tasksFound} công việc)`
          : `Đang bóc tách... (${tasksFound} công việc)`;
        break;
      }
      case 'result': {
        if (ev.document) this.applyDocumentFields(ev.document as any);
        break;
      }
      case 'task': {
        if (ev.task) {
          const t = ev.task as any;
          const dl = t.deadline ?? t.han_xu_ly ?? '';
          const regions = this.normalizeTaskRegions(t);
          const task: ExtractedTask = {
            ...emptyExtractedTask(this.tasks.length + 1),
            taskContent: t.taskContent ?? t.content ?? t.task_content ?? '',
            deadline: dl,
            deadlineDate: this.parseDeadlineToDate(dl),
            regions,
            pageWidth: Number(t.pageWidth ?? t.PageWidth) || undefined,
            pageHeight: Number(t.pageHeight ?? t.PageHeight) || undefined,
            status: 0,
            isFromDocument: true,
          };
          this.tasks = [...this.tasks, task];
          if (this.tasks.length === 1) this.resultTabIndex = this.TAB_TASKS;
          this.stageMessage = `Đang bóc tách... (${this.tasks.length} công việc)`;
        }
        break;
      }
      case 'warning': {
        if (ev.message) this.chunkWarnings = [...this.chunkWarnings, ev.message];
        break;
      }
      case 'error': {
        this.clearProgressTimer();
        this.stage = OcrStageKey.Error;
        this.stageMessage = 'Lỗi: ' + (ev.message ?? '');
        break;
      }
      case 'done': {
        if (this.stage !== OcrStageKey.Done) {
          this.clearProgressTimer();
          this.analysisProgress = 100;
          this.stage = OcrStageKey.Done;
          this.stageMessage = this.isEditMode ? '' : `Hoàn tất — ${this.tasks.length} công việc`;
          if (this.editingItem?.id && this.tasks.some(t => (t.regions?.length ?? 0) > 0)) {
            this.persistTasksToServer(this.editingItem.id);
          }
        }
        break;
      }
    }
    this.cdr.markForCheck();
  }

  private applyDocumentFields(d: any): void {
    const pick = (...keys: string[]): string => {
      for (const k of keys) {
        const v = d[k];
        if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };
    this.editDoc.title = pick('title', 'tieu_de', 'subject');
    this.editDoc.documentNumber = pick('documentNumber', 'so_hieu', 'document_number');
    this.editDoc.documentTypeId = this.resolveMasterField(
      this.documentTypes,
      pick('documentTypeCode', 'documentTypeId', 'documentTypeText', 'loai_van_ban', 'document_type'),
    );
    this.editDoc.fieldId = this.resolveMasterField(
      this.documentFields,
      pick('fieldCode', 'fieldId', 'fieldText', 'linh_vuc', 'field'),
    );
    this.editDoc.urgencyLevelId = this.resolveMasterField(
      this.urgencyLevels,
      pick('urgencyLevelCode', 'urgencyLevelId', 'urgencyLevelText', 'do_khan', 'urgency'),
      'THUONG',
    );
    this.editDoc.confidentialityLevelId = this.resolveMasterField(
      this.securityLevels,
      pick('confidentialLevelCode', 'confidentialityLevelId', 'confidentialLevelText', 'do_mat', 'confidential'),
      'THUONG',
    );
    this.editDoc.issuerOrganizationId = this.resolveOrganizeId(pick('issuingAgencyText', 'co_quan_ban_hanh', 'issuer', 'issuerOrganization'));
    this.editDoc.sendingAgencyText = pick('sendingAgencyText', 'noi_nhan', 'recipient', 'recipients');
    this.editDoc.issueDate = this.parseDeadlineToDate(pick('issueDate', 'ngay_ban_hanh', 'issue_date', 'issuedDate'));
    this.editDoc.effectiveDate = this.parseDeadlineToDate(pick('effectiveDate', 'ngay_hieu_luc', 'effective_date'));
    this.editDoc.expireDate = this.parseDeadlineToDate(pick('expireDate', 'ngay_het_hieu_luc', 'expire_date', 'expirationDate'));
    this.editDoc.summary = pick('summary', 'tom_tat', 'contentSummary', 'content_summary');
    this.cdr.markForCheck();
  }

  onTaskRowClick(task: ExtractedTask, index: number): void {
    this.openHighlightDrawer(task, index);
  }

  openHighlightDrawer(task: ExtractedTask, index: number): void {
    if (!this.canHighlight(task)) return;
    this.selectedTaskIndex = index;
    this.highlightTask = task;
    this.highlightDrawerVisible = true;
    const fileId = this.originalFile?.id;
    if (!fileId) return;
    this.setupHighlightPdf(fileId);
    this.cdr.markForCheck();
    this.postHighlightToIframe(this.highlightPdfIframeId, task);
  }

  closeHighlightDrawer(): void {
    this.highlightDrawerVisible = false;
    this.highlightTask = null;
    this.highlightPdfUrl = null;
    this.highlightPdfIframeId = '';
    this.highlightPdfLoadedFileId = null;
    this.cdr.markForCheck();
  }

  private setupHighlightPdf(fileId: string): void {
    if (this.highlightPdfLoadedFileId === fileId && this.highlightPdfUrl) return;
    this.highlightPdfLoadedFileId = fileId;
    this.highlightPdfIframeId = '_pdf_hl_' + Math.random().toString(36).substring(2, 9);
    const apiUrl = `${this.env.getEnv('baseUrl')}/File/View/${fileId}`;
    this.highlightPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `pdfjs/task-viewer.html?path=${encodeURIComponent(apiUrl)}&fitWidth=1`,
    );
  }

  private postHighlightToIframe(iframeId: string, task: ExtractedTask): void {
    if (!task.regions?.length) return;
    const msg = {
      action: 'highlight',
      regions: task.regions.map(r => ({
        pageIndex: r.pageIndex, xmin: r.xmin, ymin: r.ymin, xmax: r.xmax, ymax: r.ymax,
      })),
      pageIndex: task.regions[0].pageIndex,
      xmin: task.regions[0].xmin,
      ymin: task.regions[0].ymin,
      xmax: task.regions[0].xmax,
      ymax: task.regions[0].ymax,
      pageWidth: task.pageWidth,
      pageHeight: task.pageHeight,
    };
    const send = () => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe?.contentWindow) iframe.contentWindow.postMessage(msg, '*');
    };
    send();
    const obs = new MutationObserver(() => {
      const el = document.getElementById(iframeId) as HTMLIFrameElement;
      if (el?.contentWindow) {
        el.contentWindow.postMessage(msg, '*');
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(send, 600);
    setTimeout(send, 1500);
  }

  canHighlight(task: ExtractedTask): boolean {
    return this.originalFile?.status === AttachmentFileStatus.Ready
      && !!this.originalFile?.id
      && (task.regions?.length ?? 0) > 0;
  }

  onOriginalAddClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.isAnalyzing || this.originalFile) return;
    this.openDropZoneFilePicker();
  }

  toggleAllTasks(checked: boolean): void {
    this.tasks = this.tasks.map(t => ({ ...t, selected: checked && (t.status ?? 0) === 0 }));
    this.allTasksSelected = checked && this.tasks.some(t => (t.status ?? 0) === 0);
    this.cdr.markForCheck();
  }

  onTaskSelectChange(): void {
    const editableTasks = this.tasks.filter(t => (t.status ?? 0) === 0);
    this.allTasksSelected = editableTasks.length > 0 && editableTasks.every(t => t.selected);
    this.cdr.markForCheck();
  }

  toggleTaskContentExpand(): void {
    this.taskContentExpanded = !this.taskContentExpanded;
    this.cdr.markForCheck();
  }

  openBulkEditModal(): void {
    if (this.selectedTaskCount === 0) {
      this.notification.warning('Thất bại','Vui lòng chọn ít nhất một nhiệm vụ');
      return;
    }
    this.bulkEditForm = {};
    this.bulkEditVisible = true;
    this.cdr.markForCheck();
  }

  closeBulkEditModal(): void {
    this.bulkEditVisible = false;
    this.cdr.markForCheck();
  }

  applyBulkEdit(): void {
    const selectedIndexes = new Set(
      this.tasks.map((t, i) => (t.selected && (t.status ?? 0) === 0 ? i : -1)).filter(i => i >= 0),
    );
    if (!selectedIndexes.size) {
      this.notification.warning('Thất bại','Vui lòng chọn ít nhất một nhiệm vụ');
      return;
    }

    const f = this.bulkEditForm;
    const hasTopic = !!f.topicGroupId;
    const hasLead = !!(f.leadOrganizationIds?.length);
    const hasCoord = !!(f.coordinateOrganizationIds?.length);
    const hasDeadline = !!f.deadlineDate;
    const hasPriority = !!f.priorityLevelId;

    if (!hasTopic && !hasLead && !hasCoord && !hasDeadline && !hasPriority) {
      this.notification.warning('Cảnh cáo','Chọn ít nhất một trường cần cập nhật');
      return;
    }

    this.tasks = this.tasks.map((t, i) => {
      if (!selectedIndexes.has(i)) return t;
      const updated: ExtractedTask = { ...t };
      if (hasTopic) updated.topicGroupId = f.topicGroupId!;
      if (hasLead) {
        updated.leadOrganizationIds = [...f.leadOrganizationIds!];
        updated.leadOrganizationId = updated.leadOrganizationIds.join(',');
      }
      if (hasCoord) updated.coordinateOrganizationIds = [...f.coordinateOrganizationIds!];
      if (hasDeadline && f.deadlineDate) {
        updated.deadlineDate = new Date(f.deadlineDate);
        const d = updated.deadlineDate;
        updated.deadline = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
      if (hasPriority) updated.priorityLevelId = f.priorityLevelId!;
      return updated;
    });

    this.bulkEditVisible = false;
    this.notification.success('Thành công',`Đã cập nhật ${selectedIndexes.size} nhiệm vụ`);
    this.cdr.markForCheck();
  }

  onTaskDeadlineChange(task: ExtractedTask): void {
    if (!task.deadlineDate) {
      task.deadline = '';
      return;
    }
    const d = task.deadlineDate;
    task.deadline = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  showTaskAssigned(task: ExtractedTask, e?: Event): void {
    e?.stopPropagation();
    this.notification.info('','Chức năng xem nhiệm vụ đã giao đang phát triển');
    this.cdr.markForCheck();
  }

  onTaskDispatch(task: ExtractedTask, e?: Event): void {
    e?.stopPropagation();
    if (!task.id) {
      this.notification.warning('Cảnh cáo','Vui lòng lưu văn bản trước khi giao nhiệm vụ');
      return;
    }
    const targets = this.buildDispatchTargets(task);
    if (!targets.length) {
      this.notification.warning('Cảnh cáo','Nhiệm vụ chưa có đơn vị chủ trì hoặc phối hợp. Vui lòng chỉnh sửa nhiệm vụ trước.');
      return;
    }

    const dispatchOrgName = this.getOrgName(
      this.userOrgIds.length > 1 && task.dispatchOrgId ? task.dispatchOrgId : this.userOrgIds[0]
    );
    const leads = targets
      .filter(x => x.assignmentRole === TaskReceiveAssignmentRole.Primary)
      .map(x => this.getOrgName(x.organizationId));
    const coords = targets
      .filter(x => x.assignmentRole === TaskReceiveAssignmentRole.Coordinator)
      .map(x => this.getOrgName(x.organizationId));

    const lines: string[] = [`<b>Đơn vị giao:</b> ${dispatchOrgName}`];
    if (leads.length) lines.push(`<b>Chủ trì:</b> ${leads.join(', ')}`);
    if (coords.length) lines.push(`<b>Phối hợp:</b> ${coords.join(', ')}`);

    this.modal.confirm({
      nzTitle: `Giao nhiệm vụ #${task.order}`,
      nzContent: lines.join('<br>'),
      nzOkText: 'Giao việc',
      nzCancelText: 'Huỷ',
      nzOnOk: () => this.runTaskDispatch(task, targets),
    });
  }

  private getOrgName(id: string | undefined | null): string {
    if (!id) return '—';
    return this.organizes.find((o: any) => o.id === id)?.name ?? id;
  }

  private buildDispatchTargets(task: ExtractedTask): DispatchTargetDto[] {
    const dueDate = task.deadlineDate
      ? (this.formatDateForApi(task.deadlineDate)?.slice(0, 10) ?? null)
      : this.parseDeadlineToIso(task.deadline);

    const leadIds = task.leadOrganizationIds?.length
      ? task.leadOrganizationIds
      : (task.leadOrganizationId ?? '').split(',').map(id => id.trim()).filter(Boolean);
    const coordIds = (task.coordinateOrganizationIds ?? []).filter(Boolean);
    const leadSet = new Set(leadIds);
    const targets: DispatchTargetDto[] = [];

    for (const orgId of leadIds) {
      targets.push({ organizationId: orgId, assignmentRole: TaskReceiveAssignmentRole.Primary, dueDate });
    }
    for (const orgId of coordIds) {
      if (leadSet.has(orgId)) continue;
      targets.push({ organizationId: orgId, assignmentRole: TaskReceiveAssignmentRole.Coordinator, dueDate });
    }
    return targets;
  }

  private runTaskDispatch(task: ExtractedTask, targets: DispatchTargetDto[]): Promise<void> {
    const request = new DispatchRequestDto();
    request.taskId = task.id!;
    request.documentId = this.editingItem?.id ?? '';
    request.targets = targets;
    if (this.userOrgIds.length > 1 && task.dispatchOrgId) {
      request.dispatchOrgId = task.dispatchOrgId;
    }

    return new Promise((resolve, reject) => {
      this.dispatchService.dispatch(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.tasks = this.tasks.map(t => (
              t.id === task.id ? { ...t, status: 1 } : t
            ));
            this.cdr.markForCheck();
            resolve();
          },
          error: () => {
            this.notification.error('Thất bại','Giao nhiệm vụ thất bại');
            this.cdr.markForCheck();
            reject();
          },
        });
    });
  }

  onTaskRevoke(task: ExtractedTask, e?: Event): void {
    e?.stopPropagation();
    this.notification.info('','Chức năng thu hồi nhiệm vụ đang phát triển');
    this.cdr.markForCheck();
  }

  openCreateTaskModal(): void {
    this.createTaskModal?.open(this.tasks.length + 1);
    this.cdr.markForCheck();
  }

  addManualTask(task: ExtractedTask): void {
    const order = this.tasks.length + 1;
    const newTask: ExtractedTask = { ...task, order, selected: false };
    this.tasks = [...this.tasks, newTask];
    this.resultTabIndex = this.TAB_TASKS;
    if (this.editingItem?.id) {
      const dto = mapExtractedTaskToInformationDto(newTask, order);
      dto.documentId = this.editingItem.id;
      this.taskInfoService.insert(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            const savedId: string | undefined = res?.data?.id;
            if (savedId) {
              this.tasks = this.tasks.map(t => (t === newTask ? { ...t, id: savedId } : t));
              this.cdr.markForCheck();
            }
          },
          error: () => this.notification.warning('Cảnh báo','Chưa lưu được nhiệm vụ lên server'),
        });
    }
    this.cdr.markForCheck();
  }

  onTaskEdit(task: ExtractedTask, index: number, e?: Event): void {
    e?.stopPropagation();
    this.editingTaskIndex = index;
    this.editingTask = mergeExtractedTask(this.tasks[index], this.tasks[index]);
    this.taskEditVisible = true;
    this.routeSync.emit({
      taskId: task.id ?? null,
      taskIndex: task.id ? null : index,
    });
    this.cdr.markForCheck();
  }

  onTaskContentClick(task: ExtractedTask, index: number, e?: Event): void {
    this.onTaskEdit(task, index, e);
  }

  onTaskEditSave(updated: ExtractedTask): void {
    const index = this.editingTaskIndex;
    if (index == null || index < 0 || index >= this.tasks.length) {
      this.notification.error('Thất bại','Không xác định được nhiệm vụ cần cập nhật');
      return;
    }
    const merged = mergeExtractedTask(this.tasks[index], updated);
    this.tasks = this.tasks.map((t, i) => (i === index ? merged : t));
    this.closeTaskEditModal();
    this.notification.success('Thành công','Đã cập nhật nhiệm vụ');
    if (this.editingItem?.id) {
      const dto = mapExtractedTaskToInformationDto(merged, merged.order);
      dto.documentId = this.editingItem.id;
      if (merged.id) {
        this.taskInfoService.update(dto)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ error: () => this.notification.warning('Cảnh báo','Chưa lưu được nhiệm vụ lên server') });
      } else {
        this.taskInfoService.insert(dto)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              const savedId: string | undefined = res?.data?.id;
              if (savedId) {
                this.tasks = this.tasks.map(t => (t === merged ? { ...t, id: savedId } : t));
                this.cdr.markForCheck();
              }
            },
            error: () => this.notification.warning('Cảnh báo','Chưa lưu được nhiệm vụ lên server'),
          });
      }
    }
    this.cdr.markForCheck();
  }

  onTaskEditVisibleChange(visible: boolean): void {
    if (visible) {
      this.taskEditVisible = true;
      this.cdr.markForCheck();
      return;
    }
    if (this.taskEditVisible) {
      this.closeTaskEditModal();
    }
  }

  private closeTaskEditModal(): void {
    this.taskEditVisible = false;
    this.editingTask = null;
    this.editingTaskIndex = null;
    this.routeSync.emit({ taskId: null, taskIndex: null });
  }

  private persistTasksToServer(documentId: string): void {
    this.taskInfoService.syncByDocument(documentId, this.buildSyncTasks(), false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => this.notification.warning('Cảnh báo','Chưa đồng bộ được nhiệm vụ lên server'),
      });
  }

  private tryOpenTaskFromRoute(): void {
    const opts = this.pendingTaskRoute;
    if (!opts) return;
    const { taskId, taskIndex } = opts;
    let idx = -1;
    if (taskId) {
      idx = this.tasks.findIndex(t => t.id === taskId);
    } else if (taskIndex != null && !Number.isNaN(taskIndex)) {
      idx = taskIndex;
    }
    if (idx >= 0 && idx < this.tasks.length) {
      this.editingTaskIndex = idx;
      this.editingTask = mergeExtractedTask(this.tasks[idx], this.tasks[idx]);
      this.taskEditVisible = true;
    }
    this.pendingTaskRoute = undefined;
    this.cdr.markForCheck();
  }

  isTaskPersisted(task: ExtractedTask): boolean {
    return !!task.id;
  }

  isTaskEditable(task: ExtractedTask): boolean {
    return !task.id || (task.status ?? 0) === 0;
  }

  formatTaskDeadline(task: ExtractedTask): string {
    if (task.deadlineDate) {
      const d = task.deadlineDate;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return task.deadline || '';
  }

  getTaskStatusLabel(status?: number): string {
    return TASK_STATUS_LABELS[status ?? 0] ?? '';
  }

  getTaskStatusColor(status?: number): string {
    return TASK_STATUS_COLORS[status ?? 0] ?? 'default';
  }

  getLeadOrgNames(lead?: string | string[] | null): string {
    const ids = Array.isArray(lead)
      ? lead
      : (lead ?? '').split(',').map(x => x.trim()).filter(Boolean);
    if (!ids.length) return '';
    return ids.map(id => this.getMasterName(this.organizes, id)).filter(Boolean).join(', ');
  }

  getAccountName(userName: string | null | undefined): string {
    if (!userName) return '';

    return this.account.find(o => o.userName === userName)?.fullName ?? userName;
  }

  getLeadOrgList(lead?: string | string[] | null): string[] {
    const ids = Array.isArray(lead)
      ? lead
      : (lead ?? '').split(',').map(x => x.trim()).filter(Boolean);
    return ids.map(id => this.getMasterName(this.organizes, id)).filter(Boolean);
  }

  getCoordinateOrgNames(ids?: string[]): string {
    if (!ids?.length) return '';
    return ids.map(id => this.getMasterName(this.organizes, id)).filter(Boolean).join(', ');
  }

  getCoordinateOrgList(ids?: string[]): string[] {
    if (!ids?.length) return [];
    return ids.map(id => this.getMasterName(this.organizes, id)).filter(Boolean);
  }

  removeTask(index: number, e?: Event): void {
    e?.stopPropagation();
    this.tasks = this.tasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 }));
    if (this.selectedTaskIndex === index) this.selectedTaskIndex = null;
    else if (this.selectedTaskIndex != null && this.selectedTaskIndex > index) this.selectedTaskIndex--;
    this.allTasksSelected = false;
    this.cdr.markForCheck();
  }

  getPriorityColor(code?: string): string {
    if (!code) return 'default';
    return this.taskPriorities.find(p => p.code === code)?.color ?? 'default';
  }

  getMasterName(list: any[], value?: string | null): string {
    if (!value) return '';
    const item = list.find(x => x.code === value || x.id === value);
    return item?.name ?? '';
  }

  cancelStream(): void {
    this.clearProgressTimer();
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    if (this.stage === OcrStageKey.Streaming) {
      this.stage = OcrStageKey.Idle; this.stageMessage = 'Đã huỷ'; this.analysisProgress = 0;
      this.cdr.markForCheck();
    }
  }

  private startProgressTimer(): void {
    this.clearProgressTimer();
    this.progressTimer = setInterval(() => {
      if (this.analysisProgress < 88) {
        this.analysisProgress = Math.min(88, this.analysisProgress + Math.max(0.3, (88 - this.analysisProgress) * 0.025));
        this.cdr.markForCheck();
      }
    }, 300);
  }

  private clearProgressTimer(): void {
    if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
  }

  private getLabelById(list: any[], id: string | null | undefined): string {
    if (!id) return '';
    return list.find(x => x.id === id || x.code === id)?.name ?? id;
  }

  private resolveMasterField(list: any[], raw: string, defaultCode = ''): string {
    const input = this.normalizeMasterKey(raw);
    if (!input) return defaultCode;

    for (const x of list) {
      const code = String(x.code ?? x.id ?? '').trim();
      if (!code) continue;
      const codeKey = this.normalizeMasterKey(code);
      const nameKey = this.normalizeMasterKey(x.name ?? '');
      if (codeKey === input || code.toUpperCase() === raw.trim().toUpperCase()) return code;
      if (nameKey === input) return code;
      if (nameKey && (nameKey.includes(input) || input.includes(nameKey))) return code;
    }
    return defaultCode;
  }

  private normalizeMasterKey(value: string): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private resolveOrganizeId(text: string): string {
    const t = (text ?? '').trim().toLowerCase();
    if (!t) return '';
    const found = this.organizes.find(x => (x.name ?? '').toLowerCase() === t);
    return found?.id ?? '';
  }

  private parseDeadlineToDate(value?: string | null): Date | null {
    const v = (value ?? '').trim();
    if (!v) return null;
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private formatDateForApi(value: Date | null): string | null {
    if (!value) return null;
    return value.toISOString();
  }

  private loadItemIntoEditDoc(item: TaskDocumentDto): void {
    this.editDoc = {
      title: item.subject ?? '',
      documentNumber: item.documentNumber || item.documentSymbol || '',
      documentTypeId: item.documentTypeId ?? '',
      fieldId: item.fieldId ?? '',
      urgencyLevelId: item.urgencyLevelId ?? '',
      confidentialityLevelId: item.confidentialityLevelId ?? '',
      issuerOrganizationId: item.issuerOrganizationId ?? '',
      sendingAgencyText: item.recipientOrganizations ?? '',
      issueDate: this.parseDeadlineToDate(item.issuedDate),
      effectiveDate: this.parseDeadlineToDate(item.effectiveDate),
      expireDate: this.parseDeadlineToDate(item.expirationDate),
      summary: item.contentSummary ?? '',
      leaderUsername: item.leaderUsername ?? '',
      signerUsername: item.signerUsername ?? '',
    };
  }

  private loadDocumentDetails(documentId: string, referenceFileId?: string): void {
    const sources$: Record<string, any> = {
      doc: this.docService.detail(documentId),
      tasks: this.taskInfoService.byDocument(documentId),
    };
    if (referenceFileId) {
      sources$['files'] = this.fileService.getByRefrence(referenceFileId).pipe(catchError(() => of([])));
    }
    forkJoin(sources$).pipe(takeUntil(merge(this.loadCancel$, this.destroy$))).subscribe({
      next: (result: any) => {
        const fullDoc = result['doc'] as TaskDocumentDto;
        if (fullDoc?.id) {
          this.editingItem = fullDoc;
          this.loadItemIntoEditDoc(fullDoc);
          this.loadDocumentFiles(fullDoc, result['files']);
        }
        this.loadDocumentTasks(Array.isArray(result['tasks']) ? result['tasks'] : []);
        this.tryOpenTaskFromRoute();
        this.cdr.markForCheck();
      },
      error: () => this.notification.error('Thất bại','Không tải được chi tiết văn bản'),
    });
  }

  private loadDocumentFiles(doc: TaskDocumentDto, preloadedFiles?: any[]): void {
    if (preloadedFiles !== undefined) {
      this.applyDocumentFileList(doc, Array.isArray(preloadedFiles) ? preloadedFiles : []);
      return;
    }

    if (doc.referenceFileId) {
      this.fileService.getByRefrence(doc.referenceFileId).pipe(
        takeUntil(merge(this.loadCancel$, this.destroy$)),
        catchError(() => of([])),
      ).subscribe((files) => {
        this.applyDocumentFileList(doc, Array.isArray(files) ? files : []);
      });
      return;
    }

    this.attachmentFiles = [];
    this.applyDocumentFileList(doc, []);
  }

  private applyDocumentFileList(doc: TaskDocumentDto, list: any[]): void {
    this.attachmentFiles = list
      .filter(f => (f.id ?? f.Id) !== doc.originalFileId)
      .map(f => this.enrichAttachment(this.mapFileDtoToAttachment(f)));
    if (!doc.originalFileId) {
      this.initDefaultPreviewTab();
      this.cdr.markForCheck();
      return;
    }
    this.cdr.markForCheck();

    const inReference = list.find(f => (f.id ?? f.Id) === doc.originalFileId);
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
      this.loadOriginalFileViaAttachmentStatus(doc.originalFileId!);
    });
  }

  private setOriginalFileFromDto(fileDto: any): void {
    const item = this.enrichAttachment(this.mapFileDtoToAttachment({ ...fileDto, status: AttachmentFileStatus.Ready }));
    this.originalFile = item;
    if (item.status === AttachmentFileStatus.Ready) this.initDefaultPreviewTab();
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
          status: AttachmentFileStatus.Ready,
        }));
        this.initDefaultPreviewTab();
        this.cdr.markForCheck();
        return;
      }
      this.originalFile = this.enrichAttachment(item);
      if (this.originalFile.status === AttachmentFileStatus.Ready) this.initDefaultPreviewTab();
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

  private loadDocumentTasks(list: TaskInformationDto[]): void {
    this.tasks = [...list]
      .sort((a, b) => String(a.taskCode ?? '').localeCompare(String(b.taskCode ?? ''), undefined, { numeric: true }))
      .map((t, i) => {
        const hlRaw = t.highlightRegions ?? (t as any).HighlightRegions;
        const hl = this.parseHighlightRegions(hlRaw);
        return {
          order: i + 1,
          id: t.id ?? (t as any).Id,
          taskContent: t.description || t.title || (t as any).Description || (t as any).Title || '',
          deadline: this.formatDueDateDisplay(t.dueDate),
          deadlineDate: this.parseDeadlineToDate(this.formatDueDateDisplay(t.dueDate)),
          regions: hl.regions,
          pageWidth: hl.pageWidth,
          pageHeight: hl.pageHeight,
          selected: false,
          topicGroupId: t.topicGroupId ?? '',
          leadOrganizationId: t.leadOrganizationId ?? '',
          leadOrganizationIds: (t.leadOrganizationId ?? '').split(',').map((id: string) => id.trim()).filter(Boolean),
          coordinateOrganizationIds: (t.coordinateOrganizations ?? '').split(',').filter(Boolean),
          priorityLevelId: t.priorityLevelId ?? '',
          status: t.taskStatus ?? 0,
          isFromDocument: t.isFromDocument ?? true,
          fieldId: t.fieldId ?? '',
          dispatchOrgId: t.dispatchOrgId ?? '',
          requiresReportFile: t.requiresReportFile ?? false,
          leaderUserName: t.leaderUserName ?? '',
          startDate: this.parseDeadlineToDate(this.formatDueDateDisplay(t.startDate)),
          note: t.note ?? '',
          issuerOrganizationId: t.issuerOrganizationId ?? '',
        };
      });

    if (this.tasks.length) {
      this.stage = OcrStageKey.Done;
      this.stageMessage = this.isEditMode ? '' : `Hoàn tất — ${this.tasks.length} công việc`;
      this.analysisProgress = 100;
    }
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
    item.status = (f.status ?? f.Status ?? AttachmentFileStatus.Ready) as ChatBotAttachmentStatus;
    item.ocrTextLength = Number(f.ocrTextLength ?? f.OcrTextLength ?? 0);
    item.createDate = f.createDate ?? f.CreateDate ?? '';
    item.createBy = f.createBy ?? f.CreateBy ?? '';
    item.conversationId = f.conversationId ?? f.ConversationId ?? '';
    item.error = f.error ?? f.Error ?? null;
    return item;
  }

  private buildSyncTasks(): TaskInformationDto[] {
    return this.tasks.map((t, i) => {
      const dto = mapExtractedTaskToInformationDto(t, i + 1);
      if (!dto.highlightRegions) {
        const regions = t.regions?.length ? t.regions : this.normalizeTaskRegions(t);
        if (regions.length) {
          dto.highlightRegions = JSON.stringify({
            regions,
            pageWidth: t.pageWidth ?? null,
            pageHeight: t.pageHeight ?? null,
          });
        }
      }
      return dto;
    });
  }

  private normalizeTaskRegions(source: any): ExtractedTask['regions'] {
    if (!source) return [];
    const raw = source.regions ?? source.Regions;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((r: any) => this.normalizeRegion(r)).filter((r): r is NonNullable<typeof r> => !!r);
    }
    const single = this.normalizeRegion(source);
    return single ? [single] : [];
  }

  private normalizeRegion(r: any): ExtractedTask['regions'][number] | null {
    if (!r) return null;
    const pageIndex = Number(r.pageIndex ?? r.PageIndex);
    const xmin = Number(r.xmin ?? r.Xmin);
    const ymin = Number(r.ymin ?? r.Ymin);
    const xmax = Number(r.xmax ?? r.Xmax);
    const ymax = Number(r.ymax ?? r.Ymax);
    if ([pageIndex, xmin, ymin, xmax, ymax].some(v => Number.isNaN(v))) return null;
    return { pageIndex, xmin, ymin, xmax, ymax };
  }

  private parseHighlightRegions(raw?: string | null): {
    regions: ExtractedTask['regions'];
    pageWidth?: number;
    pageHeight?: number;
  } {
    if (!raw) return { regions: [] };
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        return { regions: this.normalizeTaskRegions({ regions: parsed }) };
      }
      return {
        regions: this.normalizeTaskRegions(parsed),
        pageWidth: Number(parsed.pageWidth ?? parsed.PageWidth) || undefined,
        pageHeight: Number(parsed.pageHeight ?? parsed.PageHeight) || undefined,
      };
    } catch {
      return { regions: [] };
    }
  }

  private parseDeadlineToIso(value?: string): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  private formatDueDateDisplay(value?: string | null): string {
    if (!value) return '';
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return value;
  }

  private generateEntityId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase();
  }

  saveDocument(): void {
    const base = this.editingItem ? { ...this.editingItem } : new TaskDocumentDto();
    const isNew = !base.id;
    const docId = base.id || this.generateEntityId();
    const referenceFileId = base.referenceFileId || this.generateEntityId();

    const dto: TaskDocumentDto = Object.assign(base, {
      id: docId,
      isManual: this.manualMode || base.isManual,
      documentNumber: (this.editDoc.documentNumber ?? '').trim(),
      documentSymbol: '',
      subject: this.editDoc.title || this.editDoc.documentNumber,
      contentSummary: this.editDoc.summary,
      documentTypeId: this.editDoc.documentTypeId || base.documentTypeId || '',
      fieldId: this.editDoc.fieldId || base.fieldId || '',
      urgencyLevelId: this.editDoc.urgencyLevelId || base.urgencyLevelId || '',
      confidentialityLevelId: this.editDoc.confidentialityLevelId || base.confidentialityLevelId || '',
      issuerOrganizationId: this.editDoc.issuerOrganizationId || base.issuerOrganizationId || '',
      recipientOrganizations: this.editDoc.sendingAgencyText,
      issuedDate: this.formatDateForApi(this.editDoc.issueDate),
      effectiveDate: this.formatDateForApi(this.editDoc.effectiveDate),
      expirationDate: this.formatDateForApi(this.editDoc.expireDate),
      originalFileId: this.originalFile?.id || base.originalFileId || '',
      referenceFileId,
      attachmentFileIds: this.attachmentFiles.map(f => f.id).filter(Boolean),
      leaderUsername: this.editDoc.leaderUsername || '',
      signerUsername: this.editDoc.signerUsername || '',
    });

    const docAction = isNew ? this.docService.insert(dto, false) : this.docService.update(dto, false);
    docAction.pipe(
      switchMap((res: any) => {
        const id = res?.data?.id ?? dto.id!;
        return this.taskInfoService.syncByDocument(id, this.buildSyncTasks(), false).pipe(
          map(() => id),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (id) => {
        this.notification.success('Thành công',isNew ? 'Lưu văn bản thành công' : 'Cập nhật thành công');
        this.editingItem = { ...dto, id };
        this.loadDocumentDetails(id);
        this.saved.emit({ id, isNew });
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Thất bại','Lưu thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  markCompleted(): void {
    if (!this.editingItem?.id) return;
    const id = this.editingItem.id;
    this.docService.updateStatus(id, DocumentProcessingStatusCode.AssignmentCompleted).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.success('Thành công','Đã hoàn thành giao việc');
        this.saved.emit({ id, isNew: false });
        this.close();
      },
      error: () => { this.notification.error('Thất bại','Thao tác thất bại'); },
    });
  }

  trackById = (_: number, x: { id: string }) => x.id;
  trackByOrder = (i: number, t: ExtractedTask) => t.order ?? i;
}
