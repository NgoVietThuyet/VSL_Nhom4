import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { HrmMasterDataService } from '../../services';
import { HrmShiftDto, HrmLeaveTypeDto, HrmSalaryStructureDto, HrmSalaryItemDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  SalaryItemTypeOption,
  SalaryVariableCategoryKey,
  SalaryVariableCategory,
  SalaryItemPreset,
  SalaryFormulaVariable,
  SalaryFormulaToken,
  SalaryFormulaVariableGroup,
  SalaryComponentVariableGroup,
  SalaryAvailableVariable,
  SALARY_VARIABLE_CATEGORIES,
  SALARY_AVAILABLE_VARIABLES,
  SALARY_ITEM_TYPES
} from '../../constants';

@Component({
  selector: 'app-hrm-master-data',
  imports: [SharedModules],
  templateUrl: './hrm-master-data.html',
  styleUrls: ['./hrm-master-data.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrmMasterData implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // ── debounced formula input ──────────────────────────────────────────────
  private formulaInput$ = new Subject<string>();
  // ── state ────────────────────────────────────────────────────────────────
  activeTab = 0;
  visibleShift = false;
  visibleLeaveType = false;
  visibleSalary = false;
  isEditShift = false;
  isEditLeaveType = false;
  isEditSalary = false;
  shifts: HrmShiftDto[] = [];
  leaveTypes: HrmLeaveTypeDto[] = [];
  salaryStructures: HrmSalaryStructureDto[] = [];
  salaryItems: HrmSalaryItemDto[] = [];
  shiftDto: HrmShiftDto = new HrmShiftDto();
  leaveTypeDto: HrmLeaveTypeDto = new HrmLeaveTypeDto();
  salaryDto: HrmSalaryStructureDto = new HrmSalaryStructureDto();
  salaryStep = 0;
  salaryFormulaTokens: SalaryFormulaToken[] = [];
  salaryFormulaNumber = '';
  formulaRawText = '';
  componentVariableSearch = '';
  formulaVariableSearch = '';
  formulaTextErrors: { word: string; msg: string }[] = [];
  formulaConvertedPreview = '';
  formulaConvertedTokens: { text: string; kind: 'ok' | 'err' | 'op' | 'num'; label?: string }[] = [];
  formulaQuickInput = '';
  // autocomplete suggestion
  formulaSuggestions: SalaryFormulaVariable[] = [];
  private formulaCurrentWordStart = 0;
  private formulaCurrentWordEnd   = 0;
  /** Index in formulaConvertedTokens where next token will be inserted. -1 = append at end */
  formulaInsertIndex = -1;
  // ── cached computed properties (avoid getter calls in template) ───────────
  cachedSalarySummary = { earnings: 0, deductions: 0, systems: 0, taxable: 0, total: 0 };
  cachedFormulaVariableGroups: SalaryFormulaVariableGroup[] = [];
  cachedFormulaStatus: { color: string; icon: string; text: string } =
    { color: 'default', icon: 'minus-circle', text: 'Không nhập công thức thì hệ thống tự lấy tổng khoản cộng trừ tổng khoản trừ.' };
  readonly salaryItemTypes = SALARY_ITEM_TYPES;
  readonly salaryAvailableVariables = SALARY_AVAILABLE_VARIABLES;
  readonly salaryVariableCategories = SALARY_VARIABLE_CATEGORIES;
  readonly salaryItemPresets: SalaryItemPreset[] = SALARY_AVAILABLE_VARIABLES
    .filter(variable => variable.availableAsComponent)
    .map(variable => this.toSalaryItemPreset(variable));
  readonly salaryFormulaTemplates = [
    { label: 'Thực nhận theo lương thỏa thuận', formula: '[GROSS_SALARY] - [STATUTORY_INSURANCE] - [PIT] - [ADVANCE] - [PENALTY]' },
    { label: 'Theo lương cơ bản + phụ cấp', formula: '[BASIC_SALARY] + [POSITION_ALLOWANCE] + [SENIORITY_ALLOWANCE] + [RESPONSIBILITY_ALLOWANCE] + [MEAL_ALLOWANCE] + [TRANSPORT_ALLOWANCE] + [PHONE_ALLOWANCE] - [STATUTORY_INSURANCE] - [PIT]' },
    { label: 'Có thưởng và hoa hồng', formula: '[GROSS_SALARY] + [PERFORMANCE_BONUS] + [COMMISSION] + [OVERTIME_PAY] - [STATUTORY_INSURANCE] - [PIT]' }
  ];
  readonly salaryFormulaOperators = ['+', '-', '*', '/', '(', ')'];
  readonly salaryFormulaCatalogVariables: SalaryFormulaVariable[] = SALARY_AVAILABLE_VARIABLES
    .filter(variable => variable.availableInFormula)
    .map(variable => ({
      code: this.normalizeCode(variable.code),
      label: variable.label,
      group: variable.availableAsComponent ? 'component' as const : 'system' as const,
      kind: variable.kind,
      category: variable.category,
      description: variable.description || ''
    }));

  constructor(
    private global: GlobalService,
    private service: HrmMasterDataService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.global.setBreadcrumb([{ name: 'Danh mục HR', path: 'hrm/master-data' }]);
  }

  private toSalaryItemPreset(variable: SalaryAvailableVariable): SalaryItemPreset {
    return {
      itemCode: variable.code,
      itemName: variable.label,
      type: variable.componentType || (variable.kind === 'system' ? 'SYSTEM_VARIABLE' : 'EARNING_FIXED'),
      amount: variable.defaultAmount ?? 0,
      isTaxable: variable.isTaxable ?? true,
      description: variable.description || '',
      kind: variable.kind,
      category: variable.category
    };
  }

  ngOnInit(): void {
    this.loadShifts();
    this.loadLeaveTypes();
    this.loadSalaryStructures();
    // Debounce formula parsing: only runs 300ms after user stops typing
    this.formulaInput$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.parseFormulaRawText();
        this.cdr.markForCheck();
      });
  }

  loadShifts() { this.service.getAllShifts().pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.shifts = res || [] }); }
  loadLeaveTypes() { this.service.getAllLeaveTypes().pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.leaveTypes = res || [] }); }
  loadSalaryStructures() { this.service.getAllSalaryStructures().pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.salaryStructures = res || [] }); }

  openShift(item: any, isEdit: boolean) { this.isEditShift = isEdit; this.shiftDto = isEdit ? { ...new HrmShiftDto(), ...item } : new HrmShiftDto(); this.visibleShift = true; }
  closeShift() { this.visibleShift = false; }
  saveShift() {
    if (!this.shiftDto.code || !this.shiftDto.name) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    const action = this.isEditShift ? 'updateShift' : 'insertShift';
    this.service[action](this.shiftDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.loadShifts();
          this.closeShift();
        }
      }
    });
  }
  deleteShift(item: any) { this.service.deleteShift(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadShifts() }); }

  openLeaveType(item: any, isEdit: boolean) { this.isEditLeaveType = isEdit; this.leaveTypeDto = isEdit ? { ...new HrmLeaveTypeDto(), ...item } : new HrmLeaveTypeDto(); this.visibleLeaveType = true; }
  closeLeaveType() { this.visibleLeaveType = false; }
  saveLeaveType() {
    if (!this.leaveTypeDto.code || !this.leaveTypeDto.name) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
      return;
    }
    const action = this.isEditLeaveType ? 'updateLeaveType' : 'insertLeaveType';
    this.service[action](this.leaveTypeDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.loadLeaveTypes();
          this.closeLeaveType();
        }
      }
    });
  }
  deleteLeaveType(item: any) { this.service.deleteLeaveType(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadLeaveTypes() }); }

  openSalary(item: any, isEdit: boolean) {
    this.isEditSalary = isEdit;
    this.salaryDto = isEdit ? { ...new HrmSalaryStructureDto(), ...item } : new HrmSalaryStructureDto();
    this.salaryItems = [];
    this.salaryStep = 0;
    this.formulaRawText = '';
    this.formulaTextErrors = [];
    this.formulaConvertedTokens = [];
    this.formulaConvertedPreview = '';
    this.formulaSuggestions = [];
    this.recomputeItemCaches(); // always populate system variables immediately
    this.rebuildSalaryFormulaTokens();
    this.visibleSalary = true;
    if (isEdit && item?.id) {
      this.loadSalaryItems(item.id);
    }
  }
  closeSalary() { this.visibleSalary = false; }
  saveSalary() {
    this.syncSalaryFormulaFromTokens();
    const validationMessage = this.validateSalaryStructure();
    if (validationMessage) {
      this.message.warning(validationMessage);
      return;
    }

    this.salaryDto.code = this.normalizeCode(this.salaryDto.code);
    this.salaryDto.name = this.salaryDto.name.trim();
    this.salaryDto.description = (this.salaryDto.description || '').trim();
    this.salaryDto.formula = (this.salaryDto.formula || '').trim();
    this.salaryDto.items = this.salaryItems.map(item => {
      const preset = this.findSalaryItemPreset(item.itemCode)!;
      return {
        ...item,
        itemCode: this.normalizeCode(preset.itemCode),
        itemName: preset.itemName,
        type: preset.type,
        amount: Number(item.amount || 0),
        isTaxable: !!item.isTaxable,
        formula: ''
      };
    });

    const action = this.isEditSalary ? 'updateSalaryStructure' : 'insertSalaryStructure';
    this.service[action](this.salaryDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.loadSalaryStructures();
          this.closeSalary();
          this.message.success('Lưu cấu trúc lương thành công!');
        }
      }
    });
  }
  deleteSalary(item: any) { this.service.deleteSalaryStructure(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadSalaryStructures() }); }

  loadSalaryItems(structureId: string) {
    this.service.getSalaryItemsByStructure(structureId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.salaryItems = (res || []).map((item: HrmSalaryItemDto) => this.normalizeSalaryItem(item));
        this.recomputeItemCaches();
        this.rebuildSalaryFormulaTokens();
        this.cdr.markForCheck();
      }
    });
  }

  addSalaryItemRow() {
    this.message.warning('Vui lòng chọn thành phần từ danh sách biến có sẵn');
  }

  addSalaryItemPreset(preset: SalaryItemPreset) {
    const code = this.normalizeCode(preset.itemCode);
    if (this.salaryItems.some(item => this.normalizeCode(item.itemCode) === code)) {
      this.message.warning(`Thành phần ${code} đã có trong cấu trúc lương`);
      return;
    }
    this.salaryItems = [
      ...this.salaryItems,
      this.createSalaryItemFromPreset(preset)
    ];
    this.recomputeItemCaches();
  }

  isSalaryItemPresetSelected(preset: SalaryItemPreset): boolean {
    const code = this.normalizeCode(preset.itemCode);
    return this.salaryItems.some(item => this.normalizeCode(item.itemCode) === code);
  }

  getSalaryItemDescription(item: HrmSalaryItemDto): string {
    return this.findSalaryItemPreset(item.itemCode)?.description || 'Biến này không nằm trong danh sách biến thành phần có sẵn.';
  }

  getSalaryItemPresetClass(preset: SalaryItemPreset): string {
    const kind = this.getSalaryAvailableVariableKind(preset.itemCode);
    return kind === 'deduction' ? 'deduction' : kind === 'system' ? 'system' : 'earning';
  }

  onSalaryItemTaxableChange(): void {
    this.recomputeItemCaches();
  }

  private createSalaryItemFromPreset(preset: SalaryItemPreset): HrmSalaryItemDto {
    return {
      id: '',
      structureId: this.salaryDto.id || '',
      itemCode: this.normalizeCode(preset.itemCode),
      itemName: preset.itemName,
      type: preset.type,
      amount: preset.amount,
      isTaxable: preset.isTaxable,
      formula: ''
    };
  }

  private normalizeSalaryItem(item: HrmSalaryItemDto): HrmSalaryItemDto {
    const code = this.normalizeCode(item.itemCode);
    const preset = this.findSalaryItemPreset(code);
    if (!preset) {
      return { ...item, itemCode: code, formula: '' };
    }

    return {
      ...item,
      itemCode: this.normalizeCode(preset.itemCode),
      itemName: preset.itemName,
      type: preset.type,
      amount: Number(item.amount ?? preset.amount),
      isTaxable: item.isTaxable ?? preset.isTaxable,
      formula: ''
    };
  }

  private findSalaryItemPreset(code: string | null | undefined): SalaryItemPreset | undefined {
    const variable = this.findSalaryAvailableVariable(code);
    return variable?.availableAsComponent ? this.toSalaryItemPreset(variable) : undefined;
  }

  private findSalaryAvailableVariable(code: string | null | undefined): SalaryAvailableVariable | undefined {
    const normalized = this.normalizeCode(code);
    return this.salaryAvailableVariables.find(variable => this.normalizeCode(variable.code) === normalized);
  }

  private getSalaryAvailableVariableKind(code: string | null | undefined): 'system' | 'earning' | 'deduction' {
    return this.findSalaryAvailableVariable(code)?.kind || 'system';
  }

  // Formatters for nz-input-number display
  currencyFmt = (v: number) => v ? v.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  percentFmt = (v: number) => v + '%';
  numberFmt = (v: number) => `${v ?? 0}`;

  getSalaryItemTypeLabel(type: string): string {
    return this.salaryItemTypes.find(t => t.value === type)?.label ?? type;
  }

  deleteSalaryItem(item: HrmSalaryItemDto, idx: number) {
    this.salaryItems.splice(idx, 1);
    this.salaryItems = [...this.salaryItems];
    this.recomputeItemCaches();
  }

  nextSalaryStep() { if (this.salaryStep < 2) this.salaryStep += 1; }
  previousSalaryStep() { if (this.salaryStep > 0) this.salaryStep -= 1; }
  trackBySalaryItem(index: number, item: HrmSalaryItemDto) { return item.id || `${item.itemCode}-${index}`; }
  trackByGroup(_: number, g: SalaryFormulaVariableGroup) { return g.key; }
  trackByComponentGroup(_: number, g: SalaryComponentVariableGroup) { return g.key; }
  trackByVar(_: number, v: SalaryFormulaVariable) { return v.code; }
  trackByPreset(_: number, p: SalaryItemPreset) { return p.itemCode; }

  get salaryComponentGroups(): SalaryComponentVariableGroup[] {
    return this.salaryVariableCategories
      .map(category => ({
        ...category,
        presets: this.salaryItemPresets
          .filter(preset => preset.category === category.key)
          .filter(preset => this.matchesSalarySearch(preset.itemName, preset.description, this.componentVariableSearch))
      }))
      .filter(group => group.presets.length);
  }

  get salaryFormulaVariableGroups(): SalaryFormulaVariableGroup[] {
    return this.salaryVariableCategories
      .map(category => {
        const variables = this.salaryFormulaVariables
          .filter(variable => variable.category === category.key)
          .filter(variable => this.matchesSalarySearch(variable.label, variable.description, this.formulaVariableSearch));
        const kind = category.key === 'deduction'
          ? 'deduction'
          : category.key === 'time' || category.key === 'fixed'
            ? 'system'
            : 'earning';
        return { ...category, kind, variables };
      })
      .filter(group => group.variables.length);
  }

  get hasComponentVariableSearch(): boolean {
    return !!this.componentVariableSearch.trim();
  }

  get hasFormulaVariableSearch(): boolean {
    return !!this.formulaVariableSearch.trim();
  }

  private matchesSalarySearch(label: string, description: string, search: string): boolean {
    const query = this.normalizeSearchText(search);
    if (!query) return true;
    return `${this.normalizeSearchText(label)} ${this.normalizeSearchText(description)}`.includes(query);
  }

  private normalizeSearchText(value: string | null | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .trim();
  }

  /** Recompute all cached properties that depend on salaryItems. Call after any items mutation. */
  private recomputeItemCaches(): void {
    const systems = this.salaryItems.filter(i => this.isSystemSalaryItem(i)).length;
    const deductions = this.salaryItems.filter(i => this.isDeductionSalaryItem(i)).length;
    const earnings = this.salaryItems.length - deductions - systems;
    const taxable = this.salaryItems.filter(i => i.isTaxable).length;
    this.cachedSalarySummary = { earnings, deductions, systems, taxable, total: this.salaryItems.length };
    this.recomputeVariableGroups();
    this.recomputeFormulaStatus();
  }

  private recomputeVariableGroups(): void {
    const earnVars = this.salaryFormulaVariables.filter(v => this.getSalaryAvailableVariableKind(v.code) === 'earning');
    const sysVars = this.salaryFormulaVariables.filter(v => this.getSalaryAvailableVariableKind(v.code) === 'system');
    const dedVars = this.salaryFormulaVariables.filter(v => this.getSalaryAvailableVariableKind(v.code) === 'deduction');
    this.cachedFormulaVariableGroups = [
      { key: 'variable' as const, title: 'Thu nhập', description: 'Các khoản cộng vào lương', kind: 'earning', variables: earnVars },
      { key: 'time' as const, title: 'Thời gian', description: 'Ngày công và nghỉ phép', kind: 'system', variables: sysVars },
      { key: 'deduction' as const, title: 'Khấu trừ', description: 'Các khoản trừ lương', kind: 'deduction', variables: dedVars },
    ].filter(g => g.variables.length);
  }

  private recomputeFormulaStatus(): void {
    const msg = this.validateFormula(this.serializeSalaryFormulaTokens());
    if (msg) {
      this.cachedFormulaStatus = { color: 'red', icon: 'close-circle', text: msg };
    } else if (!this.salaryFormulaTokens.length) {
      this.cachedFormulaStatus = { color: 'default', icon: 'minus-circle', text: 'Không nhập công thức thì hệ thống tự lấy tổng khoản cộng trừ tổng khoản trừ.' };
    } else {
      this.cachedFormulaStatus = { color: 'green', icon: 'check-circle', text: 'Công thức có thể dùng cho kỳ lương.' };
    }
  }

  // ── Free-text formula ──────────────────────────────────────────────────────
  /** Build a lookup map: label (tiếng Việt) → code, code → code */
  private buildVariableLookup(): Map<string, string> {
    const map = new Map<string, string>();
    for (const v of this.salaryFormulaVariables) {
      map.set(v.code.toUpperCase(), v.code);
      map.set(v.label.trim().toUpperCase(), v.code);
    }
    return map;
  }

  /** Native input event handler — reads cursor position for autocomplete, then debounces parse */
  onFormulaTextInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.formulaRawText = el.value;
    const cursor = el.selectionStart ?? el.value.length;
    const before = el.value.substring(0, cursor);
    // Extract last partial word (letters, digits, spaces within word — stop at operators/brackets)
    const match = before.match(/([^\s+\-*/()[\]]+)$/);
    const word = match ? match[1].trim() : '';
    this.formulaCurrentWordStart = cursor - (match ? match[0].length : 0);
    this.formulaCurrentWordEnd = cursor;

    if (word.length >= 1) {
      const upper = word.toUpperCase();
      this.formulaSuggestions = this.salaryFormulaVariables
        .filter(v => v.label.toUpperCase().includes(upper) || v.code.includes(upper))
        .slice(0, 8);
    } else {
      this.formulaSuggestions = [];
    }
    this.formulaInput$.next(this.formulaRawText);
  }

  /** Called from [(ngModel)] path (template-driven, no cursor info) */
  onFormulaRawTextChange(): void {
    this.formulaInput$.next(this.formulaRawText);
  }

  /** User clicked a suggestion — append label to formula, clear quick input */
  selectSuggestion(variable: SalaryFormulaVariable): void {
    this.appendFormulaVariable(variable);
  }

  closeSuggestions(): void {
    setTimeout(() => { this.formulaSuggestions = []; this.cdr.markForCheck(); }, 150);
  }

  /** Blur handler: close suggestions after small delay */
  onFormulaQuickInputBlur(_event: FocusEvent): void {
    this.closeSuggestions();
  }

  /** Quick-input (inline tag editor) handlers */
  onFormulaQuickInput(event: Event): void {
    const word = (event.target as HTMLInputElement).value.trim();
    if (word.length >= 1) {
      const upper = word.toUpperCase();
      this.formulaSuggestions = this.salaryFormulaVariables
        .filter(v => v.label.toUpperCase().includes(upper) || v.code.includes(upper))
        .slice(0, 8);
    } else {
      this.formulaSuggestions = [];
    }
  }

  onFormulaQuickKeydown(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value || !this.formulaConvertedTokens.length) return;

      event.preventDefault();
      this.removeFormulaToken(this.formulaConvertedTokens.length - 1);
      return;
    }

    if (!this.salaryFormulaOperators.includes(event.key)) return;

    event.preventDefault();
    if (this.formulaQuickInput.trim() && !this.commitFormulaQuickInput()) return;
    this.appendToFormula(event.key);
    this.cdr.markForCheck();
  }

  appendTextToFormula(): void {
    if (!this.commitFormulaQuickInput()) return;
    this.parseFormulaRawText();
    this.cdr.markForCheck();
  }

  private commitFormulaQuickInput(): boolean {
    const txt = this.formulaQuickInput.trim();
    if (!txt) return false;

    if (/^\d+(\.\d+)?$/.test(txt)) {
      this.appendFormulaTextPart(txt);
      this.formulaQuickInput = '';
      this.formulaSuggestions = [];
      return true;
    }

    const variable = this.resolveFormulaVariableInput(txt);
    if (!variable) {
      this.message.warning('Chỉ được chọn biến trong danh sách Biến khả dụng');
      return false;
    }

    this.appendFormulaTextPart(variable.label);
    this.formulaQuickInput = '';
    this.formulaSuggestions = [];
    return true;
  }

  private resolveFormulaVariableInput(value: string): SalaryFormulaVariable | undefined {
    const trimmed = value.trim();
    const withoutBrackets = trimmed.startsWith('[') && trimmed.endsWith(']')
      ? trimmed.slice(1, -1).trim()
      : trimmed;
    const normalizedLabel = withoutBrackets.replace(/\s+/g, ' ').toUpperCase();
    const normalizedCode = this.normalizeCode(withoutBrackets);

    return this.salaryFormulaVariables.find(variable =>
      this.normalizeCode(variable.code) === normalizedCode ||
      variable.label.trim().replace(/\s+/g, ' ').toUpperCase() === normalizedLabel
    );
  }

  private appendFormulaVariable(variable: SalaryFormulaVariable): void {
    this.insertTokenAtCursor({ text: variable.code, kind: 'ok', label: variable.label });
    this.formulaQuickInput = '';
    this.formulaSuggestions = [];
    setTimeout(() => this.focusQuickInput(), 0);
    this.cdr.markForCheck();
  }

  private appendFormulaTextPart(value: string): void {
    // Try to resolve as a known variable first
    const variable = this.resolveFormulaVariableInput(value);
    if (variable) {
      this.insertTokenAtCursor({ text: variable.code, kind: 'ok', label: variable.label });
      return;
    }
    if (/^\d+(\.\d+)?$/.test(value.trim())) {
      this.insertTokenAtCursor({ text: value.trim(), kind: 'num' });
      return;
    }
    // Unknown: just append to raw text
    const raw = this.formulaRawText;
    this.formulaRawText = (raw.trimEnd() + (raw.trim() ? ' ' : '') + value).trim();
    this.parseFormulaRawText();
  }

  clearQuickInput(): void {
    this.formulaQuickInput = '';
    this.formulaSuggestions = [];
    this.cdr.markForCheck();
  }

  parseFormulaRawText() {
    const text = this.formulaRawText;
    const convertedParts: string[] = [];
    this.formulaTextErrors = [];
    this.formulaConvertedTokens = [];

    if (!text.trim()) {
      this.formulaConvertedPreview = '';
      this.salaryDto.formula = '';
      return;
    }

    // Sort variable labels longest-first → greedy match "Tổng phụ cấp" before "Tổng"
    const variables = this.salaryFormulaVariables;
    const sortedVars = [...variables].sort((a, b) => b.label.length - a.label.length);
    const labelMap = new Map(variables.map(v => [v.code, v.label]));
    const codeMap = new Map(variables.map(v => [v.code.toUpperCase(), v.code]));
    const textUp = text.toUpperCase();
    const operators = new Set(['+', '-', '*', '/', '(', ')']);

    let i = 0;
    while (i < text.length) {
      if (/\s/.test(text[i])) { i++; continue; }

      // ── [CODE] bracket format ──────────────────────────────────────────
      if (text[i] === '[') {
        const end = text.indexOf(']', i);
        if (end !== -1) {
          const inner = text.slice(i + 1, end).toUpperCase();
          const resolved = codeMap.get(inner);
          if (resolved) {
            convertedParts.push(`[${resolved}]`);
            this.formulaConvertedTokens.push({ text: resolved, kind: 'ok', label: labelMap.get(resolved) });
          } else {
            const raw = text.slice(i, end + 1);
            this.formulaTextErrors.push({ word: raw, msg: `Biến "${inner}" không tồn tại trong hệ thống` });
            this.formulaConvertedTokens.push({ text: raw, kind: 'err' });
            convertedParts.push(raw);
          }
          i = end + 1; continue;
        }
      }

      // ── Operator ───────────────────────────────────────────────────────
      if (operators.has(text[i])) {
        convertedParts.push(text[i]);
        this.formulaConvertedTokens.push({ text: text[i], kind: 'op' });
        i++; continue;
      }

      // ── Number ─────────────────────────────────────────────────────────
      const numMatch = text.slice(i).match(/^\d+(\.\d+)?/);
      if (numMatch) {
        convertedParts.push(numMatch[0]);
        this.formulaConvertedTokens.push({ text: numMatch[0], kind: 'num' });
        i += numMatch[0].length; continue;
      }

      // ── Greedy multi-word label match (longest first) ──────────────────
      let matched = false;
      for (const v of sortedVars) {
        const labelUp = v.label.toUpperCase();
        if (textUp.startsWith(labelUp, i)) {
          const afterPos = i + v.label.length;
          const next = text[afterPos];
          if (!next || /[\s+\-*/()[\]]/.test(next)) {
            convertedParts.push(`[${v.code}]`);
            this.formulaConvertedTokens.push({ text: v.code, kind: 'ok', label: v.label });
            i = afterPos; matched = true; break;
          }
        }
      }
      if (matched) continue;

      // ── Unknown token ──────────────────────────────────────────────────
      const wordMatch = text.slice(i).match(/^[^\s+\-*/()[\]]+/);
      if (wordMatch) {
        const word = wordMatch[0];
        this.formulaTextErrors.push({ word, msg: `"${word}" không khớp biến nào trong hệ thống` });
        this.formulaConvertedTokens.push({ text: word, kind: 'err' });
        convertedParts.push(word);
        i += word.length;
      } else { i++; }
    }

    this.formulaConvertedPreview = convertedParts.join(' ');
    if (!this.formulaTextErrors.length) {
      this.salaryDto.formula = this.formulaConvertedPreview;
      this.rebuildSalaryFormulaTokens();
    }
  }


  applyFormulaFromText() {
    this.parseFormulaRawText();
    if (this.formulaTextErrors.length) {
      this.message.error('Vui lòng sửa các lỗi trong công thức trước khi áp dụng');
      return;
    }
    this.salaryDto.formula = this.formulaConvertedPreview;
    this.rebuildSalaryFormulaTokens();
    this.message.success('Công thức đã được chuyển đổi thành công!');
  }

  insertVariableToText(variable: SalaryFormulaVariable) {
    this.appendFormulaVariable(variable);
  }

  /** Set insertion cursor position between chips */
  setFormulaInsertIndex(index: number): void {
    this.formulaInsertIndex = index;
    setTimeout(() => this.focusQuickInput(), 0);
    this.cdr.markForCheck();
  }

  private focusQuickInput(): void {
    const el = document.querySelector<HTMLInputElement>('.ftok-input');
    el?.focus();
  }

  /** Insert a token at formulaInsertIndex, then advance the index */
  private insertTokenAtCursor(tok: { text: string; kind: 'ok' | 'err' | 'op' | 'num'; label?: string }): void {
    const tokens = [...this.formulaConvertedTokens];
    const idx = (this.formulaInsertIndex < 0 || this.formulaInsertIndex > tokens.length)
      ? tokens.length
      : this.formulaInsertIndex;
    tokens.splice(idx, 0, tok);
    // Serialize labels back to rawText so parseFormulaRawText can re-derive tokens
    this.formulaRawText = tokens
      .map(t => t.kind === 'ok' ? (t.label ?? t.text) : t.text)
      .join(' ');
    this.formulaInsertIndex = idx + 1;
    this.parseFormulaRawText();
  }

  /** Append an operator or number string at the current insertion point */
  appendToFormula(value: string) {
    this.insertTokenAtCursor({ text: value, kind: 'op' });
    setTimeout(() => this.focusQuickInput(), 0);
    this.cdr.markForCheck();
  }

  /** Clear entire formula text */
  clearFormulaText() {
    this.formulaRawText = '';
    this.formulaTextErrors = [];
    this.formulaConvertedTokens = [];
    this.formulaConvertedPreview = '';
    this.salaryDto.formula = '';
    this.salaryFormulaTokens = [];
  }

  /** Remove a converted token by index and rebuild raw text from remaining parts */
  removeFormulaToken(index: number) {
    // Adjust insert cursor when removing a token before it
    if (this.formulaInsertIndex > index) {
      this.formulaInsertIndex--;
    }
    const parts = this.formulaConvertedTokens
      .filter((_, i) => i !== index)
      .map(tok => tok.kind === 'ok' ? (tok.label ?? tok.text) : tok.text);
    this.formulaRawText = parts.join(' ').replace(/\s{2,}/g, ' ').trim();
    this.parseFormulaRawText();
    this.cdr.markForCheck();
  }

  loadFormulaIntoText() {
    const varMap = new Map(this.salaryFormulaVariables.map(v => [v.code, v.label]));
    this.formulaRawText = this.salaryFormulaTokens
      .map(t => t.type === 'variable' ? (varMap.get(t.value) ?? t.value) : t.value)
      .join(' ');
    this.parseFormulaRawText();
  }
  // ──────────────────────────────────────────────────────────────────────────

  salaryItemAmountStep(type: string | null | undefined): number {
    if ((type || '').toUpperCase().includes('SYSTEM')) return 0.5;
    return type === 'DEDUCTION_PERCENT' ? 0.5 : 100000;
  }

  /** Still needed internally for parsing/validation — not called from template */
  get salaryFormulaVariables(): SalaryFormulaVariable[] {
    const seen = new Set<string>();
    return this.salaryFormulaCatalogVariables.filter(v => {
      if (seen.has(v.code)) return false;
      seen.add(v.code);
      return true;
    });
  }

  applySalaryFormulaTemplate(formula: string) {
    this.salaryDto.formula = formula;
    this.formulaRawText = ''; // clear so rebuildSalaryFormulaTokens converts to labels
    this.formulaQuickInput = '';
    this.rebuildSalaryFormulaTokens();
  }

  addSalaryFormulaVariable(variable: SalaryFormulaVariable) {
    this.salaryFormulaTokens = [
      ...this.salaryFormulaTokens,
      { type: 'variable', value: variable.code, label: variable.label }
    ];
    this.syncSalaryFormulaFromTokens();
  }

  formulaVariableKind(variable: { code: string }): string {
    const code = this.normalizeCode(variable.code);
    const component = this.salaryItems.find(item => this.normalizeCode(item.itemCode) === code);
    if (component) {
      return this.getSalaryAvailableVariableKind(code);
    }
    return this.getSalaryAvailableVariableKind(code);
  }

  formulaTokenClass(token: SalaryFormulaToken): string {
    if (token.type === 'operator') return 'operator';
    if (token.type === 'number') return 'number';
    return this.formulaVariableKind({ code: token.value });
  }

  formulaConvertedTokenClass(token: { text: string; kind: 'ok' | 'err' | 'op' | 'num'; label?: string }): string {
    if (token.kind !== 'ok') return `ftok-${token.kind}`;
    return `ftok-${this.formulaVariableKind({ code: token.text })}`;
  }

  addSalaryFormulaOperator(operator: string) {
    this.salaryFormulaTokens = [
      ...this.salaryFormulaTokens,
      { type: 'operator', value: operator, label: operator }
    ];
    this.syncSalaryFormulaFromTokens();
  }

  addSalaryFormulaNumber() {
    const value = this.salaryFormulaNumber.trim();
    if (!/^\d+(\.\d+)?$/.test(value)) {
      this.message.warning('Chỉ nhập số dương cho hằng số trong công thức');
      return;
    }
    this.insertTokenAtCursor({ text: value, kind: 'num' });
    this.salaryFormulaNumber = '';
    setTimeout(() => this.focusQuickInput(), 0);
    this.cdr.markForCheck();
  }

  removeSalaryFormulaToken(index: number) {
    this.salaryFormulaTokens.splice(index, 1);
    this.salaryFormulaTokens = [...this.salaryFormulaTokens];
    this.syncSalaryFormulaFromTokens();
  }

  clearSalaryFormulaTokens() {
    this.salaryFormulaTokens = [];
    this.syncSalaryFormulaFromTokens();
  }

  normalizeCode(value: string | null | undefined): string {
    return (value || '').trim().toUpperCase().replace(/\s+/g, '_');
  }

  private validateSalaryStructure(): string {
    if (!this.salaryDto.code?.trim() || !this.salaryDto.name?.trim()) {
      this.salaryStep = 0;
      return 'Vui lòng nhập mã và tên cấu trúc lương';
    }
    if (!this.salaryItems.length) {
      this.salaryStep = 1;
      return 'Vui lòng thêm ít nhất một thành phần lương';
    }

    const codes = new Set<string>();
    for (const item of this.salaryItems) {
      const code = this.normalizeCode(item.itemCode);
      if (!code || !item.itemName?.trim()) {
        this.salaryStep = 1;
        return 'Mỗi thành phần lương cần có mã và tên';
      }
      if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
        this.salaryStep = 1;
        return `Mã thành phần ${code} không hợp lệ`;
      }
      if (!this.findSalaryItemPreset(code)) {
        this.salaryStep = 1;
        return `Thành phần ${code} không nằm trong danh sách biến thành phần có sẵn`;
      }
      if (codes.has(code)) {
        this.salaryStep = 1;
        return `Mã thành phần ${code} đang bị trùng`;
      }
      codes.add(code);
    }

    const formulaMessage = this.validateFormula(this.serializeSalaryFormulaTokens());
    if (formulaMessage) this.salaryStep = 2;
    return formulaMessage;
  }

  private validateFormula(formula: string): string {
    const value = formula.trim();
    if (!value) return '';

    const openCount = (value.match(/\[/g) || []).length;
    const closeCount = (value.match(/\]/g) || []).length;
    if (openCount !== closeCount) {
      return 'Công thức đang thiếu dấu [ hoặc ]';
    }

    const allowedVariables = new Set(this.salaryFormulaVariables.map(item => item.code));
    const missingVariables = this.extractFormulaVariables(value)
      .filter(variable => !allowedVariables.has(variable));
    if (missingVariables.length) {
      return 'Công thức đang dùng biến không còn trong danh sách khả dụng';
    }

    const expressionOnly = value.replace(/\[[^\]]+\]/g, '');
    if (/[^0-9+\-*/().\s]/.test(expressionOnly)) {
      return 'Công thức chỉ hỗ trợ số, +, -, *, /, dấu ngoặc và biến dạng [MA_BIEN]';
    }

    return '';
  }

  private extractFormulaVariables(formula: string): string[] {
    const variables = formula.match(/\[([^\]]+)\]/g) || [];
    return Array.from(new Set(
      variables.map(item => this.normalizeCode(item.slice(1, -1))).filter(Boolean)
    ));
  }

  private rebuildSalaryFormulaTokens() {
    this.salaryFormulaTokens = this.parseSalaryFormula(this.salaryDto.formula || '');
    this.syncSalaryFormulaFromTokens();
    this.recomputeFormulaStatus();
    if (!this.formulaRawText && this.salaryDto.formula) {
      // Show friendly labels to the user, not raw [CODE] strings
      const varMap = new Map(this.salaryFormulaVariables.map(v => [v.code, v.label]));
      this.formulaRawText = this.salaryFormulaTokens
        .map(t => t.type === 'variable' ? (varMap.get(t.value) ?? t.value) : t.value)
        .join(' ');
      this.parseFormulaRawText();
    }
  }

  private parseSalaryFormula(formula: string): SalaryFormulaToken[] {
    const variableMap = new Map(this.salaryFormulaVariables.map(item => [item.code, item.label]));
    const rawTokens = formula.match(/\[[^\]]+\]|\d+(\.\d+)?|[+\-*/()]/g) || [];
    return rawTokens.map(token => {
      if (token.startsWith('[') && token.endsWith(']')) {
        const code = this.normalizeCode(token.slice(1, -1));
        return {
          type: 'variable' as const,
          value: code,
          label: variableMap.get(code) || 'Biến không còn tồn tại'
        };
      }
      if (this.salaryFormulaOperators.includes(token)) {
        return { type: 'operator' as const, value: token, label: token };
      }
      return { type: 'number' as const, value: token, label: token };
    });
  }

  private syncSalaryFormulaFromTokens() {
    this.salaryDto.formula = this.serializeSalaryFormulaTokens();
  }

  private serializeSalaryFormulaTokens(): string {
    return this.salaryFormulaTokens
      .map(token => token.type === 'variable' ? `[${token.value}]` : token.value)
      .join(' ')
      .trim();
  }

  private isDeductionSalaryItem(item: HrmSalaryItemDto): boolean {
    const kind = this.getSalaryAvailableVariableKind(item.itemCode);
    if (kind === 'earning' || kind === 'deduction') return kind === 'deduction';
    return (item.type || '').toUpperCase().includes('DEDUCTION');
  }

  isSystemSalaryItem(item: HrmSalaryItemDto): boolean {
    const kind = this.getSalaryAvailableVariableKind(item.itemCode);
    if (kind === 'system') return true;
    return (item.type || '').toUpperCase().includes('SYSTEM');
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
