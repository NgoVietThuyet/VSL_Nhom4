import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { DcFilePreview } from '../../../document-workflow/components/dc-file-preview/dc-file-preview';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedService } from '../../../../shared/services';
import { FileService } from '../../../../shared/services/file.service';
import { TaskWorkflowService } from '../../services/task-workflow.service';
import { TaskDetailDrawer } from '../task-detail-drawer/task-detail-drawer';
import {
  ProposalFilterDto,
  TaskApprovalDto,
  TaskApproveExtendDto,
  TaskPendingProposalDto,
  ProposalTypeCode,
  PROPOSAL_TYPE_LABELS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
  TK_LIST_TABLE_SCROLL_Y,
} from '../../models';
import { TaskDiscussAttachment } from '../../models/task-detail-drawer.model';
import { NzNotificationService } from 'ng-zorro-antd/notification';

type MainTab = 'pending' | 'approved';

@Component({
  selector: 'app-task-approval',
  standalone: true,
  imports: [SharedModules, TaskDetailDrawer, DcFilePreview],
  templateUrl: './task-approval.html',
  styleUrl: './task-approval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskApproval implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('approveFileInput') approveFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  // ── Tabs ──────────────────────────────────────────────────────────
  mainTab: MainTab = 'pending';
  countChoPheDuyet = 0;

  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;

  // ── Data ──────────────────────────────────────────────────────────
  data: PaginationResult = new PaginationResult();
  filter: ProposalFilterDto = new ProposalFilterDto();
  keyword = '';
  loading = false;

  // ── Approve/Reject modal ──────────────────────────────────────────
  actionModalVisible = false;
  activeAction: 'approve' | 'reject' = 'approve';
  activeProposal: TaskPendingProposalDto | null = null;
  actionNote = '';
  actionAttachments: TaskDiscussAttachment[] = [];
  actionUploading = false;
  actionSending = false;
  activeDrawerProposal: TaskPendingProposalDto | null = null;

  // Extend sub-type
  extendUseProposedDate = true;
  extendAdjustedDueDate: Date | null = null;
  extendAdjustReason = '';

  // ── Labels ────────────────────────────────────────────────────────
  readonly proposalTypeLabels = PROPOSAL_TYPE_LABELS;
  readonly proposalStatusLabels = PROPOSAL_STATUS_LABELS;
  readonly proposalStatusColors = PROPOSAL_STATUS_COLORS;

  // ── File viewer drawer ────────────────────────────────────────────
  fileDrawerVisible = false;
  fileDrawerTitle = '';
  fileDrawerFileId: string | null = null;
  fileDrawerFileName = '';

  constructor(
    private global: GlobalService,
    private workflowService: TaskWorkflowService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private notification: NzNotificationService
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Phê duyệt nhiệm vụ', path: 'task-management/approvals' },
    ]);
  }

  disablePastDates = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  ngOnInit(): void {
    this.bindCountBadge();
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ────────────────────────────────────────────────────
  onMainTabChange(tab: MainTab): void {
    this.mainTab = tab;
    this.filter.currentPage = 1;
    this.search();
  }

  // ── Data ──────────────────────────────────────────────────────────
  searchCol(): void {
    this.filter.currentPage = 1;
    this.search();
  }

  reset(): void {
    this.keyword = '';
    this.filter = new ProposalFilterDto();
    this.search();
  }

  search(): void {
    this.loading = true;
    this.filter.keyWord = this.keyword;
    this.filter.isPaging = true;
    this.cdr.markForCheck();

    const call$ = this.mainTab === 'pending'
      ? this.workflowService.pendingProposals(this.filter)
      : this.workflowService.approvedProposals(this.filter);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res ?? new PaginationResult();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  pageIndexChange(p: number): void { this.filter.currentPage = p; this.search(); }
  pageSizeChange(s: number): void { this.filter.pageSize = s; this.filter.currentPage = 1; this.search(); }

  // ── Modal ─────────────────────────────────────────────────────────
  openApprove(proposal: TaskPendingProposalDto): void {
    this.activeProposal = proposal;
    this.activeAction = 'approve';
    this.resetActionModal();
    this.actionModalVisible = true;
    this.cdr.markForCheck();
  }

  openReject(proposal: TaskPendingProposalDto): void {
    this.activeProposal = proposal;
    this.activeAction = 'reject';
    this.resetActionModal();
    this.actionModalVisible = true;
    this.cdr.markForCheck();
  }

  closeActionModal(): void {
    this.actionModalVisible = false;
    this.cdr.markForCheck();
  }

  get actionModalTitle(): string {
    if (!this.activeProposal) return '';
    const typeLabel = this.proposalTypeLabels[this.activeProposal.proposalType] ?? '';
    return this.activeAction === 'approve' ? `Phê duyệt: ${typeLabel}` : `Từ chối: ${typeLabel}`;
  }

  get isExtendApproval(): boolean {
    return this.activeAction === 'approve'
      && (this.activeProposal?.proposalType as number) === ProposalTypeCode.Extend;
  }

  submitAction(): void {
    if (this.activeAction === 'reject' && !this.actionNote.trim()) {
      this.notification.warning('Cảnh cáo','Vui lòng nhập lý do từ chối');
      return;
    }
    if (this.isExtendApproval && !this.extendUseProposedDate && !this.extendAdjustedDueDate) {
      this.notification.warning('Cảnh cáo','Vui lòng chọn ngày hoàn thành mới');
      return;
    }
    if (!this.activeProposal) return;

    this.actionSending = true;
    this.cdr.markForCheck();

    const base: TaskApprovalDto = {
      taskId: this.activeProposal.taskId,
      receiveId: this.activeProposal.receiveId,
      note: this.actionNote,
      attachmentFileIds: this.actionAttachments.map(f => f.fileId),
    };

    let call$;
    if (this.activeAction === 'reject') {
      call$ = this.rejectCall(base);
    } else if (this.isExtendApproval) {
      const extendDto: TaskApproveExtendDto = {
        ...base,
        useProposedDate: this.extendUseProposedDate,
        adjustedDueDate: this.extendAdjustedDueDate ? this.extendAdjustedDueDate.toISOString() : null,
        adjustReason: this.extendAdjustReason,
      };
      call$ = this.workflowService.approveExtend(extendDto);
    } else {
      call$ = this.approveCall(base);
    }

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.actionSending = false;
        this.actionModalVisible = false;
        this.notification.success('Thành công',this.activeAction === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối');
        this.search();
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionSending = false;
        this.cdr.markForCheck();
      },
    });
  }

  private approveCall(base: TaskApprovalDto) {
    const t = this.activeProposal!.proposalType as number;
    if (t === ProposalTypeCode.Complete) return this.workflowService.approveComplete(base);
    if (t === ProposalTypeCode.Pause)    return this.workflowService.approvePause(base);
    return this.workflowService.approveStop(base);
  }

  private rejectCall(base: TaskApprovalDto) {
    const t = this.activeProposal!.proposalType as number;
    if (t === ProposalTypeCode.Complete) return this.workflowService.rejectComplete(base);
    if (t === ProposalTypeCode.Extend)   return this.workflowService.rejectExtend(base);
    if (t === ProposalTypeCode.Pause)    return this.workflowService.rejectPause(base);
    return this.workflowService.rejectStop(base);
  }

  // ── File upload ───────────────────────────────────────────────────
  onActionFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    (event.target as HTMLInputElement).value = '';
    this.actionUploading = true;
    this.cdr.markForCheck();
    this.fileService.uploadFiles(files, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const uploaded: any[] = res?.data ?? res ?? [];
        const mapped: TaskDiscussAttachment[] = uploaded
          .map((f: any) => ({ fileId: f.id ?? f.Id, fileName: f.fileName ?? f.FileName ?? 'file', icon: f.icon, fileSize: f.fileSize }))
          .filter(f => !!f.fileId);
        this.actionAttachments = [...this.actionAttachments, ...mapped];
        this.actionUploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionUploading = false;
        this.notification.error('Lỗi','Upload file thất bại');
        this.cdr.markForCheck();
      },
    });
  }

  removeActionFile(f: TaskDiscussAttachment): void {
    this.actionAttachments = this.actionAttachments.filter(x => x.fileId !== f.fileId);
    this.cdr.markForCheck();
  }

  openFileDrawer(fileId: string, fileName?: string): void {
    this.fileDrawerFileId = fileId;
    this.fileDrawerFileName = fileName || '';
    this.fileDrawerTitle = fileName || 'Xem file';
    this.fileDrawerVisible = true;
    this.cdr.markForCheck();
  }

  closeFileDrawer(): void {
    this.fileDrawerVisible = false;
    this.fileDrawerFileId = null;
    this.fileDrawerFileName = '';
    this.cdr.markForCheck();
  }

  openTaskDetail(item: TaskPendingProposalDto): void {
    if (!item?.taskId) return;
    this.activeDrawerProposal = this.mainTab === 'pending' ? item : null;
    this.taskDetailDrawer.proposal = this.activeDrawerProposal;
    this.taskDetailDrawer.open(item.taskId);
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private resetActionModal(): void {
    this.actionNote = '';
    this.actionAttachments = [];
    this.extendUseProposedDate = true;
    this.extendAdjustedDueDate = null;
    this.extendAdjustReason = '';
  }

  formatDate(v: string | null | undefined): string {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('vi-VN');
  }

  trackById = (_: number, x: { id: string }) => x.id;

  private bindCountBadge(): void {
    this.sharedService.lstCountType$
      .pipe(takeUntil(this.destroy$))
      .subscribe((countType: any) => {
        this.countChoPheDuyet = Number(countType?.pheDuyetNhiemVuChoPheDuyet ?? 0);
        this.cdr.markForCheck();
      });
  }


  // Thêm callback
  onDrawerActionDone(): void {
    this.activeDrawerProposal = null;
    this.search();
  }
}
