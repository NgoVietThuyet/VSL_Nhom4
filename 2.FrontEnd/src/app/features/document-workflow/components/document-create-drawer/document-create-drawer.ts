import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { DocumentIncomingService } from '../../services/document-incoming.service';
import { DocumentOutgoingService } from '../../services/document-outgoing.service';
import { DcMasterDataService, DcOption } from '../../services/dc-master-data.service';
import {
  CapXuLy,
  DocumentAction,
  DocumentIncoming,
  KieuVanBanDi,
  LoaiVanBanBo,
  TrangThaiVanBanDen,
  TrangThaiVanBanDi,
} from '../../models';
import { DcDocumentForm } from '../dc-document-form/dc-document-form';
import { DcFilePreviewTabs } from '../dc-file-preview-tabs/dc-file-preview-tabs';
import { DcDocumentPlanPanel } from '../dc-create-panels/dc-document-plan-panel';
import { DcDocumentOpinionPanel } from '../dc-create-panels/dc-document-opinion-panel';
import { DcPlanSelection } from '../../models/document-tree-plan.model';
import { planSelectionToSaveItems } from '../../utils/plan-save.util';
import { DcWorkflowNavigateHint, navigateAfterIncomingAction } from '../../utils/dc-workflow-nav.util';

type DrawerMode = 'incoming' | 'outgoing';

interface CreateHeaderButton {
  key: string;
  label: string;
  icon: string;
  type?: 'primary' | 'default' | 'dashed';
}

@Component({
  selector: 'app-document-create-drawer',
  standalone: true,
  imports: [SharedModules, DcDocumentForm, DcDocumentPlanPanel, DcDocumentOpinionPanel, DcFilePreviewTabs],
  templateUrl: './document-create-drawer.html',
  styleUrls: ['../document-detail-drawer/document-detail-drawer.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentCreateDrawer {
  @Input() mode: DrawerMode = 'incoming';
  @Output() saved = new EventEmitter<DcWorkflowNavigateHint | void>();

  visible = false;
  cap: 'bo' | 'don-vi' = 'don-vi';
  model: any = {};
  planSelection: DcPlanSelection | null = null;
  planPreviewCount = 0;

  isFullBrowser = false;
  infoTabIndex = 0;
  panelDetailActive = true;
  panelFileActive = true;
  panelPlanActive = true;
  @ViewChild('filePreviewTabs') filePreviewTabs?: DcFilePreviewTabs;

  docTypeOptions: DcOption[] = [];
  fieldOptions: DcOption[] = [];
  urgencyOptions: DcOption[] = [];
  securityOptions: DcOption[] = [];
  organizeOptions: DcOption[] = [];

  attachmentName = '';

  readonly incomingHeaderButtons: CreateHeaderButton[] = [
    { key: 'chuyenTiep', label: 'Chuyển tiếp văn bản', icon: 'swap', type: 'default' },
    { key: 'trinhXinYKien', label: 'Trình xin ý kiến', icon: 'send', type: 'default' },
    { key: 'luuThongTin', label: 'Lưu thông tin', icon: 'save', type: 'primary' },
    { key: 'luuTraCuu', label: 'Lưu tra cứu', icon: 'folder-open', type: 'dashed' },
  ];

  constructor(
    private incomingService: DocumentIncomingService,
    private outgoingService: DocumentOutgoingService,
    private masterData: DcMasterDataService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isIncoming(): boolean {
    return this.mode === 'incoming';
  }

  get headerButtons(): CreateHeaderButton[] {
    return this.isIncoming ? this.incomingHeaderButtons : [];
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

  open(capXuLy: number = CapXuLy.DonVi, cap: 'bo' | 'don-vi' = 'don-vi'): void {
    this.cap = cap;
    this.isFullBrowser = false;
    this.infoTabIndex = 0;
    this.panelDetailActive = true;
    this.panelFileActive = true;
    this.panelPlanActive = true;
    this.attachmentName = '';
    this.filePreviewTabs?.clearTabs();
    this.planSelection = null;
    this.planPreviewCount = 0;
    this.model = this.mode === 'incoming'
      ? {
        capXuLy,
        trangThai: TrangThaiVanBanDen.ChuaTiepNhan,
        ngayDen: new Date(),
        phanLoai: null,
        deXuatLanhDaoXuLy: null,
        xinYKienText: 'Kính trình!',
      }
      : { kieuVanBan: KieuVanBanDi.DuThao, trangThai: TrangThaiVanBanDi.DuThao };
    this.loadMasterData();
    this.visible = true;
    this.cdr.markForCheck();
  }

  close(): void {
    this.visible = false;
    this.isFullBrowser = false;
    this.filePreviewTabs?.clearTabs();
  }

  onHeaderAction(key: string): void {
    switch (key) {
      case 'luuThongTin': this.luuThongTin(false); break;
      case 'luuTraCuu': this.luuTraCuu(); break;
      case 'chuyenTiep': this.chuyenTiepVanBan(); break;
      case 'trinhXinYKien': this.trinhXinYKien(); break;
      default: break;
    }
  }

  save(): void {
    if (this.isIncoming) {
      this.luuThongTin(false);
    } else {
      this.luuThongTinOutgoing();
    }
  }

  private luuThongTinOutgoing(): void {
    if (!this.model.trichYeu) return;
    this.outgoingService.create(this.model).subscribe({
      next: () => { this.saved.emit(); this.close(); this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck(),
    });
  }

  luuThongTin(closeAfter: boolean): void {
    if (!this.model.trichYeu) return;
    this.persistIncoming().subscribe({
      next: () => {
        if (closeAfter) {
          this.saved.emit();
          this.close();
        }
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  luuTraCuu(): void {
    if (!this.model.trichYeu) return;
    this.persistIncoming().pipe(
      switchMap(() => {
        const dto: DocumentAction = { id: this.model.id, note: this.model.note };
        return this.incomingService.luuTraCuu(dto);
      }),
    ).subscribe({
      next: () => {
        this.saved.emit();
        this.close();
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  onPlanSelection(sel: DcPlanSelection): void {
    this.planSelection = sel;
    this.planPreviewCount = sel.planPreview.filter(x => !x.isNotCreatePlan).length;
    if (sel.leaderUsername) this.model.leaderUsername = sel.leaderUsername;
    if (sel.deXuatLanhDaoXuLy) this.model.deXuatLanhDaoXuLy = sel.deXuatLanhDaoXuLy;
    this.cdr.markForCheck();
  }

  chuyenTiepVanBan(): void {
    if (!this.model.trichYeu) return;
    const orgIds = this.planSelection?.toOrganizationIds?.length
      ? this.planSelection.toOrganizationIds
      : [];
    if (!orgIds.length) {
      this.infoTabIndex = 1;
      this.cdr.markForCheck();
      return;
    }

    this.model.phanLoai = LoaiVanBanBo.VbChuyenTiep;
    this.persistIncoming().pipe(
      switchMap(() => this.tiepNhanIfNeeded()),
      switchMap(() => {
        const dto: DocumentAction = {
          id: this.model.id,
          toOrganizationIds: orgIds,
          note: this.model.noiDung || this.model.note,
          phanLoai: this.model.phanLoai,
        };
        return this.incomingService.chuyenTiepVanBan(dto);
      }),
    ).subscribe({
      next: () => {
        this.emitSaved('chuyenTiepVanBan');
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  trinhXinYKien(): void {
    if (!this.model.trichYeu) return;
    const users = this.planSelection?.toUsernames?.length
      ? this.planSelection.toUsernames
      : (this.model.leaderUsername ? [this.model.leaderUsername] : []);
    if (!users.length) {
      this.infoTabIndex = 2;
      this.cdr.markForCheck();
      return;
    }
    this.model.leaderUsername = users[0];

    this.persistIncoming().pipe(
      switchMap(() => this.tiepNhanIfNeeded()),
      switchMap(() => {
        const dto: DocumentAction = {
          id: this.model.id,
          toUsernames: users,
          yKien: this.model.xinYKienText,
          note: this.model.xinYKienText || this.model.note,
          hanXuLy: this.model.hanXuLy,
        };
        return this.incomingService.trinhXinYKien(dto);
      }),
    ).subscribe({
      next: () => {
        this.emitSaved('trinhXinYKien');
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private emitSaved(actionKey: string): void {
    const hint = navigateAfterIncomingAction(actionKey, this.cap, this.model.trangThai, this.model.phanLoai);
    this.saved.emit(hint ?? undefined);
    this.close();
    this.cdr.markForCheck();
  }

  private persistIncoming(): Observable<unknown> {
    const payload = { ...this.model } as DocumentIncoming;
    const saveDoc$ = this.model.id
      ? this.incomingService.update(payload).pipe(
        tap((res: any) => {
          const data = res?.data ?? res;
          if (data?.id) this.model = { ...this.model, ...data };
        }),
      )
      : this.incomingService.create(payload).pipe(
        tap((res: any) => {
          const data = res?.data ?? res;
          if (data) this.model = { ...this.model, ...data };
        }),
      );

    return saveDoc$.pipe(
      switchMap(() => this.savePlanIfAny()),
    );
  }

  private savePlanIfAny(): Observable<unknown> {
    const docId = this.model?.id;
    const items = planSelectionToSaveItems(this.planSelection);
    if (!docId || !items.length) return of(null);
    return this.incomingService.savePlan(docId, items);
  }

  private tiepNhanIfNeeded(): Observable<unknown> {
    if (this.model.trangThai !== TrangThaiVanBanDen.ChuaTiepNhan) {
      return of(null);
    }
    const dto: DocumentAction = {
      id: this.model.id,
      phanLoai: this.model.phanLoai,
      note: this.model.note,
    };
    return this.incomingService.tiepNhan(dto).pipe(
      tap(() => {
        this.model.trangThai = TrangThaiVanBanDen.DaTiepNhan;
      }),
    );
  }

  trackByHeaderBtn = (_: number, b: CreateHeaderButton) => b.key;
}
