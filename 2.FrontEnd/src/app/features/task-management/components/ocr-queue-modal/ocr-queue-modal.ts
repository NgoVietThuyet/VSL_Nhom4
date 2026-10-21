import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnDestroy, OnInit, Output,
} from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskDocumentService } from '../../services/task-document.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

interface QueueItem {
  documentId: string;
  fileName: string;
  queuePosition: number;
}

interface QueueStatus {
  totalPending: number;
  userItems: QueueItem[];
  estimatedMinutes: number;
}

@Component({
  selector: 'app-ocr-queue-modal',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './ocr-queue-modal.html',
  styleUrl: './ocr-queue-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrQueueModal implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() batchSaved = new EventEmitter<void>();

  queueStatus: QueueStatus = { totalPending: 0, userItems: [], estimatedMinutes: 0 };
  loadingStatus = false;
  saving = false;

  selectedFiles: File[] = [];
  isDragOver = false;

  private acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp',
  ];

  constructor(
    private docService: TaskDocumentService,
    private cdr: ChangeDetectorRef,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.loadStatus();
    interval(30_000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadStatus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  open(): void {
    this.visible = true;
    this.visibleChange.emit(true);
    this.selectedFiles = [];
    this.loadStatus();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.selectedFiles = [];
    this.cdr.markForCheck();
  }

  loadStatus(): void {
    this.loadingStatus = true;
    this.cdr.markForCheck();
    this.docService.getOcrQueueStatus().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        this.queueStatus = {
          totalPending: data?.totalPending ?? 0,
          userItems: (data?.userItems ?? []).map((x: any) => ({
            documentId: x.documentId ?? '',
            fileName: x.fileName ?? '',
            queuePosition: x.queuePosition ?? 0,
          })),
          estimatedMinutes: data?.estimatedMinutes ?? 0,
        };
        this.loadingStatus = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingStatus = false; this.cdr.markForCheck(); },
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(): void {
    this.isDragOver = false;
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.addFiles(files);
    input.value = '';
  }

  private addFiles(files: File[]): void {
    const valid = files.filter(f => this.acceptedTypes.includes(f.type) || f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.doc'));
    const invalid = files.length - valid.length;
    if (invalid > 0) this.notification.warning('Cảnh báo',`${invalid} file không được hỗ trợ (chỉ PDF, Word, ảnh).`);
    this.selectedFiles = [...this.selectedFiles, ...valid];
    this.cdr.markForCheck();
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  save(): void {
    if (!this.selectedFiles.length || this.saving) return;
    this.saving = true;
    this.cdr.markForCheck();

    this.docService.createOcrBatch(this.selectedFiles).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.selectedFiles = [];
        this.batchSaved.emit();
        this.close();
      },
      error: () => {
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }
}
