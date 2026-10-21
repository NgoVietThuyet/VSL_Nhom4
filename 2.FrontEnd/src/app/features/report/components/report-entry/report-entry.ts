import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { GlobalService } from '../../../../core/services/global.service';
import { EnvironmentService } from '../../../../core/services/environment.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { ReportService } from '../../services/report.service';
import { ReportDto, ReportDataDto, ReportEntryDto } from '../../models/report.model';
import { GridModel, buildGridModel, gridCellCode } from '../../utils/report-grid.builder';
import { FormulaEngine } from '../../utils/formula-engine';
import { validateCell } from '../../utils/cell-validator';
import { LocalStorageUtils } from '../../../../shared/utils';
import { SignalRService } from '../../../../shared/services/signalr.service';

@Component({
  selector: 'app-report-entry',
  imports: [SharedModules],
  templateUrl: './report-entry.html'
})
export class ReportEntry implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cellChange$ = new Subject<string>();
  private recalc$ = new Subject<void>();
  reportId = '';
  entry: ReportEntryDto = { report: new ReportDto(), structure: [], data: [], formulas: [] };
  gridModel: GridModel | null = null;
  values: { [code: string]: string } = {};
  history: any[] = [];
  collapsed: { [id: string]: boolean } = {};
  hiddenIds = new Set<string>();
  cellErrors: { [code: string]: string } = {};
  formulaErrors: { [target: string]: string } = {};
  circularRefs: string[] = [];
  // Undo/Redo stacks (snapshots of values map)
  undoStack: { [code: string]: string }[] = [];
  redoStack: { [code: string]: string }[] = [];
  private parentMap = new Map<string, any>();
  private formulaEngine: FormulaEngine | null = null;
  dirtyCells = new Set<string>();
  isAutoSaving = false;
  isSaving = false;
  autoSaveEnabled = localStorage.getItem('report.autoSave') !== 'false';
  accountInfo: any;

  viewMode: 'table' | 'quick' = 'table';

  workflowVisible = false;
  workflowAction = '';
  workflowComment = '';
  workflowAssignedTo = '';
  communeTreeData: any[] = [];
  historyVisible = false;

  // Cell info drawer (P3): comments + dependency + formula debug
  cellInfoVisible = false;
  cellInfoCode = '';
  cellInfoTab: 'comments' | 'deps' | 'debug' = 'comments';
  cellInfoTabIdx = 0;
  cellComments: any[] = [];
  newCommentContent = '';
  cellDeps: string[] = [];
  cellDependents: string[] = [];
  cellDebug: { deps: { code: string; value: string }[]; result: string; error?: string } = { deps: [], result: '' };

  get isThonRole(): boolean {
    return this.accountInfo?.orgId === 'THON' || this.accountInfo?.userName === 'TT';
  }

  get isXaRole(): boolean {
    return this.accountInfo?.orgId === 'XA' || this.accountInfo?.userName === 'xa01';
  }

  constructor(
    private global: GlobalService,
    private env: EnvironmentService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private service: ReportService,
    private modal: NzModalService,
    private signalR: SignalRService
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id') || '';
    this.global.setBreadcrumb([
      { name: 'Báo cáo', path: 'report/list' },
      { name: 'Nhập dữ liệu', path: `report/entry/${this.reportId}` }
    ]);
    this.cellChange$.pipe(debounceTime(800), takeUntil(this.destroy$)).subscribe(() => {
      if (this.autoSaveEnabled && this.canEdit() && this.dirtyCells.size > 0) this.silentSave();
    });
    this.recalc$.pipe(debounceTime(150), takeUntil(this.destroy$)).subscribe(() => this.runRecalc());
    this.signalR.reportEvent$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (event: any) => {
        if (event && event.reportId === this.reportId) {
          // Skip reloading if the save event was triggered by the current user to prevent overwriting active local typing state
          if (event.action === 'SAVE' && event.actor === this.accountInfo?.userName) {
            return;
          }
          this.load();
        }
      }
    });
    this.load();
  }

  load() {
    this.service.entry(this.reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.entry = res || { report: new ReportDto(), structure: [], data: [], formulas: [] };
        console.log('--- REPORT ENTRY DETAILS ---');
        console.log('StatusCode:', this.entry?.report?.statusCode);
        console.log('CanApprove flag from API:', this.entry?.canApprove);
        console.log('AccountInfo:', this.accountInfo);
        console.log('isXaRole:', this.isXaRole);
        console.log('isThonRole:', this.isThonRole);
        console.log('canApprove() returns:', this.canApprove());
        this.gridModel = buildGridModel(this.entry.structure || []);
        this.values = {};
        for (const d of (this.entry.data || [])) {
          if (d.cellCode) this.values[d.cellCode] = d.value || '';
        }
        this.buildParentMap();
        this.recomputeHidden();
        this.buildFormulaEngine();
        this.rebuildMergeSkip();
        this.runRecalc();
        this.dirtyCells.clear();
        this.undoStack = [];
        this.redoStack = [];
      }
    });
  }

  /** Build formula engine once after entry load. */
  private buildFormulaEngine(): void {
    const allCodes: string[] = [];
    if (this.gridModel) {
      this.gridModel.cellByKey.forEach((_, code) => allCodes.push(code));
      // Also include row codes in flat mode (single column reports)
      this.gridModel.rowLeaves.forEach(r => allCodes.push(r.code));
    }
    const formulas = (this.entry.formulas || []).map((f: any) => ({
      targetCode: f.targetCode, expression: f.expression, orderNumber: f.orderNumber
    }));
    this.formulaEngine = new FormulaEngine(formulas, allCodes);
    this.circularRefs = this.formulaEngine.circularReferences;
    if (this.circularRefs.length) {
      this.message.warning(`Phát hiện tham chiếu vòng ở: ${this.circularRefs.join(', ')}`);
    }
  }

  /** Run recalculation across all formulas in topo order. */
  private runRecalc(): void {
    if (!this.formulaEngine) return;
    const { values, errors } = this.formulaEngine.evaluate(this.values);
    // Apply rounding per target
    for (const code of Object.keys(values)) {
      if (values[code] !== this.values[code]) {
        const parts = code.split('_');
        const cell = this.cellAt(parts[0], parts[1]);
        const round = this.getEffectiveDecimalRound(cell);
        this.values[code] = this.applyDecimalRound(values[code], round);
      }
    }
    this.formulaErrors = errors;
    this.revalidateAll();
  }

  /** Validate every input cell and populate cellErrors. */
  private revalidateAll(): void {
    const errs: { [k: string]: string } = {};
    if (!this.gridModel) { this.cellErrors = errs; return; }
    this.gridModel.cellByKey.forEach((cell, code) => {
      if (!cell.isInput) return;
      const dt = cell.dataTypeCode;
      const rule = (cell.data as any)?.validationRule;
      const r = validateCell(this.values[code], dt, rule);
      if (!r.valid) errs[code] = r.error || 'Sai';
    });
    this.cellErrors = errs;
  }

  /** Build O(1) parent lookup once after load. */
  private buildParentMap(): void {
    this.parentMap.clear();
    if (!this.gridModel) return;
    const visit = (nodes: any[], parent: any | null) => {
      for (const n of nodes) {
        if (parent) this.parentMap.set(n.id, parent);
        if (n.children?.length) visit(n.children, n);
      }
    };
    visit(this.gridModel.rowTree, null);
  }

  /** Recompute hiddenIds set whenever collapsed state changes. */
  private recomputeHidden(): void {
    const hidden = new Set<string>();
    if (!this.gridModel) { this.hiddenIds = hidden; return; }
    const walk = (nodes: any[], hiddenByAncestor: boolean) => {
      for (const n of nodes) {
        const isCollapsed = !!this.collapsed[n.id];
        if (hiddenByAncestor) hidden.add(n.id);
        if (n.children?.length) walk(n.children, hiddenByAncestor || isCollapsed);
      }
    };
    walk(this.gridModel.rowTree, false);
    this.hiddenIds = hidden;
  }

  /** trackBy for *ngFor performance. */
  trackByCode = (_: number, item: any): string => item?.code ?? item?.node?.code ?? '';
  trackById = (_: number, item: any): string => item?.id ?? item?.node?.id ?? '';

  /** Called from template when a cell value changes (ngModelChange). */
  onCellChange(cellCode: string): void {
    // Push current state to undo stack (capped at 50 entries)
    this.undoStack.push({ ...this.values });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this.dirtyCells.add(cellCode);
    this.cellChange$.next(cellCode);
    this.recalc$.next();
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const prev = this.undoStack.pop()!;
    this.redoStack.push({ ...this.values });
    this.values = prev;
    Object.keys(prev).forEach(c => this.dirtyCells.add(c));
    this.runRecalc();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const nxt = this.redoStack.pop()!;
    this.undoStack.push({ ...this.values });
    this.values = nxt;
    Object.keys(nxt).forEach(c => this.dirtyCells.add(c));
    this.runRecalc();
  }

  /** Save only dirty cells without showing success message; for autosave. */
  private silentSave(): void {
    if (this.dirtyCells.size === 0) return;
    const codes = Array.from(this.dirtyCells);
    const data: ReportDataDto[] = codes.map(code => {
      const parts = code.split('_');
      const cell = this.cellAt(parts[0], parts[1]);
      const decimalRound = this.getEffectiveDecimalRound(cell);
      const roundedValue = this.applyDecimalRound(this.values[code], decimalRound);
      return { id: '', reportId: this.reportId, cellCode: code, value: roundedValue, notes: '' } as ReportDataDto;
    });
    this.isAutoSaving = true;
    this.service.saveData(this.reportId, data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.dirtyCells.clear();
        this.isAutoSaving = false;
      },
      error: () => { this.isAutoSaving = false; }
    });
  }

  cellCode(rowCode: string, colCode: string): string { return gridCellCode(rowCode, colCode); }
  cellAt(rowCode: string, colCode: string) { return this.gridModel?.cellByKey.get(this.cellCode(rowCode, colCode)); }

  /** Get effective decimal round (Cell → Row → Column). */
  getEffectiveDecimalRound(cell: any): number | null {
    if (!cell) return null;
    if (cell.data?.decimalRound !== null && cell.data?.decimalRound !== undefined) {
      return cell.data.decimalRound;
    }
    // Try to find from row and column
    const rowNode = cell.data?.rowNode;
    const colNode = cell.data?.colNode;
    if (rowNode?.decimalRound !== null && rowNode?.decimalRound !== undefined) return rowNode.decimalRound;
    if (colNode?.decimalRound !== null && colNode?.decimalRound !== undefined) return colNode.decimalRound;
    return null;
  }

  /** Apply decimal rounding to a value. */
  applyDecimalRound(value: string | number, decimalPlaces: number | null): string {
    if (decimalPlaces === null || decimalPlaces === undefined) return String(value);
    const num = Number(value);
    if (!isFinite(num)) return String(value);
    const multiplier = Math.pow(10, decimalPlaces);
    return String(Math.round(num * multiplier) / multiplier);
  }

  toggle(id: string) {
    this.collapsed[id] = !this.collapsed[id];
    this.recomputeHidden();
  }

  /** A row is hidden if any of its ancestors is collapsed. O(1) lookup. */
  isRowHidden(node: any): boolean {
    return this.hiddenIds.has(node?.id);
  }

  isLocked(): boolean {
    const s = this.entry?.report?.statusCode;
    return s === 'APPROVED' || s === 'LOCKED' || s === 'SUBMITTED';
  }

  canEdit(): boolean {
    const s = this.entry?.report?.statusCode;
    const roleCanEdit = this.entry?.canEdit !== false;
    return roleCanEdit && (s === 'DRAFT' || !s);
  }

  canApprove(): boolean {
    const s = this.entry?.report?.statusCode;
    const roleCanApprove = !!this.entry?.canApprove;
    return roleCanApprove && s === 'SUBMITTED';
  }

  save() {
    if (!this.canEdit()) { this.message.warning('Báo cáo đã khóa, không thể chỉnh sửa'); return; }
    const data: ReportDataDto[] = Object.keys(this.values).map(code => {
      const parts = code.split('_');
      const cell = this.cellAt(parts[0], parts[1]);
      const decimalRound = this.getEffectiveDecimalRound(cell);
      const roundedValue = this.applyDecimalRound(this.values[code], decimalRound);
      return {
        id: '', reportId: this.reportId, cellCode: code, value: roundedValue, notes: ''
      } as ReportDataDto;
    });
    this.isSaving = true;
    this.service.saveData(this.reportId, data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.dirtyCells.clear();
        this.message.success('Đã lưu dữ liệu');
        this.load();
      },
      error: () => { this.isSaving = false; }
    });
  }

  recalculate() {
    this.runRecalc();
    this.message.info('Đã tính lại công thức');
  }

  openWorkflow(action: string) {
    this.workflowAction = action;
    this.workflowComment = '';
    this.workflowAssignedTo = '';
    this.workflowVisible = true;
    if (action === 'submit') {
      this.loadCommuneTree();
    }
  }

  loadCommuneTree() {
    this.service.getCommuneTree().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const rawTree = res?.data || res || [];
        const assignedStr = this.entry?.report?.assignedTo || '';
        const assignedList = assignedStr.split(',').map((x: string) => x.trim()).filter((x: string) => !!x);
        
        const processNode = (node: any) => {
          if (node.value && assignedList.includes(node.value)) {
            node.disabled = true;
            node.nzDisabled = true;
          }
          if (node.children && node.children.length > 0) {
            node.children.forEach((child: any) => processNode(child));
          }
        };
        
        rawTree.forEach((node: any) => processNode(node));
        this.communeTreeData = [...rawTree];
      }
    });
  }

  closeWorkflow() { this.workflowVisible = false; }

  doWorkflow() {
    const action = this.workflowAction; 
    const comment = this.workflowComment;
    const assignedTo = this.workflowAssignedTo;
    
    if (action === 'submit' && this.dirtyCells.size > 0) {
      const data: ReportDataDto[] = Array.from(this.dirtyCells).map(code => {
        const parts = code.split('_');
        const cell = this.cellAt(parts[0], parts[1]);
        const decimalRound = this.getEffectiveDecimalRound(cell);
        const roundedValue = this.applyDecimalRound(this.values[code], decimalRound);
        return { id: '', reportId: this.reportId, cellCode: code, value: roundedValue, notes: '' } as ReportDataDto;
      });
      this.isSaving = true;
      this.service.saveData(this.reportId, data).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.dirtyCells.clear();
          this.isSaving = false;
          this.proceedWorkflow(action, comment, assignedTo);
        },
        error: () => {
          this.isSaving = false;
          this.message.error('Lưu dữ liệu thất bại trước khi gửi duyệt');
        }
      });
    } else {
      this.proceedWorkflow(action, comment, assignedTo);
    }
  }

  private proceedWorkflow(action: string, comment: string, assignedTo: string) {
    let obs;
    switch (action) {
      case 'submit': obs = this.service.submit(this.reportId, comment, assignedTo); break;
      case 'approve': obs = this.service.approve(this.reportId, comment); break;
      case 'return': obs = this.service.return(this.reportId, comment); break;
      case 'reject': obs = this.service.reject(this.reportId, comment); break;
      case 'lock': obs = this.service.lock(this.reportId, comment); break;
      default: return;
    }
    obs!.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.workflowVisible = false;
        this.message.success('Thành công');
        this.load();
      }
    });
  }

  onRejectClick() {
    this.modal.confirm({
      nzTitle: 'Xác nhận từ chối',
      nzContent: 'Bạn có đồng ý từ chối báo cáo này không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.service.reject(this.reportId, 'Từ chối báo cáo').pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.message.success('Đã từ chối báo cáo thành công');
            this.load();
          }
        });
      }
    });
  }

  doEditAgree() {
    this.service.editAgree(this.reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Đồng ý chỉnh sửa báo cáo thành công. Bây giờ bạn có thể nhập dữ liệu.');
        this.load();
      }
    });
  }

  aggregate() {
    this.service.aggregate(this.reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.message.success('Đã tổng hợp'); this.load(); }
    });
  }

  exportExcel() {
    this.service.exportExcel(this.reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const blob = res.body!;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${this.reportId}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.message.error('Xuất Excel thất bại')
    });
  }

  showHistory() {
    this.service.history(this.reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => { this.history = r || []; this.historyVisible = true; }
    });
  }

  back() { this.router.navigate(['/report/list']); }

  onAutoSaveToggle(enabled: boolean): void {
    localStorage.setItem('report.autoSave', String(enabled));
    this.message.info(enabled ? 'Đã bật tự động lưu' : 'Đã tắt tự động lưu — nhớ nhấn Lưu thủ công');
  }

  // ─── Helpers for template ───
  hasCellErrors(): boolean { return Object.keys(this.cellErrors).length > 0; }
  cellErrorsCount(): number { return Object.keys(this.cellErrors).length; }

  // Merge cells support: precomputed set of (rowCode|colCode) keys that should be skipped because
  // they are covered by another cell's rowSpan/colSpan. Recomputed when gridModel changes.
  private mergeSkipSet = new Set<string>();
  /** Build skip-set from cells with rowSpan>1 or colSpan>1. */
  private rebuildMergeSkip(): void {
    this.mergeSkipSet.clear();
    if (!this.gridModel) return;
    const rows = this.gridModel.rowLeaves;
    const cols = this.gridModel.columnLeaves;
    const rowIdx = new Map<string, number>();
    rows.forEach((r, i) => rowIdx.set(r.code, i));
    const colIdx = new Map<string, number>();
    cols.forEach((c, i) => colIdx.set(c.code, i));
    this.gridModel.cellByKey.forEach((cell) => {
      const rs = (cell.data as any)?.rowSpan || 1;
      const cs = (cell.data as any)?.colSpan || 1;
      if (rs <= 1 && cs <= 1) return;
      const ri = cell.rowCode ? rowIdx.get(cell.rowCode) : undefined;
      const ci = cell.colCode ? colIdx.get(cell.colCode) : undefined;
      if (ri === undefined || ci === undefined) return;
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = rows[ri + dr]; const cc = cols[ci + dc];
          if (rr && cc) this.mergeSkipSet.add(`${rr.code}|${cc.code}`);
        }
      }
    });
  }
  isMergeSkipped(rowCode: string, colCode: string): boolean {
    return this.mergeSkipSet.has(`${rowCode}|${colCode}`);
  }
  cellRowSpan(cell: any): number { return (cell?.data?.rowSpan && cell.data.rowSpan > 1) ? cell.data.rowSpan : 1; }
  cellColSpan(cell: any): number { return (cell?.data?.colSpan && cell.data.colSpan > 1) ? cell.data.colSpan : 1; }

  /** Move focus to neighbor cell. */
  private moveFocus(rowCode: string, colCode: string, drow: number, dcol: number): void {
    if (!this.gridModel) return;
    const rows = this.gridModel.rowLeaves;
    const cols = this.gridModel.columnLeaves;
    const ri = rows.findIndex(r => r.code === rowCode);
    const ci = cols.findIndex(c => c.code === colCode);
    if (ri < 0 || ci < 0) return;
    let nr = ri + drow, nc = ci + dcol;
    while (nr >= 0 && nr < rows.length && nc >= 0 && nc < cols.length) {
      const rc = rows[nr].code, cc = cols[nc].code;
      if (!this.isMergeSkipped(rc, cc)) {
        const cell = this.cellAt(rc, cc);
        if (cell?.isInput && !cell.isFormula) {
          const sel = `input.rp-cell-input[data-row="${rc}"][data-col="${cc}"]`;
          const el = document.querySelector(sel) as HTMLInputElement | null;
          if (el && !el.disabled) { el.focus(); el.select?.(); return; }
        }
      }
      nr += drow; nc += dcol;
    }
  }

  /** Per-input keydown for arrow / Tab / Enter navigation. */
  onCellKeydown(e: KeyboardEvent, rowCode: string, colCode: string): void {
    let dr = 0, dc = 0;
    switch (e.key) {
      case 'ArrowUp': dr = -1; break;
      case 'ArrowDown': dr = 1; break;
      case 'ArrowLeft': if ((e.target as HTMLInputElement).selectionStart === 0) dc = -1; else return; break;
      case 'ArrowRight': {
        const t = e.target as HTMLInputElement;
        if (t.selectionStart === (t.value?.length ?? 0)) dc = 1; else return;
        break;
      }
      case 'Enter': dr = e.shiftKey ? -1 : 1; break;
      case 'Tab': dc = e.shiftKey ? -1 : 1; break;
      default: return;
    }
    e.preventDefault();
    this.moveFocus(rowCode, colCode, dr, dc);
  }

  /**
   * Paste handler — supports pasting Excel range (\t-separated cols, \n-separated rows)
   * starting from the focused cell. Each pasted value triggers onCellChange + autosave.
   */
  onCellPaste(e: ClipboardEvent, rowCode: string, colCode: string): void {
    const text = e.clipboardData?.getData('text') || '';
    if (!text.includes('\t') && !text.includes('\n')) return; // single value, let default handle
    e.preventDefault();
    if (!this.gridModel) return;
    const rows = this.gridModel.rowLeaves;
    const cols = this.gridModel.columnLeaves;
    const startR = rows.findIndex(r => r.code === rowCode);
    const startC = cols.findIndex(c => c.code === colCode);
    if (startR < 0 || startC < 0) return;
    const lines = text.replace(/\r/g, '').split('\n').filter((l, i, a) => !(i === a.length - 1 && l === ''));
    // Push undo snapshot once for whole paste batch
    this.undoStack.push({ ...this.values });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    let touchedAny = false;
    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i].split('\t');
      for (let j = 0; j < cells.length; j++) {
        const r = rows[startR + i]; const c = cols[startC + j];
        if (!r || !c) continue;
        if (this.isMergeSkipped(r.code, c.code)) continue;
        const cell = this.cellAt(r.code, c.code);
        if (!cell?.isInput || cell.isFormula) continue;
        this.values[cell.code] = cells[j];
        this.dirtyCells.add(cell.code);
        this.cellChange$.next(cell.code);
        touchedAny = true;
      }
    }
    if (touchedAny) this.recalc$.next();
  }

  /** Keyboard shortcut handler — call from (window:keydown) in template if needed. */
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
    else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); }
    else if (key === 's') { e.preventDefault(); if (this.canEdit()) this.save(); }
  }

  /** nz-upload beforeUpload handler — sends file to server then reloads entry. */
  beforeImport = (file: any): boolean => {
    const fd = new FormData();
    fd.append('file', file as Blob, (file as any).name);
    this.service.importData(this.reportId, fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const count = (res && (res.data ?? res.Data)) ?? 0;
        this.message.success(`Đã import ${count} dòng dữ liệu`);
        this.load();
      },
      error: () => this.message.error('Import thất bại')
    });
    return false; // prevent default upload
  };

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }

  // ===== P3: Cell info (comments / dependency viewer / formula debugger) =====
  openCellInfo(rowCode: string, colCode: string, tab: 'comments' | 'deps' | 'debug' = 'comments') {
    const code = colCode ? this.cellCode(rowCode, colCode) : rowCode;
    this.cellInfoCode = code;
    this.cellInfoTab = tab;
    this.cellInfoTabIdx = tab === 'comments' ? 0 : tab === 'deps' ? 1 : 2;
    this.cellInfoVisible = true;
    this.loadCellComments();
    this.loadCellDeps();
    this.runCellDebug();
  }
  closeCellInfo() { this.cellInfoVisible = false; }

  loadCellComments() {
    this.service.getCellComments(this.reportId, this.cellInfoCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => { this.cellComments = r || []; }
    });
  }
  addCellComment() {
    const content = (this.newCommentContent || '').trim();
    if (!content) return;
    this.service.addCellComment({ reportId: this.reportId, cellCode: this.cellInfoCode, content }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.newCommentContent = ''; this.loadCellComments(); }
    });
  }
  deleteCellComment(id: string) {
    this.service.deleteCellComment(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadCellComments()
    });
  }
  loadCellDeps() {
    if (!this.formulaEngine) { this.cellDeps = []; this.cellDependents = []; return; }
    this.cellDeps = this.formulaEngine.getDependencies(this.cellInfoCode);
    this.cellDependents = this.formulaEngine.getDependents(this.cellInfoCode);
  }
  runCellDebug() {
    if (!this.formulaEngine) { this.cellDebug = { deps: [], result: '' }; return; }
    this.cellDebug = this.formulaEngine.debug(this.cellInfoCode, this.values);
  }

  get tableScrollX(): string {
    if (!this.gridModel || !this.gridModel.hasColumns) return '800px';
    return `${240 + this.gridModel.columnLeaves.length * 120}px`;
  }

  // ===== P3: Conditional formatting =====
  /** Parse Style field as conditional formatting rules JSON.
   * Format: { "rules": [{ "op": ">|>=|<|<=|=|!=", "value": number, "bg": "#hex", "fg": "#hex", "bold": true }] }
   * Returns ngStyle-compatible object.
   */
  getCellStyle(rowCode: string, colCode: string): { [k: string]: string } {
    const cell: any = colCode ? this.cellAt(rowCode, colCode) : this.gridModel?.flatRows.find(r => r.node.code === rowCode)?.node;
    if (!cell?.style) return {};
    let rules: any;
    try { rules = JSON.parse(cell.style); } catch { return {}; }
    if (!rules?.rules?.length) return {};
    const code = colCode ? this.cellCode(rowCode, colCode) : rowCode;
    const raw = this.values[code];
    const num = Number(raw);
    if (!isFinite(num)) return {};
    for (const r of rules.rules) {
      const v = Number(r.value);
      let match = false;
      switch (r.op) {
        case '>': match = num > v; break;
        case '>=': match = num >= v; break;
        case '<': match = num < v; break;
        case '<=': match = num <= v; break;
        case '=': match = num === v; break;
        case '!=': match = num !== v; break;
      }
      if (match) {
        const s: { [k: string]: string } = {};
        if (r.bg) s['background'] = r.bg;
        if (r.fg) s['color'] = r.fg;
        if (r.bold) s['font-weight'] = 'bold';
        return s;
      }
    }
    return {};
  }
}
