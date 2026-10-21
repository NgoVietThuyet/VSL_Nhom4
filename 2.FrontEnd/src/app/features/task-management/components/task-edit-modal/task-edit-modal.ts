import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnChanges, OnDestroy, Output, SimpleChanges,
} from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { OrganizeGroupService } from '../../../master-data/services/organize-group.service';
import { OrganizeGroupDto } from '../../../master-data/models/organize-group.model';
import { AccountService } from '../../../system-manager/services/account.service';
import { readCssSystemPrimary, readCssSystemPrimaryLight } from '../../../../core/utils/theme-tokens';
import { ExtractedTask, TASK_STATUS_LABELS, mergeExtractedTask } from '../../models';

export interface OrgPickerRow {
  id: string;
  name: string;
  isLead: boolean;
  isCoord: boolean;
  coordDisabled: boolean;
  leadDisabled: boolean;
}

export interface OrgPickerGroup {
  code: string;
  name: string;
  expanded: boolean;
  rows: OrgPickerRow[];
  isLeadAll: boolean;
  isLeadIndeterminate: boolean;
  isCoordAll: boolean;
  isCoordIndeterminate: boolean;
}

export interface SelectedOrgItem {
  id: string;
  name: string;
  role: 'lead' | 'coord';
  roleLabel: string;
  roleColor: string;
}

@Component({
  selector: 'app-task-edit-modal',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './task-edit-modal.html',
  styleUrl: './task-edit-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskEditModal implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() isCreateMode = false;
  @Input() task: ExtractedTask | null = null;
  @Input() mainTasks: any[] = [];
  @Input() organizes: any[] = [];
  @Input() userOrgIds: string[] = [];
  @Input() taskPriorities: any[] = [];
  @Input() documentFields: any[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ExtractedTask>();

  editTask: ExtractedTask | null = null;
  orgSearch = '';
  dispatchOrgId = '';
  orgPickerGroups: OrgPickerGroup[] = [];
  ungroupedOrgRows: OrgPickerRow[] = [];
  selectedOrgsList: SelectedOrgItem[] = [];
  selectedOrgCount = 0;
  canSave = false;
  organizeGroupsLoading = false;
  leaderOptions: { value: string; label: string }[] = [];
  @Input() issuingOrgs: any[] = [];
  formErrors: Record<string, string> = {};

  readonly SYSTEM_PRIMARY = readCssSystemPrimary();
  readonly SYSTEM_PRIMARY_LIGHT = readCssSystemPrimaryLight();
  readonly taskStatusOptions = Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({
    value: +k,
    label: v,
  }));

  private destroy$ = new Subject<void>();
  private coordIdSet = new Set<string>();
  private leadIdSet = new Set<string>();
  private orgNameById = new Map<string, string>();
  private loadedOrganizeGroups: OrganizeGroupDto[] = [];
  private groupExpandedState = new Map<string, boolean>();

  get topicGroupOptions(): { value: string; label: string }[] {
    return (this.mainTasks ?? []).map(g => ({
      value: g.id ?? '',
      label: g.name ?? '',
    }));
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private organizeGroupService: OrganizeGroupService,
    private accountService: AccountService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['organizes'] || changes['userOrgIds']) {
      this.rebuildOrgNameMap();
      if (this.editTask) {
        this.rebuildOrgPickerTree();
        this.refreshSelectedOrgs();
      }
    }
    if (changes['visible'] && this.visible) {
      this.initDispatchOrg();
      if (!this.loadedOrganizeGroups.length) {
        this.loadOrganizeGroups();
      }
    }
    if (changes['task'] || changes['visible']) {
      if (this.visible && this.task) {
        const cloned = JSON.parse(JSON.stringify(this.task)) as ExtractedTask;
        if (cloned.deadlineDate) {
          cloned.deadlineDate = new Date(cloned.deadlineDate as unknown as string);
        }
        if (cloned.startDate) {
          cloned.startDate = new Date(cloned.startDate as unknown as string);
        }
        if (!cloned.coordinateOrganizationIds) {
          cloned.coordinateOrganizationIds = [];
        }
        cloned.leadOrganizationIds = this.parseLeadIds(cloned);
        this.editTask = cloned;
        this.rebuildOrgPickerState();
      }
      this.cdr.markForCheck();
    }
    if (changes['visible'] && this.visible && this.loadedOrganizeGroups.length) {
      this.rebuildOrgPickerTree();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dispatchOrgOptions(): { id: string; name: string }[] {
    return this.userOrgIds
      .map(id => ({ id, name: this.orgNameById.get(id) ?? id }));
  }

  onDispatchOrgChange(orgId: string): void {
    this.dispatchOrgId = orgId;
    if (this.editTask) this.editTask.leaderUserName = '';
    this.rebuildOrgPickerTree();
    this.loadLeaders(orgId);
    this.cdr.markForCheck();
  }

  private readonly DOC_SIGNER_TITLES = ['BO_TRUONG', 'THU_TRUONG'];
  private readonly DOC_TITLE_NAMES: Record<string, string> = {
    BO_TRUONG: 'Bộ trưởng',
    THU_TRUONG: 'Thứ trưởng',
  };

  private loadLeaders(_orgId?: string): void {
    this.accountService.getAllByOrg(undefined, this.DOC_SIGNER_TITLES).pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any[]) => {
        this.leaderOptions = (users ?? []).map(u => {
          const userName = u.userName ?? u.UserName ?? '';
          const fullName = u.fullName ?? u.FullName ?? userName;
          const titleCode = u.titleCode ?? u.TitleCode ?? '';
          const titleName = titleCode ? (this.DOC_TITLE_NAMES[titleCode] ?? '') : '';
          return {
            value: userName,
            label: titleName ? `${fullName} - ${titleName}` : fullName,
          };
        }).filter(u => u.value);
        this.cdr.markForCheck();
      },
      error: () => { this.leaderOptions = []; this.cdr.markForCheck(); },
    });
  }

  onOrgSearchChange(value: string): void {
    this.orgSearch = value;
    this.rebuildOrgPickerTree();
    this.cdr.markForCheck();
  }

  onTaskContentChange(): void {
    if (this.isViewMode) return;
    this.canSave = !!this.editTask?.taskContent?.trim();
    if (this.editTask?.taskContent?.trim()) delete this.formErrors['taskContent'];
  }

  private validate(): boolean {
    const t = this.editTask!;
    const errors: Record<string, string> = {};
    if (!t.taskContent?.trim()) errors['taskContent'] = 'Vui lòng nhập nội dung nhiệm vụ';
    if (!t.fieldId) errors['fieldId'] = 'Vui lòng chọn lĩnh vực';
    if (!t.priorityLevelId) errors['priorityLevelId'] = 'Vui lòng chọn độ ưu tiên';
    // if (!t.issuerOrganizationId) errors['issuerOrganizationId'] = 'Vui lòng chọn đơn vị ban hành';
    if (!t.leaderUserName) errors['leaderUserName'] = 'Vui lòng chọn lãnh đạo chỉ đạo';
    // if (!t.startDate) errors['startDate'] = 'Vui lòng chọn ngày bắt đầu';
    if (!t.deadlineDate) errors['deadlineDate'] = 'Vui lòng chọn hạn hoàn thành';
    if (this.leadIdSet.size === 0) errors['orgs'] = 'Vui lòng chọn ít nhất một đơn vị chủ trì';
    this.formErrors = errors;
    this.cdr.markForCheck();
    return Object.keys(errors).length === 0;
  }

  onLeadCheckedChange(row: OrgPickerRow, checked: boolean): void {
    if (!this.editTask || row.leadDisabled) return;
    const id = this.normalizeOrgId(row.id);
    if (checked) {
      this.leadIdSet.add(id);
      this.coordIdSet.delete(id);
    } else {
      this.leadIdSet.delete(id);
    }
    this.syncLeadIdsToTask();
    this.rebuildOrgPickerState();
    this.cdr.markForCheck();
  }

  onCoordCheckedChange(row: OrgPickerRow, checked: boolean): void {
    if (!this.editTask || row.coordDisabled) return;
    this.setCoord(row.id, checked);
  }

  onGroupLeadCheckedChange(group: OrgPickerGroup, checked: boolean): void {
    if (!this.editTask || !group.rows.length) return;
    for (const row of group.rows) {
      const id = this.normalizeOrgId(row.id);
      if (checked) {
        this.leadIdSet.add(id);
        this.coordIdSet.delete(id);
      } else {
        this.leadIdSet.delete(id);
      }
    }
    this.syncLeadIdsToTask();
    this.rebuildOrgPickerState();
    this.cdr.markForCheck();
  }

  onGroupCoordCheckedChange(group: OrgPickerGroup, checked: boolean): void {
    if (!this.editTask || !group.rows.length) return;
    for (const row of group.rows) {
      const id = this.normalizeOrgId(row.id);
      if (this.leadIdSet.has(id)) continue;
      if (checked) this.coordIdSet.add(id);
      else this.coordIdSet.delete(id);
    }
    this.syncLeadIdsToTask();
    this.rebuildOrgPickerState();
    this.cdr.markForCheck();
  }

  toggleGroupExpand(group: OrgPickerGroup, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    group.expanded = !group.expanded;
    this.groupExpandedState.set(group.code, group.expanded);
    this.cdr.markForCheck();
  }

  onRemoveSelected(orgId: string): void {
    if (!this.editTask) return;
    const id = this.normalizeOrgId(orgId);
    this.leadIdSet.delete(id);
    this.coordIdSet.delete(id);
    this.syncLeadIdsToTask();
    this.editTask.coordinateOrganizationIds = [...this.coordIdSet];
    this.rebuildOrgPickerState();
    this.cdr.markForCheck();
  }

  onDeadlineChange(): void {
    if (!this.editTask?.deadlineDate) {
      if (this.editTask) this.editTask.deadline = '';
      return;
    }
    const d = this.editTask.deadlineDate;
    this.editTask.deadline = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  onSave(): void {
    if (!this.editTask) return;
    if (!this.validate()) return;
    this.onDeadlineChange();
    this.syncLeadIdsToTask();
    const payload = mergeExtractedTask(this.editTask, this.editTask);
    if (this.userOrgIds.length > 1 && this.dispatchOrgId) {
      payload.dispatchOrgId = this.dispatchOrgId;
    }
    this.save.emit(payload);
    this.visibleChange.emit(false);
  }

  trackByOrgRowId(_index: number, row: OrgPickerRow): string {
    return row.id;
  }

  trackByGroupCode(_index: number, group: OrgPickerGroup): string {
    return group.code;
  }

  trackBySelectedOrgId(_index: number, item: SelectedOrgItem): string {
    return item.id;
  }

  private loadOrganizeGroups(): void {
    this.organizeGroupsLoading = true;
    this.organizeGroupService.search({ isPaging: false, pageSize: 9999 } as OrganizeGroupDto)
      .pipe(
        switchMap((res: any) => {
          const groups: OrganizeGroupDto[] = res?.data?.data ?? res?.data ?? [];
          if (!groups.length) return of([] as OrganizeGroupDto[]);
          return forkJoin(
            groups.map(g => this.organizeGroupService.detail(g.code ?? '').pipe(
              map((detailRes: any) => (detailRes?.data ?? detailRes ?? g) as OrganizeGroupDto),
              catchError(() => of(g)),
            )),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: groups => {
          this.loadedOrganizeGroups = [...groups].sort(
            (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
          );
          this.organizeGroupsLoading = false;
          this.rebuildOrgPickerTree();
          this.cdr.markForCheck();
        },
        error: () => {
          this.organizeGroupsLoading = false;
          this.rebuildOrgPickerTree();
          this.cdr.markForCheck();
        },
      });
  }

  private setCoord(orgId: string, checked: boolean): void {
    if (!this.editTask) return;
    const id = this.normalizeOrgId(orgId);
    if (this.leadIdSet.has(id)) return;
    const already = this.coordIdSet.has(id);
    if (already === checked) return;
    if (checked) this.coordIdSet.add(id);
    else this.coordIdSet.delete(id);
    this.editTask.coordinateOrganizationIds = [...this.coordIdSet];
    this.rebuildOrgPickerState();
    this.cdr.markForCheck();
  }

  private parseLeadIds(task: ExtractedTask): string[] {
    if (task.leadOrganizationIds?.length) {
      return task.leadOrganizationIds.map(id => this.normalizeOrgId(id)).filter(Boolean);
    }
    const raw = this.normalizeOrgId(task.leadOrganizationId);
    if (!raw || raw === 'true' || raw === 'false') return [];
    return raw.split(',').map(id => this.normalizeOrgId(id)).filter(Boolean);
  }

  private syncLeadIdsToTask(): void {
    if (!this.editTask) return;
    this.editTask.leadOrganizationIds = [...this.leadIdSet];
    this.editTask.leadOrganizationId = this.editTask.leadOrganizationIds.join(',');
    this.editTask.coordinateOrganizationIds = [...this.coordIdSet];
  }

  private normalizeOrgId(id: unknown): string {
    return id == null || id === '' ? '' : String(id);
  }

  private initDispatchOrg(): void {
    if (!this.userOrgIds.length) { this.dispatchOrgId = ''; this.leaderOptions = []; return; }

    // When editing an existing task, restore the saved dispatch org
    const savedOrg = this.task?.dispatchOrgId;
    if (savedOrg && this.userOrgIds.includes(savedOrg)) {
      this.dispatchOrgId = savedOrg;
      this.loadLeaders(savedOrg);
      return;
    }

    if (this.userOrgIds.length === 1) {
      this.dispatchOrgId = this.userOrgIds[0];
      this.loadLeaders(this.userOrgIds[0]);
      return;
    }
    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 99;
      visited.add(id);
      const org = this.organizes.find(o => o.id === id);
      if (!org || !org.pId || org.pId === 'ORG') return 1;
      return 1 + getDepth(org.pId, visited);
    };
    let best = this.userOrgIds[0];
    let bestDepth = getDepth(best);
    for (const id of this.userOrgIds.slice(1)) {
      const d = getDepth(id);
      if (d < bestDepth) { best = id; bestDepth = d; }
    }
    this.dispatchOrgId = best;
    this.loadLeaders(best);
  }

  private rebuildOrgNameMap(): void {
    this.orgNameById = new Map(
      this.organizes.map(o => [this.normalizeOrgId(o.id), o.name ?? String(o.id)]),
    );
  }

  private rebuildOrgPickerState(): void {
    if (!this.editTask) {
      this.coordIdSet = new Set();
      this.leadIdSet = new Set();
      this.orgPickerGroups = [];
      this.ungroupedOrgRows = [];
      this.selectedOrgsList = [];
      this.selectedOrgCount = 0;
      return;
    }
    this.rebuildOrgNameMap();
    this.editTask.leadOrganizationIds = this.parseLeadIds(this.editTask);
    this.leadIdSet = new Set(this.editTask.leadOrganizationIds);
    this.editTask.coordinateOrganizationIds = (this.editTask.coordinateOrganizationIds ?? [])
      .map(id => this.normalizeOrgId(id))
      .filter(Boolean);
    this.coordIdSet = new Set(this.editTask.coordinateOrganizationIds);
    this.canSave = !this.isViewMode && !! this.editTask?.taskContent?.trim();
    this.rebuildOrgPickerTree();
    this.refreshSelectedOrgs();
  }

  private rebuildOrgPickerTree(): void {
    const q = this.orgSearch.trim().toLowerCase();
    const groupedOrgIds = new Set<string>();

    const filteredGroups = this.dispatchOrgId
      ? this.loadedOrganizeGroups.filter(g => g.orgId === this.dispatchOrgId)
      : this.loadedOrganizeGroups;

    this.orgPickerGroups = filteredGroups
      .map(g => {
        const links = g.organizeGroupOrgs ?? [];
        links.forEach(link => {
          const id = this.normalizeOrgId(link.orgId);
          if (id) groupedOrgIds.add(id);
        });

        let rows = links
          .map(link => {
            const id = this.normalizeOrgId(link.orgId);
            if (!id) return null;
            const name = link.orgName || this.orgNameById.get(id) || id;
            return this.toOrgPickerRow(id, name);
          })
          .filter((row): row is OrgPickerRow => !!row);

        if (q) {
          const groupMatch = (g.name ?? g.code ?? '').toLowerCase().includes(q);
          rows = rows.filter(r => groupMatch || r.name.toLowerCase().includes(q));
        }

        const expanded = q
          ? rows.length > 0
          : (this.groupExpandedState.get(g.code ?? '') ?? false);

        const group: OrgPickerGroup = {
          code: g.code ?? '',
          name: g.name ?? g.code ?? '',
          expanded,
          rows,
          isLeadAll: false,
          isLeadIndeterminate: false,
          isCoordAll: false,
          isCoordIndeterminate: false,
        };
        return this.enrichGroupCheckState(group);
      })
      .filter(g => g.rows.length > 0);

    if (this.dispatchOrgId) {
      this.ungroupedOrgRows = [];
    } else {
      this.ungroupedOrgRows = this.organizes
        .map(o => {
          const id = this.normalizeOrgId(o.id);
          if (!id || groupedOrgIds.has(id)) return null;
          return this.toOrgPickerRow(id, o.name ?? id);
        })
        .filter((row): row is OrgPickerRow => !!row)
        .filter(r => !q || r.name.toLowerCase().includes(q));
    }
  }

  private toOrgPickerRow(id: string, name: string): OrgPickerRow {
    return {
      id,
      name,
      isLead: this.leadIdSet.has(id),
      isCoord: this.coordIdSet.has(id),
      coordDisabled: this.leadIdSet.has(id),
      leadDisabled: false,
    };
  }

  private enrichGroupCheckState(group: OrgPickerGroup): OrgPickerGroup {
    const total = group.rows.length;
    if (!total) return group;
    const leadCount = group.rows.filter(r => this.leadIdSet.has(r.id)).length;
    const coordEligible = group.rows.filter(r => !this.leadIdSet.has(r.id));
    const coordCount = coordEligible.filter(r => this.coordIdSet.has(r.id)).length;
    group.isLeadAll = leadCount === total;
    group.isLeadIndeterminate = leadCount > 0 && leadCount < total;
    group.isCoordAll = coordEligible.length > 0 && coordCount === coordEligible.length;
    group.isCoordIndeterminate = coordCount > 0 && coordCount < coordEligible.length;
    return group;
  }

  private refreshSelectedOrgs(): void {
    if (!this.editTask) {
      this.selectedOrgsList = [];
      this.selectedOrgCount = 0;
      return;
    }
    const list: SelectedOrgItem[] = [];
    for (const id of this.leadIdSet) {
      list.push(this.toSelectedItem(id, 'lead'));
    }
    for (const id of this.coordIdSet) {
      if (!this.leadIdSet.has(id)) {
        list.push(this.toSelectedItem(id, 'coord'));
      }
    }
    this.selectedOrgsList = list;
    this.selectedOrgCount = list.length;
  }

  private toSelectedItem(id: string, role: 'lead' | 'coord'): SelectedOrgItem {
    return {
      id,
      name: this.orgNameById.get(id) ?? id,
      role,
      roleLabel: role === 'lead' ? 'Chủ trì' : 'Phối hợp',
      roleColor: role === 'lead' ? this.SYSTEM_PRIMARY : this.SYSTEM_PRIMARY_LIGHT,
    };
  }
  get isViewMode(): boolean {
    return !!this.task?.id && (this.task?.status ?? 0) !== 0;
  }
}
