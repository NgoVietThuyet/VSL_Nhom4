import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter, Input, OnDestroy, Output, ViewChild,
} from '@angular/core';
import { DcFilePreview } from '../../../document-workflow/components/dc-file-preview/dc-file-preview';
import { Subject, forkJoin, of, takeUntil, catchError, merge } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskDetailDrawer } from '../task-detail-drawer/task-detail-drawer';
import { EnvironmentService } from '../../../../core';
import { FileService } from '../../../../shared/services/file.service';
import { AccountService } from '../../../system-manager/services/account.service';
import { ChatBotAttachmentDto } from '../../../chat-bot/models';
import { TaskDocumentService } from '../../services/task-document.service';
import { TaskInformationService } from '../../services/task-information.service';
import {
  TaskDocumentDto,
  TaskInformationDto,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TaskStatusCode,
  AttachmentFileStatus,
} from '../../models';

@Component({
  selector: 'app-task-document-view-drawer',
  standalone: true,
  imports: [SharedModules, TaskDetailDrawer, DcFilePreview],
  templateUrl: './task-document-view-drawer.html',
  styleUrl: './task-document-view-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDocumentViewDrawer implements OnDestroy {
  private destroy$ = new Subject<void>();
  private loadCancel$ = new Subject<void>();
  @ViewChild('taskDetailDrawer') taskDetailDrawer?: TaskDetailDrawer;

  @Input() organizes: any[] = [];
  @Input() documentTypes: any[] = [];
  @Input() documentFields: any[] = [];
  @Input() urgencyLevels: any[] = [];
  @Input() securityLevels: any[] = [];
  @Input() documentList: TaskDocumentDto[] = [];
  @Output() closed = new EventEmitter<void>();

  private accounts: any[] = [];

  visible = false;
  loading = false;
  activeTabIndex = 0;
  activeDocumentId = '';
  sidebarVisible = true;

  document: TaskDocumentDto = new TaskDocumentDto();
  allTasks: TaskInformationDto[] = [];
  originalFile: ChatBotAttachmentDto | null = null;
  attachmentFiles: ChatBotAttachmentDto[] = [];

  readonly fileStatus = AttachmentFileStatus;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  get inProgressTasks(): TaskInformationDto[] {
    return this.allTasks.filter(t =>
      t.taskStatus !== TaskStatusCode.Completed && t.taskStatus !== TaskStatusCode.Stopped,
    );
  }

  get completedTasks(): TaskInformationDto[] {
    return this.allTasks.filter(t => t.taskStatus === TaskStatusCode.Completed);
  }

  constructor(
    private docService: TaskDocumentService,
    private taskService: TaskInformationService,
    private fileService: FileService,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {
    this.accountService.listUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => { this.accounts = list; this.cdr.markForCheck(); },
    });
  }

  selectDocument(doc: TaskDocumentDto): void {
    if (doc.id === this.activeDocumentId) return;
    this.open(doc.id, true);
  }

  open(documentId: string, preserveTab = false): void {
    this.loadCancel$.next();
    this.visible = true;
    this.loading = true;
    if (!preserveTab) this.activeTabIndex = 0;
    this.activeDocumentId = documentId;
    this.document = new TaskDocumentDto();
    this.allTasks = [];
    this.originalFile = null;
    this.attachmentFiles = [];
    this.cdr.markForCheck();

    forkJoin({
      doc: this.docService.detail(documentId).pipe(catchError(() => of(null))),
      tasks: this.taskService.byDocument(documentId).pipe(catchError(() => of([]))),
    }).pipe(takeUntil(merge(this.loadCancel$, this.destroy$))).subscribe({
      next: ({ doc, tasks }: any) => {
        this.document = doc ?? new TaskDocumentDto();
        this.allTasks = (Array.isArray(tasks) ? tasks : tasks?.data ?? []) as TaskInformationDto[];
        this.loading = false;
        this.cdr.markForCheck();
        this.loadFiles(this.document);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadFiles(doc: TaskDocumentDto): void {
    if (doc.referenceFileId) {
      this.fileService.getByRefrence(doc.referenceFileId).pipe(
        takeUntil(merge(this.loadCancel$, this.destroy$)),
        catchError(() => of([])),
      ).subscribe((files: any) => {
        const list: any[] = Array.isArray(files) ? files : [];
        this.attachmentFiles = list
          .filter(f => (f.id ?? f.Id) !== doc.originalFileId)
          .map(f => this.mapFileDtoToAttachment(f));
        const inRef = list.find(f => (f.id ?? f.Id) === doc.originalFileId);
        if (inRef) {
          this.originalFile = this.mapFileDtoToAttachment({ ...inRef, status: AttachmentFileStatus.Ready });
          this.cdr.markForCheck();
        } else if (doc.originalFileId) {
          this.loadOriginalFile(doc.originalFileId);
        } else {
          this.cdr.markForCheck();
        }
      });
    } else if (doc.originalFileId) {
      this.loadOriginalFile(doc.originalFileId);
    }
  }

  private loadOriginalFile(fileId: string): void {
    this.fileService.getById(fileId).pipe(
      takeUntil(merge(this.loadCancel$, this.destroy$)),
      catchError(() => of(null)),
    ).subscribe((file: any) => {
      if (file) {
        this.originalFile = this.mapFileDtoToAttachment({ ...file, status: AttachmentFileStatus.Ready });
      }
      this.cdr.markForCheck();
    });
  }

  private mapFileDtoToAttachment(f: any): ChatBotAttachmentDto {
    const item = new ChatBotAttachmentDto();
    item.id = f.id ?? f.Id ?? '';
    item.fileName = f.fileName ?? f.FileName ?? '';
    item.fileSize = Number(f.fileSize ?? f.FileSize ?? 0);
    item.mimeType = f.mimeType ?? f.MimeType ?? '';
    item.extension = f.extension ?? f.extention ?? f.Extention ?? '';
    item.icon = f.icon ?? f.Icon ?? '';
    item.status = f.status ?? f.Status ?? AttachmentFileStatus.Ready;
    item.ocrTextLength = Number(f.ocrTextLength ?? f.OcrTextLength ?? 0);
    item.createDate = f.createDate ?? f.CreateDate ?? '';
    item.createBy = f.createBy ?? f.CreateBy ?? '';
    return item;
  }

  getFileIconUrl(file: ChatBotAttachmentDto): string {
    return file.icon || 'img/file.png';
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0; let n = bytes;
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
    const acc = this.accounts.find((a: any) => a.userName === file.createBy);
    return acc?.fullName || file.createBy;
  }

  downloadFile(file: ChatBotAttachmentDto, e?: Event): void {
    e?.stopPropagation();
    if (!file.id) return;
    this.fileService.download(file.id);
  }

  close(): void {
    this.visible = false;
    this.closed.emit();
    this.cdr.markForCheck();
  }

  getLabelById(list: any[], id: string | null | undefined, key = 'code', label = 'name'): string {
    if (!id) return '';
    return list.find(x => x[key] === id)?.[label] ?? id;
  }

  formatDocNumber(doc: TaskDocumentDto): string {
    return [doc.documentNumber, doc.documentSymbol].filter(Boolean).join(' - ') || '—';
  }

  ngOnDestroy(): void {
    this.loadCancel$.next();
    this.loadCancel$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  openTaskDetail(task: TaskInformationDto): void {
    if (!task?.id) return;
    this.taskDetailDrawer?.openWithTask(task);
  }

  trackById = (_: number, x: { id: string }) => x.id;
}
