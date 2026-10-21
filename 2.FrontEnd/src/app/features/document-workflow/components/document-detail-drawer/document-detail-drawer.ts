import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { FileService } from '../../../../shared/services';
import { DocumentIncomingService } from '../../services/document-incoming.service';
import { DocumentOutgoingService } from '../../services/document-outgoing.service';
import { DcMasterDataService, DcOption } from '../../services/dc-master-data.service';
import { DcDocumentForm } from '../dc-document-form/dc-document-form';
import { DcFilePreviewTabs } from '../dc-file-preview-tabs/dc-file-preview-tabs';
import { DcDocumentPlanPanel } from '../dc-create-panels/dc-document-plan-panel';
import { DcDocumentOpinionPanel } from '../dc-create-panels/dc-document-opinion-panel';
import { DcDocumentPhieuPanel } from '../dc-document-phieu-panel/dc-document-phieu-panel';
import { DcPlanSelection } from '../../models/document-tree-plan.model';
import { planSelectionToSaveItems } from '../../utils/plan-save.util';
import {
  DcWorkflowNavigateHint,
  navigateAfterIncomingAction,
  navigateAfterOutgoingAction,
} from '../../utils/dc-workflow-nav.util';
import {
  ACTION_TYPE_LABELS,
  DocumentAction,
  DocumentActivity,
  PHAN_LOAI_LABELS,
  TRANG_THAI_VBDI_COLORS,
  TRANG_THAI_VBDI_LABELS,
  TRANG_THAI_VBD_COLORS,
  TRANG_THAI_VBD_LABELS,
  BookType,
  DocumentIncomingPhieu,
  DocumentOutgoingPhieu,
  TrangThaiVanBanDen,
  TrangThaiVanBanDi,
  VaiTroXuLy,
} from '../../models';

type DrawerMode = 'incoming' | 'outgoing';

interface ActionButton {
  key: string;
  label: string;
  icon: string;
  type?: 'primary' | 'default' | 'dashed';
  danger?: boolean;
  needNote?: boolean;
  needRecipient?: boolean;
  needUserRecipient?: boolean;
  needPhanLoai?: boolean;
  needPlan?: boolean;
  needBook?: boolean;
}

interface ActivityView extends DocumentActivity {
  actionLabel: string;
}

const DC_ACTION_ICONS: Record<string, string> = {
  tiepNhan: 'inbox',
  tuChoi: 'close-circle',
  chuyenXuLy: 'send',
  themXuLy: 'user-add',
  chiDao: 'audit',
  duyetPhuongAn: 'check-circle',
  hoanThanh: 'check-circle',
  xacNhanHoanThanh: 'safety-certificate',
  traLai: 'rollback',
  thuHoi: 'undo',
  xuLyLai: 'redo',
  khoiPhuc: 'reload',
  luuTraCuu: 'folder-open',
  luuSo: 'number',
  trinhXinYKien: 'send',
  chuyenTiepVanBan: 'swap',
  daXem: 'eye',
  phanLoai: 'tags',
  trinhKy: 'form',
  dongYDuThao: 'check',
  banHanh: 'export',
};

@Component({
  selector: 'app-document-detail-drawer',
  standalone: true,
  imports: [SharedModules, DcDocumentForm, DcFilePreviewTabs, DcDocumentPlanPanel, DcDocumentOpinionPanel, DcDocumentPhieuPanel],
  templateUrl: './document-detail-drawer.html',
  styleUrls: ['./document-detail-drawer.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailDrawer {
  @Input() mode: DrawerMode = 'incoming';
  @Output() saved = new EventEmitter<DcWorkflowNavigateHint | void>();

  cap: 'bo' | 'don-vi' = 'don-vi';
  stage = 'tiep-nhan';

  visible = false;
  model: any = {};
  planSelection: DcPlanSelection | null = null;
  planPreviewCount = 0;

  displaySymbol = '';
  statusLabel = '';
  statusColor = 'default';
  canEdit = false;
  actions: ActionButton[] = [];
  showIncomingWorkflowTabs = false;

  activityViews: ActivityView[] = [];
  hasActivities = false;
  showActivityEmpty = true;

  isFullBrowser = false;
  infoTabIndex = 0;
  panelDetailActive = true;
  panelFileActive = true;
  panelPlanActive = true;
  panelActivityActive = true;
  @ViewChild('filePreviewTabs') filePreviewTabs?: DcFilePreviewTabs;

  docTypeOptions: DcOption[] = [];
  fieldOptions: DcOption[] = [];
  urgencyOptions: DcOption[] = [];
  securityOptions: DcOption[] = [];
  organizeOptions: DcOption[] = [];
  issuingOrgOptions: DcOption[] = [];
  bookOptions: DcOption[] = [];
  accountOptions: DcOption[] = [];

  incomingPhieu: DocumentIncomingPhieu[] = [];
  outgoingPhieu: DocumentOutgoingPhieu[] = [];
  @ViewChild('phieuPanel') phieuPanel?: DcDocumentPhieuPanel;

  attachmentName = '';

  pendingAction: ActionButton | null = null;
  actionNote = '';
  actionRecipient = '';
  actionPhanLoai: number | null = null;
  actionBookId = '';

  readonly phanLoaiOptions = Object.entries(PHAN_LOAI_LABELS).map(([v, l]) => ({ value: +v, label: l }));

  constructor(
    private incomingService: DocumentIncomingService,
    private outgoingService: DocumentOutgoingService,
    private masterData: DcMasterDataService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isIncoming(): boolean {
    return this.mode === 'incoming';
  }

  toggleFullBrowser(full: boolean): void {
    this.isFullBrowser = full;
    this.cdr.markForCheck();
  }

  private loadMasterData(): void {
    this.masterData.documentTypes().subscribe(o => { this.docTypeOptions = o; this.cdr.markForCheck(); });
    this.masterData.fields().subscribe(o => { this.fieldOptions = o; this.cdr.markForCheck(); });
    this.masterData.urgencies().subscribe(o => { this.urgencyOptions = o; this.cdr.markForCheck(); });
    this.masterData.securities().subscribe(o => { this.securityOptions = o; this.cdr.markForCheck(); });
    this.masterData.organizes().subscribe(o => { this.organizeOptions = o; this.cdr.markForCheck(); });
    this.masterData.issuingOrgs().subscribe(o => { this.issuingOrgOptions = o; this.cdr.markForCheck(); });
    this.masterData.accounts().subscribe(o => { this.accountOptions = o; this.cdr.markForCheck(); });
    const bookType = this.isIncoming ? BookType.Incoming : BookType.Outgoing;
    this.masterData.documentBooks(bookType).subscribe(o => {
      this.bookOptions = o;
      if (!this.actionBookId && o.length) {
        const def = o[0]?.value;
        if (def) this.actionBookId = def;
      }
      if (!this.model.bookId && o.length) {
        const def = o.find(x => x.label?.includes('mặc định')) ?? o[0];
        if (def?.value && !this.model.soDen && !this.model.soVanBan) this.model.bookId = def.value;
      }
      this.cdr.markForCheck();
    });
  }

  private resetViewState(): void {
    this.displaySymbol = '';
    this.statusLabel = '';
    this.statusColor = 'default';
    this.canEdit = false;
    this.actions = [];
    this.showIncomingWorkflowTabs = false;
    this.activityViews = [];
    this.hasActivities = false;
    this.showActivityEmpty = true;
    this.planSelection = null;
    this.planPreviewCount = 0;
  }

  private syncViewState(): void {
    const m = this.model ?? {};
    if (this.isIncoming) {
      this.displaySymbol = m.soHieu || m.soDen || '';
      this.statusLabel = TRANG_THAI_VBD_LABELS[m.trangThai] ?? '';
      this.statusColor = TRANG_THAI_VBD_COLORS[m.trangThai] ?? 'default';
      this.canEdit = m.trangThai === TrangThaiVanBanDen.ChuaTiepNhan;
      this.showIncomingWorkflowTabs = m.trangThai !== TrangThaiVanBanDen.ChuaTiepNhan
        && m.trangThai !== TrangThaiVanBanDen.TuChoi;
    } else {
      this.displaySymbol = [m.soVanBan, m.soHieu].filter(Boolean).join(' ');
      this.statusLabel = TRANG_THAI_VBDI_LABELS[m.trangThai] ?? '';
      this.statusColor = TRANG_THAI_VBDI_COLORS[m.trangThai] ?? 'default';
      this.canEdit = m.trangThai === TrangThaiVanBanDi.DuThao || m.trangThai === TrangThaiVanBanDi.TraLai;
    }
    this.actions = this.buildActions(m.trangThai);
  }

  private mapActivities(items: DocumentActivity[]): void {
    this.activityViews = (items ?? []).map(a => ({
      ...a,
      actionLabel: ACTION_TYPE_LABELS[a.actionType || ''] || a.actionType || '',
    }));
    this.hasActivities = this.activityViews.length > 0;
    this.showActivityEmpty = !this.hasActivities;
  }

  private buildActions(trangThai: number): ActionButton[] {
    const icon = (key: string) => DC_ACTION_ICONS[key] ?? 'right-circle';
    const push = (list: ActionButton[], btn: Omit<ActionButton, 'icon'>) =>
      list.push({ ...btn, icon: icon(btn.key) });

    if (this.isIncoming) {
      const list: ActionButton[] = [];
      if (trangThai === TrangThaiVanBanDen.ChuaTiepNhan || trangThai === TrangThaiVanBanDen.DaTiepNhan) {
        if (!this.model.soDen) {
          push(list, { key: 'luuSo', label: 'Lưu số', type: 'primary', needBook: true });
        }
      }
      if (trangThai === TrangThaiVanBanDen.ChuaTiepNhan) {
        push(list, { key: 'tiepNhan', label: 'Tiếp nhận', type: 'primary', needPhanLoai: true });
        push(list, { key: 'tuChoi', label: 'Từ chối', danger: true, needNote: true });
      }
      if (trangThai === TrangThaiVanBanDen.DaTiepNhan || trangThai === TrangThaiVanBanDen.DangXuLy) {
        push(list, { key: 'duyetPhuongAn', label: 'Duyệt phương án', type: 'primary', needPlan: true });
        push(list, { key: 'chuyenXuLy', label: 'Chuyển xử lý', needPlan: true });
        push(list, { key: 'themXuLy', label: 'Thêm xử lý', needPlan: true });
        push(list, { key: 'trinhXinYKien', label: 'Trình xin ý kiến', needPlan: true });
        push(list, { key: 'chuyenTiepVanBan', label: 'Chuyển tiếp', needPlan: true });
        push(list, { key: 'chiDao', label: 'Lãnh đạo chỉ đạo', needUserRecipient: true, needNote: true });
        push(list, { key: 'phanLoai', label: 'Phân loại', needPhanLoai: true });
      }
      if (trangThai === TrangThaiVanBanDen.DangXuLy) {
        push(list, { key: 'hoanThanh', label: 'Hoàn thành', type: 'primary' });
        push(list, { key: 'xacNhanHoanThanh', label: 'Xác nhận hoàn thành' });
        push(list, { key: 'traLai', label: 'Trả lại', danger: true, needNote: true });
        push(list, { key: 'thuHoi', label: 'Thu hồi', needNote: true });
      }
      if (trangThai === TrangThaiVanBanDen.TraLai || trangThai === TrangThaiVanBanDen.ThuHoi) {
        push(list, { key: 'xuLyLai', label: 'Xử lý lại', type: 'primary' });
      }
      if (trangThai === TrangThaiVanBanDen.ThuHoi) {
        push(list, { key: 'khoiPhuc', label: 'Khôi phục' });
      }
      push(list, { key: 'daXem', label: 'Đã xem', type: 'dashed' });
      push(list, { key: 'luuTraCuu', label: 'Lưu tra cứu', type: 'dashed' });
      return list;
    }

    const list: ActionButton[] = [];
    if (trangThai === TrangThaiVanBanDi.DuThao || trangThai === TrangThaiVanBanDi.TraLai) {
      push(list, { key: 'trinhKy', label: 'Trình ký', type: 'primary', needUserRecipient: true });
      push(list, { key: 'xuLyLai', label: 'Xử lý lại', needUserRecipient: true });
    }
    if (trangThai === TrangThaiVanBanDi.ChoXuLy) {
      push(list, { key: 'dongYDuThao', label: 'Đồng ý dự thảo', type: 'primary' });
      push(list, { key: 'traLai', label: 'Trả lại', danger: true, needNote: true });
    }
    if (trangThai === TrangThaiVanBanDi.DangThucHien) {
      push(list, { key: 'hoanThanh', label: 'Hoàn thành', type: 'primary' });
      push(list, { key: 'traLai', label: 'Trả lại', danger: true, needNote: true });
    }
    if ((trangThai === TrangThaiVanBanDi.ChoBanHanh || trangThai === TrangThaiVanBanDi.DangThucHien) && !this.model.soVanBan) {
      push(list, { key: 'luuSo', label: 'Lưu số', type: 'primary', needBook: true });
    }
    if (trangThai === TrangThaiVanBanDi.ChoBanHanh) {
      push(list, { key: 'banHanh', label: 'Ban hành', type: 'primary' });
    }
    if (trangThai === TrangThaiVanBanDi.DaPhatHanh || trangThai === TrangThaiVanBanDi.ChoXuLy) {
      push(list, { key: 'thuHoi', label: 'Thu hồi', needNote: true });
    }
    if (trangThai === TrangThaiVanBanDi.ThuHoi) {
      push(list, { key: 'khoiPhuc', label: 'Khôi phục dự thảo' });
    }
    push(list, { key: 'daXem', label: 'Đã xem', type: 'dashed' });
    return list;
  }

  onPlanSelection(sel: DcPlanSelection): void {
    this.planSelection = sel;
    this.planPreviewCount = sel.planPreview.filter(x => !x.isNotCreatePlan).length;
    if (sel.leaderUsername) this.model.leaderUsername = sel.leaderUsername;
    if (sel.deXuatLanhDaoXuLy) this.model.deXuatLanhDaoXuLy = sel.deXuatLanhDaoXuLy;
    this.cdr.markForCheck();
  }

  onFileAttached(e: { fileId: string; fileName: string }): void {
    this.model.fileId = e.fileId;
    this.attachmentName = e.fileName;
    this.cdr.markForCheck();
  }

  onFilePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filePreviewTabs?.uploadAndOpen(Array.from(input.files ?? []));
    input.value = '';
  }

  removeFile(): void {
    if (this.model.fileId) {
      this.filePreviewTabs?.closeTabByFileId(String(this.model.fileId));
    }
    this.model.fileId = null;
    this.attachmentName = '';
    this.cdr.markForCheck();
  }

  openFilePreview(): void {
    if (!this.model.fileId) return;
    this.filePreviewTabs?.openOrActivateTab(String(this.model.fileId), this.attachmentName);
  }

  private loadAttachmentMeta(fileId: string): void {
    this.fileService.getById(fileId).subscribe({
      next: (res: any) => {
        const f = res?.data ?? res;
        this.attachmentName = f?.fileName ?? f?.FileName ?? 'Tệp đính kèm';
        this.filePreviewTabs?.openOrActivateTab(String(fileId), this.attachmentName);
        this.cdr.markForCheck();
      },
      error: () => {
        this.attachmentName = 'Tệp đính kèm';
        this.filePreviewTabs?.openOrActivateTab(String(fileId), this.attachmentName);
        this.cdr.markForCheck();
      },
    });
  }

  open(id: string, cap: 'bo' | 'don-vi' = 'don-vi', stage = 'tiep-nhan'): void {
    this.cap = cap;
    this.stage = stage;
    this.isFullBrowser = false;
    this.infoTabIndex = 0;
    this.panelDetailActive = true;
    this.panelFileActive = true;
    this.panelPlanActive = true;
    this.panelActivityActive = true;
    this.pendingAction = null;
    this.attachmentName = '';
    this.filePreviewTabs?.clearTabs();
    this.resetViewState();
    this.visible = true;
    this.loadMasterData();
    const svc = this.mode === 'incoming' ? this.incomingService : this.outgoingService;
    svc.detail(id).subscribe((res: any) => {
      this.model = res || {};
      this.incomingPhieu = res?.phieuList ?? [];
      this.outgoingPhieu = res?.phieuList ?? [];
      if (this.model.bookId) this.actionBookId = this.model.bookId;
      this.syncViewState();
      if (this.model.fileId) {
        this.loadAttachmentMeta(this.model.fileId);
      } else {
        this.cdr.markForCheck();
      }
    });
    svc.activities(id).subscribe((res: any) => {
      this.mapActivities(res || []);
      this.cdr.markForCheck();
    });
  }

  close(): void {
    this.visible = false;
    this.pendingAction = null;
    this.isFullBrowser = false;
    this.filePreviewTabs?.clearTabs();
    this.resetViewState();
  }

  save(): void {
    if (!this.model.trichYeu) return;
    const svc = this.mode === 'incoming' ? this.incomingService : this.outgoingService;
    svc.update(this.model).subscribe({
      next: () => { this.saved.emit(); this.close(); this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck(),
    });
  }

  startAction(btn: ActionButton): void {
    if (btn.needNote || btn.needRecipient || btn.needUserRecipient || btn.needPhanLoai || btn.needBook) {
      this.pendingAction = btn;
      this.actionNote = '';
      this.actionRecipient = '';
      this.actionPhanLoai = null;
      if (btn.needBook) {
        this.actionBookId = this.model.bookId || this.bookOptions[0]?.value || '';
      }
      this.cdr.markForCheck();
    } else {
      this.runAction(btn);
    }
  }

  confirmAction(): void {
    if (this.pendingAction) this.runAction(this.pendingAction);
  }

  cancelAction(): void {
    this.pendingAction = null;
    this.cdr.markForCheck();
  }

  trackByActionKey = (_: number, item: ActionButton) => item.key;
  trackByActivityId = (_: number, item: ActivityView) => item.id ?? item.actedAt;

  private buildActionDto(btn: ActionButton): DocumentAction {
    const dto: DocumentAction = {
      id: this.model.id,
      note: this.actionNote || undefined,
      yKien: this.actionNote || undefined,
      phanLoai: btn.needPhanLoai ? this.actionPhanLoai ?? undefined : undefined,
    };
    if (btn.needUserRecipient && this.actionRecipient) {
      dto.toUsernames = [this.actionRecipient];
    } else if (btn.needRecipient && this.actionRecipient) {
      dto.toOrganizationIds = [this.actionRecipient];
    }
    if (btn.needPlan && this.planSelection) {
      if (this.planSelection.toUsernames?.length) {
        dto.toUsernames = [...this.planSelection.toUsernames];
      }
      if (this.planSelection.toOrganizationIds?.length) {
        dto.toOrganizationIds = [...this.planSelection.toOrganizationIds];
      }
    }
    if (btn.key === 'trinhXinYKien') {
      dto.yKien = this.model.xinYKienText || dto.yKien;
      dto.vaiTroXuLy = VaiTroXuLy.YKien;
    }
    if (btn.key === 'chiDao') {
      dto.vaiTroXuLy = VaiTroXuLy.ChuTri;
    }
    if (btn.needBook) {
      dto.bookId = this.actionBookId || this.model.bookId;
    }
    return dto;
  }

  savePhieu(): void {
    const docId = this.model?.id;
    if (!docId) return;
    const payload = this.phieuPanel?.getPayload() ?? [];
    const req$ = this.isIncoming
      ? this.incomingService.savePhieu(docId, payload as DocumentIncomingPhieu[])
      : this.outgoingService.savePhieu(docId, payload as DocumentOutgoingPhieu[]);
    req$.subscribe({
      next: () => {
        const svc = this.isIncoming ? this.incomingService : this.outgoingService;
        svc.detail(docId).subscribe((res: any) => {
          this.model = res || this.model;
          this.incomingPhieu = res?.phieuList ?? [];
          this.outgoingPhieu = res?.phieuList ?? [];
          this.cdr.markForCheck();
        });
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  get showBookOnForm(): boolean {
    return this.stage === 'tiep-nhan' || this.stage === 'so-loai' || this.stage === 'ban-hanh';
  }

  get phieuCanEdit(): boolean {
    if (!this.model?.id) return false;
    if (this.isIncoming) {
      return this.model.trangThai !== TrangThaiVanBanDen.TuChoi
        && this.model.trangThai !== TrangThaiVanBanDen.HoanThanh;
    }
    return this.model.trangThai === TrangThaiVanBanDi.DuThao
      || this.model.trangThai === TrangThaiVanBanDi.TraLai
      || this.model.trangThai === TrangThaiVanBanDi.DangThucHien;
  }

  private savePlanIfAny(): Observable<unknown> {
    const docId = this.model?.id;
    const items = planSelectionToSaveItems(this.planSelection);
    if (!docId || !items.length) return of(null);
    return this.incomingService.savePlan(docId, items);
  }

  private runAction(btn: ActionButton): void {
    if (btn.needPlan && !this.planSelection?.planPreview?.length) {
      this.infoTabIndex = 1;
      this.cdr.markForCheck();
      return;
    }

    const dto = this.buildActionDto(btn);
    const incoming = this.mode === 'incoming';
    const svc: any = incoming ? this.incomingService : this.outgoingService;
    const fn = svc[btn.key];
    if (typeof fn !== 'function') return;

    const chain$: Observable<unknown> = incoming && btn.needPlan
      ? this.savePlanIfAny().pipe(switchMap(() => fn.call(svc, dto)))
      : fn.call(svc, dto);

    chain$.subscribe({
      next: () => {
        this.pendingAction = null;
        const hint = incoming
          ? navigateAfterIncomingAction(btn.key, this.cap, this.model.trangThai, this.model.phanLoai)
          : navigateAfterOutgoingAction(btn.key, this.cap);
        this.saved.emit(hint ?? undefined);
        this.close();
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }
}
