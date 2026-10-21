import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { LoaiVanBanBo, PHAN_LOAI_LABELS } from '../../models';
import { DcPlanSelection } from '../../models/document-tree-plan.model';
import { DocumentIncomingService } from '../../services/document-incoming.service';
import { TreePlanUtil } from '../../utils/tree-plan.util';
import { DcPlanTreeState } from './dc-plan-tree-state';

@Component({
  selector: 'app-dc-plan-tree',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-plan-tree.component.html',
  styleUrls: ['./dc-plan-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: flex; flex: 1; min-height: 0; height: 100%; width: 100%; }`],
})
export class DcPlanTreeComponent implements OnChanges {
  @Input() phanLoai: number | null = null;
  @Input() rootOrgId: string | null = null;
  @Input() deXuatLanhDaoXuLy: string | null = null;
  @Input() showPhanLoaiTags = true;

  @Output() phanLoaiChange = new EventEmitter<number | null>();
  @Output() deXuatLanhDaoChange = new EventEmitter<string | null>();
  @Output() selectionChange = new EventEmitter<DcPlanSelection>();

  state!: DcPlanTreeState;

  readonly phanLoaiOptions = [
    LoaiVanBanBo.VbTrinh,
    LoaiVanBanBo.VbThucHien,
    LoaiVanBanBo.VbNhanDeBiet,
    LoaiVanBanBo.VbChuyenTiep,
  ].map(v => ({ value: v, label: PHAN_LOAI_LABELS[v] }));

  leaderOptions: { userName: string; fullName: string }[] = [];

  readonly LoaiVanBanBo = LoaiVanBanBo;
  hideLeaderSelect = false;
  leaderPlaceholder = 'Lãnh đạo xử lý';

  constructor(
    private incomingService: DocumentIncomingService,
    private tree: TreePlanUtil,
    private cdr: ChangeDetectorRef,
  ) {
    this.state = new DcPlanTreeState(this.tree);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phanLoai'] && this.phanLoai != null) {
      this.loadTree();
    }
    if (changes['deXuatLanhDaoXuLy'] && this.phanLoai != null && !changes['phanLoai']) {
      this.loadTree();
    }
  }

  selectPhanLoai(value: number): void {
    const next = this.phanLoai === value ? null : value;
    this.phanLoaiChange.emit(next);
    if (next == null) {
      this.state.clear();
      this.emitSelection();
      this.cdr.markForCheck();
    }
  }

  onDeXuatLanhDaoChange(username: string | null): void {
    this.deXuatLanhDaoXuLy = username;
    this.deXuatLanhDaoChange.emit(username);
    if (this.phanLoai != null) this.loadTree();
  }

  loadTree(): void {
    if (this.phanLoai == null) return;
    this.hideLeaderSelect =
      this.phanLoai === LoaiVanBanBo.VbNhanDeBiet || this.phanLoai === LoaiVanBanBo.VbChuyenTiep;
    this.leaderPlaceholder =
      this.phanLoai === LoaiVanBanBo.VbThucHien ? 'Lãnh đạo trình ký' : 'Lãnh đạo xử lý';
    this.cdr.markForCheck();

    this.incomingService.buildTreePlan({
      phanLoai: this.phanLoai,
      rootOrgId: this.rootOrgId,
      deXuatLanhDaoXuLy: this.deXuatLanhDaoXuLy,
    }).subscribe({
      next: (res: any) => {
        const flat: any[] = (res?.data ?? res ?? []).map((n: any) => ({
          id: n.id ?? n.Id,
          pId: n.pId ?? n.PId,
          name: n.name ?? n.Name,
          nameKhongDau: n.nameKhongDau ?? n.NameKhongDau,
          type: n.type ?? n.Type,
          isDisabled: n.isDisabled ?? n.IsDisabled,
          isNotCreatePlan: n.isNotCreatePlan ?? n.IsNotCreatePlan,
          isLanhDao: n.isLanhDao ?? n.IsLanhDao,
          isChuTri: n.isChuTri ?? n.IsChuTri,
          isChuTriDisabled: n.isChuTriDisabled ?? n.IsChuTriDisabled ?? true,
          isXuLyChinh: n.isXuLyChinh ?? n.IsXuLyChinh,
          isXuLyChinhDisabled: n.isXuLyChinhDisabled ?? n.IsXuLyChinhDisabled,
          isPhoiHop: n.isPhoiHop ?? n.IsPhoiHop,
          isPhoiHopDisabled: n.isPhoiHopDisabled ?? n.IsPhoiHopDisabled,
          isNhanDeBiet: n.isNhanDeBiet ?? n.IsNhanDeBiet,
          isNhanDeBietDisabled: n.isNhanDeBietDisabled ?? n.IsNhanDeBietDisabled,
          isShowCheckbox: n.isShowCheckbox ?? n.IsShowCheckbox ?? true,
          kieuXuLyChecked: n.kieuXuLyChecked ?? n.KieuXuLyChecked,
          orderNumber: n.orderNumber ?? n.OrderNumber,
          expand: n.expand ?? n.Expand ?? true,
        }));
        this.leaderOptions = flat
          .filter(x => x.type === 'USER' && x.isLanhDao)
          .map(x => ({ userName: x.id, fullName: x.name ?? x.id }));
        this.state.initFromFlat(flat);
        this.emitSelection();
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  onSearchChange(): void {
    this.state.onSearchChange();
    this.cdr.markForCheck();
  }

  onCheckbox(item: any, field: 'isChuTri' | 'isXuLyChinh' | 'isPhoiHop' | 'isNhanDeBiet', checked: boolean): void {
    if (this.state.bulkUpdating) return;
    item[field] = checked;
    this.state.onChangeCheckbox(item, field);
    this.emitSelection();
    this.cdr.markForCheck();
  }

  onCheckboxAll(checked: boolean, field: 'isXuLyChinh' | 'isPhoiHop' | 'isNhanDeBiet'): void {
    setTimeout(() => {
      this.state.onChangeCheckboxAll(checked, field);
      this.emitSelection();
      this.cdr.markForCheck();
    }, 0);
  }

  onExpand(item: any, expanded: boolean): void {
    this.state.onExpandChange(item, expanded);
    this.cdr.markForCheck();
  }

  removePreview(item: any): void {
    this.state.deletePreviewPlan(item);
    this.emitSelection();
    this.cdr.markForCheck();
  }

  trackById = (_: number, x: { id?: string; value?: number; userName?: string }) =>
    x.id ?? x.value ?? x.userName ?? _;
  trackRow = (_: number, x: { id: string }) => x.id;

  private emitSelection(): void {
    const sel = this.state.getSelection();
    this.selectionChange.emit({
      planPreview: [...this.state.planPreview],
      toOrganizationIds: sel.toOrganizationIds,
      toUsernames: sel.toUsernames,
      leaderUsername: sel.leaderUsername,
      deXuatLanhDaoXuLy: this.deXuatLanhDaoXuLy ?? undefined,
    });
  }
}
