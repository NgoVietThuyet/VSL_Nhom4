import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GlobalService } from '../../../../core/services/global.service';
import { EnvironmentService } from '../../../../core/services/environment.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { ReportDefinitionService } from '../../services/report-definition.service';
import { ReportStructureService } from '../../services/report-structure.service';
import { ReportFormulaService } from '../../services/report-formula.service';
import { ReportTemplateService } from '../../services/report-template.service';
import { ReportDataTypeService } from '../../services/report-data-type.service';
import { ReportFormulaFunctionService } from '../../services/report-formula-function.service';
import { ReportStructureDto } from '../../models/report-structure.model';
import { ReportFormulaDto } from '../../models/report-formula.model';
import { GridModel, buildGridModel, gridCellCode } from '../../utils/report-grid.builder';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

interface TreeNode {
  key: string;
  title: string;
  data: ReportStructureDto;
  expanded?: boolean;
  isLeaf?: boolean;
  selected?: boolean,
  children: TreeNode[];
}

const COL_TYPES = ['ColumnGroup', 'Column'];
const ROW_TYPES = ['RowGroup', 'Row'];

@Component({
  selector: 'app-report-designer',
  imports: [
    SharedModules,
    NzTreeSelectModule,
    NzInputNumberModule,
  ],
  templateUrl: './report-designer.html'
})
export class ReportDesigner implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  definitionId = '';
  definition: any = {};
  selectedTab = 0;
  definitions: any[] = [];
  selectedDefinitionId = '';

  flatNodes: ReportStructureDto[] = [];
  colTreeNodes: TreeNode[] = [];
  rowTreeNodes: TreeNode[] = [];
  colTreeSearch = '';
  rowTreeSearch = '';
  cellList: ReportStructureDto[] = [];
  gridModel: GridModel | null = null;

  selectedColNode: ReportStructureDto | null = null;
  selectedRowNode: ReportStructureDto | null = null;

  nodeDrawerVisible = false;
  nodeIsEdit = false;
  nodeAxis: 'col' | 'row' = 'col';
  nodeDto: ReportStructureDto = new ReportStructureDto();
  dataTypes: any[] = [];

  cellDrawerVisible = false;
  cellDto: ReportStructureDto = new ReportStructureDto();
  cellListFilter = '';
  bulkSelected = new Set<string>();
  previewMode: 'view' | 'quick' = 'view';
  bulkDrawerVisible = false;
  bulkDto: ReportStructureDto = new ReportStructureDto();
  bulkApply: { dataTypeCode?: boolean; format?: boolean; decimalRound?: boolean; isInput?: boolean; isFormula?: boolean; formula?: boolean } = {};

  formulas: ReportFormulaDto[] = [];
  formulaFunctions: any[] = [];
  formulaDrawerVisible = false;
  formulaIsEdit = false;
  formulaDto: ReportFormulaDto = new ReportFormulaDto();

  templates: any[] = [];
  uploadDrawerVisible = false;
  uploadName = '';
  uploadNotes = '';
  uploadFile: File | null = null;

  treeSelectData: any[] = [];


  constructor(
    private global: GlobalService,
    private env: EnvironmentService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private definitionSrv: ReportDefinitionService,
    private structureSrv: ReportStructureService,
    private formulaSrv: ReportFormulaService,
    private templateSrv: ReportTemplateService,
    private dataTypeSrv: ReportDataTypeService,
    private functionSrv: ReportFormulaFunctionService
  ) { }

  ngOnInit(): void {
    this.definitionId = this.route.snapshot.paramMap.get('id') || '';
    this.selectedDefinitionId = this.definitionId;
    this.global.setBreadcrumb([
      { name: 'Định nghĩa báo cáo', path: 'report/definition' },
      { name: 'Thiết kế', path: `report/designer/${this.definitionId}` }
    ]);
    this.definitionSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.definitions = r || [] });
    this.dataTypeSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.dataTypes = r || [] });
    this.functionSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.formulaFunctions = r || [] });
    if (this.definitionId) {
      this.loadDefinition();
      this.loadStructure();
      this.loadFormulas();
      this.loadTemplates();
    }
  }

  onDefinitionChange(id: string) {
    if (!id) { this.router.navigate(['/report/designer']); return; }
    this.router.navigate(['/report/designer', id]);
  }

  loadDefinition() {
    this.definitionSrv.detail(this.definitionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => this.definition = r || {}
    });
  }

  loadStructure() {
    this.structureSrv.byDefinition(this.definitionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => { this.flatNodes = r || []; this.rebuildAll(); }
    });
  }

  rebuildAll() {
    this.colTreeNodes = this.buildTree(this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType)));
    if (this.colTreeNodes && this.colTreeNodes.length > 0) this.selectFirstNodeCol();

    this.rowTreeNodes = this.buildTree(this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType)));
    if (this.rowTreeNodes && this.rowTreeNodes.length > 0) this.selectFirstNodeRow();

    this.cellList = this.flatNodes.filter(n => n.nodeType === 'Cell')
      .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
    this.gridModel = buildGridModel(this.flatNodes);
  }

  buildTree(flat: ReportStructureDto[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    flat.forEach(n => map.set(n.id, {
      key: n.id,
      title: `[${n.code || '-'}] ${n.name || ''}`,
      data: n,
      expanded: n.expanded !== false,
      children: []
    }));
    const roots: TreeNode[] = [];
    flat.forEach(n => {
      const node = map.get(n.id)!;
      if (n.pId && map.has(n.pId)) map.get(n.pId)!.children.push(node);
      else roots.push(node);
    });
    const finalize = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => (a.data.orderNumber || 0) - (b.data.orderNumber || 0));
      nodes.forEach(x => { x.isLeaf = x.children.length === 0; finalize(x.children); });
    };
    finalize(roots);
    return roots;
  }

  onSelectColNode(event: any) {
    if (event?.node?.origin) {
      const clickedNode = event.node;
      const clickedNodeData = event.node.origin.data;

      if (this.selectedColNode && this.selectedColNode.id === clickedNodeData.id) {
        this.selectedColNode = null;
        clickedNode.isSelected = false;
      } else {
        this.selectedColNode = clickedNodeData;
      }

      this.nodeDto.pId = clickedNodeData.id;
    }
  }

  addColNode() {
    this.openNodeDrawer('col', false, this.selectedColNode || null);
  }

  editColNode() {
    if (!this.selectedColNode) { this.message.warning('Hãy chọn node để sửa'); return; }
    this.openNodeDrawer('col', true, this.selectedColNode);
  }

  deleteColNode() {
    if (!this.selectedColNode) return;
    this.removeNodeRecursive(this.selectedColNode.id);
    this.selectedColNode = null;
    this.afterStructureChange();
  }

  onSelectRowNode(event: any) {
    if (event?.node?.origin?.data) this.selectedRowNode = event.node.origin.data;
  }

  addRowNode() {
    this.openNodeDrawer('row', false, this.selectedRowNode || null);
  }

  editRowNode() {
    if (!this.selectedRowNode) { this.message.warning('Hãy chọn node để sửa'); return; }
    this.openNodeDrawer('row', true, this.selectedRowNode);
  }

  deleteRowNode() {
    if (!this.selectedRowNode) return;
    this.removeNodeRecursive(this.selectedRowNode.id);
    this.selectedRowNode = null;
    this.afterStructureChange();
  }

  onTreeDrop(event: any, axis: 'col' | 'row'): void {
    const dragKey: string = event.dragNode?.key;
    const dropKey: string = event.node?.key;
    const pos: number = event.pos;
    if (!dragKey || !dropKey || dragKey === dropKey) return;

    const treeRef = axis === 'col' ? this.colTreeNodes : this.rowTreeNodes;
    const data: TreeNode[] = JSON.parse(JSON.stringify(treeRef));

    let dragObj: TreeNode | null = null;
    const loop = (nodes: TreeNode[], key: string, cb: (item: TreeNode, i: number, list: TreeNode[]) => void) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === key) { cb(nodes[i], i, nodes); return; }
        if (nodes[i].children?.length) loop(nodes[i].children, key, cb);
      }
    };

    loop(data, dragKey, (item, i, arr) => { arr.splice(i, 1); dragObj = item; });
    if (!dragObj) return;

    if (pos === 0) {
      loop(data, dropKey, item => {
        item.children = item.children || [];
        item.children.unshift(dragObj!);
      });
    } else {
      let insertList: TreeNode[] = data;
      let insertIdx = 0;
      loop(data, dropKey, (_item, i, arr) => { insertList = arr; insertIdx = pos === -1 ? i : i + 1; });
      insertList.splice(insertIdx, 0, dragObj);
    }

    if (axis === 'col') this.colTreeNodes = data;
    else this.rowTreeNodes = data;

    this.syncTreeToFlatNodes(data, '');
    this.autoFixNodeTypes();
    this.syncCells();
    this.rebuildAll();
  }

  private syncTreeToFlatNodes(nodes: TreeNode[], parentId: string): void {
    nodes.forEach((tn, i) => {
      const idx = this.flatNodes.findIndex(n => n.id === tn.key);
      if (idx >= 0) {
        this.flatNodes[idx].pId = parentId;
        this.flatNodes[idx].orderNumber = i + 1;
      }
      if (tn.children?.length) this.syncTreeToFlatNodes(tn.children, tn.key);
    });
  }

  private autoFixNodeTypes(): void {
    const colNodes = this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType));
    colNodes.forEach(n => {
      n.nodeType = colNodes.some(c => c.pId === n.id) ? 'ColumnGroup' : 'Column';
    });
    const rowNodes = this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType));
    rowNodes.forEach(n => {
      n.nodeType = rowNodes.some(c => c.pId === n.id) ? 'RowGroup' : 'Row';
    });
  }

  renumberAll(): void {
    const processGroup = (nodes: ReportStructureDto[], pId: string) => {
      const children = nodes.filter(n => (n.pId || '') === pId)
        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
      children.forEach((n, i) => { n.orderNumber = i + 1; processGroup(nodes, n.id); });
    };
    processGroup(this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType)), '');
    processGroup(this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType)), '');
    this.afterStructureChange();
  }

  saveOrder(): void {
    this.renumberAll();
    this.saveTree();
  }

  private removeNodeRecursive(id: string) {
    const ids = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of this.flatNodes) {
        if (n.pId && ids.has(n.pId) && !ids.has(n.id)) { ids.add(n.id); changed = true; }
      }
    }
    this.flatNodes = this.flatNodes.filter(n => !ids.has(n.id));
    this.saveTree(); //call api save dữ liệu
  }

  openNodeDrawer(axis: 'col' | 'row', isEdit: boolean, parent: ReportStructureDto | null) {
    this.nodeAxis = axis;
    this.nodeIsEdit = isEdit;

    this.prepareTreeSelectDataCreate(axis);

    if (isEdit && parent) {
      this.nodeDto = { ...new ReportStructureDto(), ...parent };
    } else {
      this.nodeDto = new ReportStructureDto();
      this.nodeDto.id = this.genId();
      this.nodeDto.definitionId = this.definitionId;
      this.nodeDto.pId = parent ? parent.id : '';
      this.nodeDto.nodeType = axis === 'col' ? 'Column' : 'Row';
      this.nodeDto.rowSpan = 1;
      this.nodeDto.colSpan = 1;
      this.nodeDto.expanded = true;
      this.nodeDto.isActive = true;
      this.nodeDto.orderNumber = this.nextOrderNumber(this.nodeDto.pId, axis);
    }
    this.nodeDrawerVisible = true;
  }

  closeNodeDrawer() { this.nodeDrawerVisible = false; }

  saveNode() {
    if (!this.nodeDto.code || !this.nodeDto.name) { this.message.warning('Mã và tên là bắt buộc'); return; }
    const idx = this.flatNodes.findIndex(n => n.id === this.nodeDto.id);
    if (idx >= 0) this.flatNodes[idx] = { ...this.nodeDto };
    else this.flatNodes.push({ ...this.nodeDto });
    this.saveTree(); //call api save dữ liệu
    this.nodeDrawerVisible = false;
    this.autoFixNodeTypes();
    this.afterStructureChange();
  }

  private nextOrderNumber(pId: string, axis: 'col' | 'row'): number {
    const types = axis === 'col' ? COL_TYPES : ROW_TYPES;
    const siblings = this.flatNodes.filter(n => types.includes(n.nodeType) && (n.pId || '') === (pId || ''));
    return siblings.length ? Math.max(...siblings.map(n => n.orderNumber || 0)) + 1 : 1;
  }

  private afterStructureChange() {
    this.syncCells();
    this.rebuildAll();
  }

  syncCells(): { added: number; removed: number } {
    const colNodes = this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType));
    const realColLeaves = colNodes.filter(n => !colNodes.some(c => c.pId === n.id));
    const rowNodes = this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType));
    const realRowLeaves = rowNodes.filter(n => !rowNodes.some(c => c.pId === n.id));

    const cellByPair = new Map<string, ReportStructureDto>();
    const orphans: string[] = [];
    const cells = this.flatNodes.filter(n => n.nodeType === 'Cell');

    for (const cell of cells) {
      const m = this.matchPair(cell.code, realRowLeaves, realColLeaves);
      if (m) cellByPair.set(`${m.rowCode}|${m.colCode}`, cell);
      else orphans.push(cell.id);
    }

    let added = 0;
    let nextOrd = (cells.length ? Math.max(...cells.map(c => c.orderNumber || 0)) : 0) + 1;

    for (const row of realRowLeaves) {
      for (const col of realColLeaves) {
        const key = `${row.code}|${col.code}`;
        if (cellByPair.has(key)) {
          const cell = cellByPair.get(key)!;
          const expectedCode = gridCellCode(row.code, col.code);
          const expectedName = `${row.name} - ${col.name}`;
          if (cell.code !== expectedCode) cell.code = expectedCode;
          if (!cell.name || (!cell.name.includes(' - ') && !cell.name.includes('_'))) cell.name = expectedName;
          continue;
        }
        const newCell = new ReportStructureDto();
        newCell.id = this.genId();
        newCell.definitionId = this.definitionId;
        newCell.pId = '';
        newCell.code = gridCellCode(row.code, col.code);
        newCell.name = `${row.name} - ${col.name}`;
        newCell.nodeType = 'Cell';
        newCell.orderNumber = nextOrd++;
        newCell.dataTypeCode = '';
        newCell.format = '';
        newCell.isInput = true;
        newCell.isFormula = false;
        newCell.formula = '';
        newCell.rowSpan = 1;
        newCell.colSpan = 1;
        newCell.expanded = false;
        newCell.isActive = true;
        this.flatNodes.push(newCell);
        added++;
      }
    }

    if (orphans.length) {
      const orphSet = new Set(orphans);
      this.flatNodes = this.flatNodes.filter(n => !orphSet.has(n.id));
    }

    return { added, removed: orphans.length };
  }

  private matchPair(code: string, rows: ReportStructureDto[], cols: ReportStructureDto[]): { rowCode: string; colCode: string } | undefined {
    if (!code) return undefined;
    const rowCodes = rows.map(r => r.code).sort((a, b) => b.length - a.length);
    for (const rc of rowCodes) {
      if (code.startsWith(rc + '_')) {
        const cc = code.slice(rc.length + 1);
        if (cols.some(c => c.code === cc)) return { rowCode: rc, colCode: cc };
      }
    }
    const colCodes = cols.map(c => c.code).sort((a, b) => b.length - a.length);
    for (const cc of colCodes) {
      if (code.startsWith(cc + '_')) {
        const rc = code.slice(cc.length + 1);
        if (rows.some(r => r.code === rc)) return { rowCode: rc, colCode: cc };
      }
    }
    const dbl = code.indexOf('__');
    if (dbl > 0) {
      const rc = code.slice(0, dbl); const cc = code.slice(dbl + 2);
      if (rows.some(r => r.code === rc) && cols.some(c => c.code === cc)) return { rowCode: rc, colCode: cc };
    }
    return undefined;
  }

  openCellEdit(item: ReportStructureDto) {
    this.cellDto = { ...new ReportStructureDto(), ...item };
    this.cellDrawerVisible = true;
  }

  openCellEditNew(row: any, col: any) {
    const rowData = row.node;
    const colData = col;

    const definitionId = rowData.data?.definitionId || colData.data?.definitionId || '';

    const code = `${rowData.code}_${colData.code}`;
    this.structureSrv
      .getCellData(definitionId, code)
      .subscribe({
        next: (res: ReportStructureDto | null) => {
          if (res) {
            this.cellDto = { ...new ReportStructureDto(), ...res };
          } else {
            this.cellDto = {
              ...new ReportStructureDto(),
              definitionId,
              nodeType: 'Cell',
              code,
              name: `${rowData.name} - ${colData.name}`,
              format: rowData.format || colData.format || '',
              decimalRound: rowData.decimalRound ?? colData.decimalRound ?? null,
              validationRule: rowData.validationRule || '',
              style: rowData.style || '',
              expanded: true
            };
          }
          this.cellDrawerVisible = true;
        },

        error: () => {
          this.cellDto = {
            ...new ReportStructureDto(),
            definitionId,
            nodeType: 'Cell',
            code,
            name: `${rowData.name} - ${colData.name}`,
            format: rowData.format || colData.format || '',
            decimalRound: rowData.decimalRound ?? colData.decimalRound ?? null,
            validationRule: rowData.validationRule || '',
            style: rowData.style || '',
            expanded: true
          };
          this.cellDrawerVisible = true;
        }
      });
  }

  closeCellEdit() { this.cellDrawerVisible = false; }

  saveCell() {
    const idx = this.flatNodes.findIndex(n => n.id === this.cellDto.id);
    if (idx >= 0) this.flatNodes[idx] = { ...this.cellDto };
    this.cellDrawerVisible = false;
    this.saveCellEdit();
    this.rebuildAll();
  }

  filteredCellList(): ReportStructureDto[] {
    if (!this.cellListFilter) return this.cellList;
    const k = this.cellListFilter.trim().toLowerCase();
    return this.cellList.filter(c =>
      (c.code || '').toLowerCase().includes(k) || (c.name || '').toLowerCase().includes(k));
  }

  toggleBulk(id: string, on: boolean): void {
    if (on) this.bulkSelected.add(id); else this.bulkSelected.delete(id);
    // Force change detection by reassigning Set reference
    this.bulkSelected = new Set(this.bulkSelected);
  }
  isAllBulkSelected(): boolean {
    const list = this.filteredCellList();
    return list.length > 0 && list.every(c => this.bulkSelected.has(c.id));
  }
  toggleAllBulk(on: boolean): void {
    const list = this.filteredCellList();
    if (on) list.forEach(c => this.bulkSelected.add(c.id));
    else list.forEach(c => this.bulkSelected.delete(c.id));
    this.bulkSelected = new Set(this.bulkSelected);
  }
  openBulkEdit(): void {
    this.bulkDto = new ReportStructureDto();
    this.bulkApply = {};
    this.bulkDrawerVisible = true;
  }
  closeBulkEdit(): void { this.bulkDrawerVisible = false; }
  applyBulkEdit(): void {
    if (this.bulkSelected.size === 0) { this.bulkDrawerVisible = false; return; }
    if (!this.gridModel) { this.bulkDrawerVisible = false; return; }
    let count = 0;

    const applyProps = (node: ReportStructureDto) => {
      if (this.bulkApply.dataTypeCode) node.dataTypeCode = this.bulkDto.dataTypeCode;
      if (this.bulkApply.format) node.format = this.bulkDto.format;
      if (this.bulkApply.decimalRound) node.decimalRound = this.bulkDto.decimalRound;
      if (this.bulkApply.isInput) node.isInput = !!this.bulkDto.isInput;
      if (this.bulkApply.isFormula) node.isFormula = !!this.bulkDto.isFormula;
      if (this.bulkApply.formula) node.formula = this.bulkDto.formula || '';
    };

    // Update existing cells
    for (const [cellKey, cellMeta] of this.gridModel.cellByKey) {
      if (!this.bulkSelected.has(cellKey) || !cellMeta.data) continue;
      applyProps(cellMeta.data);
      count++;
    }

    // Create new Cell DTOs for selected cells that have no existing DTO record
    const existingCells = this.flatNodes.filter(n => n.nodeType === 'Cell');
    let nextOrd = existingCells.length ? Math.max(...existingCells.map(c => c.orderNumber || 0)) + 1 : 1;
    for (const rowNode of this.gridModel.rowLeaves) {
      for (const colNode of this.gridModel.columnLeaves) {
        const key = gridCellCode(rowNode.code, colNode.code);
        if (!this.bulkSelected.has(key) || this.gridModel.cellByKey.has(key)) continue;
        const newCell = new ReportStructureDto();
        newCell.id = this.genId();
        newCell.definitionId = this.definitionId;
        newCell.pId = '';
        newCell.code = key;
        newCell.name = `${rowNode.name} - ${colNode.name}`;
        newCell.nodeType = 'Cell';
        newCell.orderNumber = nextOrd++;
        newCell.dataTypeCode = '';
        newCell.format = '';
        newCell.isInput = false;
        newCell.isFormula = false;
        newCell.formula = '';
        newCell.rowSpan = 1;
        newCell.colSpan = 1;
        newCell.expanded = false;
        newCell.isActive = true;
        applyProps(newCell);
        this.flatNodes.push(newCell);
        count++;
      }
    }

    this.bulkSelected = new Set();
    this.message.success(`Đã cập nhật ${count} ô`);
    this.bulkDrawerVisible = false;
    this.rebuildAll();
    this.saveTree();
  }

  applyDataTypeFromRows(force: boolean) {
    const rowMap = new Map<string, ReportStructureDto>();
    this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType)).forEach(r => rowMap.set(r.code, r));
    let count = 0;
    for (const cell of this.flatNodes.filter(n => n.nodeType === 'Cell')) {
      const m = this.matchPair(cell.code, Array.from(rowMap.values()), this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType)));
      if (!m) continue;
      const row = rowMap.get(m.rowCode);
      if (!row) continue;
      let touched = false;
      if (row.dataTypeCode && (force || !cell.dataTypeCode)) { cell.dataTypeCode = row.dataTypeCode; touched = true; }
      if (row.format && (force || !cell.format)) { cell.format = row.format; touched = true; }
      if (touched) count++;
    }
    this.message.success(`Đã cập nhật ${count} ô từ kiểu dữ liệu của dòng`);
    this.rebuildAll();
  }

  applyDataTypeFromCols(force: boolean) {
    const colMap = new Map<string, ReportStructureDto>();
    this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType)).forEach(c => colMap.set(c.code, c));
    let count = 0;
    for (const cell of this.flatNodes.filter(n => n.nodeType === 'Cell')) {
      const m = this.matchPair(cell.code, this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType)), Array.from(colMap.values()));
      if (!m) continue;
      const col = colMap.get(m.colCode);
      if (!col) continue;
      let touched = false;
      if (col.dataTypeCode && (force || !cell.dataTypeCode)) { cell.dataTypeCode = col.dataTypeCode; touched = true; }
      if (col.format && (force || !cell.format)) { cell.format = col.format; touched = true; }
      if (touched) count++;
    }
    this.message.success(`Đã cập nhật ${count} ô từ kiểu dữ liệu của cột`);
    this.rebuildAll();
  }

  regenerateAllCells() {
    const r = this.syncCells();
    this.message.info(`Tạo ${r.added} ô mới, gỡ ${r.removed} ô không còn map.`);
    this.rebuildAll();
  }

  effectiveCellDataType(cell: ReportStructureDto): string {
    if (cell.dataTypeCode) return cell.dataTypeCode + ' (cell)';
    const m = this.matchPair(cell.code,
      this.flatNodes.filter(n => ROW_TYPES.includes(n.nodeType)),
      this.flatNodes.filter(n => COL_TYPES.includes(n.nodeType)));
    if (m) {
      const row = this.flatNodes.find(n => ROW_TYPES.includes(n.nodeType) && n.code === m.rowCode);
      if (row?.dataTypeCode) return row.dataTypeCode + ' (row)';
      const col = this.flatNodes.find(n => COL_TYPES.includes(n.nodeType) && n.code === m.colCode);
      if (col?.dataTypeCode) return col.dataTypeCode + ' (col)';
    }
    return '';
  }

  saveTree() {
    this.structureSrv.saveTree(this.definitionId, this.flatNodes).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.loadStructure(); }
      // next: () => { this.message.success('Đã lưu cấu trúc'); this.loadStructure(); }
    });
  }

  exportStructureExcel(): void {
    if (!this.gridModel) { this.message.warning('Chưa có cấu trúc'); return; }
    const g = this.gridModel;
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><style>td,th{border:1px solid #999;padding:4px 8px;}</style></head><body><table>`;

    if (g.hasColumns) {
      for (let li = 0; li < g.headerRows.length; li++) {
        html += '<tr>';
        if (li === 0) html += `<th rowspan="${g.columnDepth}">Chỉ tiêu</th>`;
        for (const c of g.headerRows[li]) {
          const cs = c.colspan > 1 ? ` colspan="${c.colspan}"` : '';
          const rs = c.isLeaf && (g.columnDepth - c.level) > 1 ? ` rowspan="${g.columnDepth - c.level}"` : '';
          html += `<th${cs}${rs}>${c.name}</th>`;
        }
        html += '</tr>';
      }
      for (const r of g.flatRows) {
        html += '<tr>';
        html += `<td>${'&nbsp;&nbsp;'.repeat(r.level)}${r.node.name} (${r.node.code})</td>`;
        if (r.node.isLeaf) for (const _c of g.columnLeaves) html += '<td></td>';
        else html += `<td colspan="${g.columnLeaves.length || 1}"></td>`;
        html += '</tr>';
      }
    } else {
      html += '<tr><th>Chỉ tiêu</th><th>Mã</th></tr>';
      for (const r of g.flatRows) {
        html += `<tr><td>${'&nbsp;&nbsp;'.repeat(r.level)}${r.node.name}</td><td>${r.node.code}</td></tr>`;
      }
    }

    html += '</table></body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.definition.code || 'report'}_cau-truc.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  loadFormulas() {
    this.formulaSrv.byDefinition(this.definitionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => this.formulas = r || []
    });
  }

  openFormula(item: any, isEdit: boolean) {
    this.formulaIsEdit = isEdit;
    if (isEdit) {
      this.formulaSrv.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: any) => { this.formulaDto = r; this.formulaDrawerVisible = true; }
      });
    } else {
      this.formulaDto = new ReportFormulaDto();
      this.formulaDto.definitionId = this.definitionId;
      this.formulaDto.isActive = true;
      this.formulaDrawerVisible = true;
    }
  }

  closeFormula() { this.formulaDrawerVisible = false; }

  saveFormula() {
    const action: 'update' | 'insert' = this.formulaIsEdit ? 'update' : 'insert';
    (this.formulaSrv as any)[action](this.formulaDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.formulaDrawerVisible = false; this.loadFormulas(); }
    });
  }

  deleteFormula(item: any) {
    this.formulaSrv.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadFormulas() });
  }

  insertFunction(fn: any) {
    this.formulaDto.expression = (this.formulaDto.expression || '') + (fn.syntax || fn.code + '()');
  }

  insertCellRef(node: ReportStructureDto) {
    this.formulaDto.expression = (this.formulaDto.expression || '') + (node.code || '');
  }

  insertFormulaFunction(fn: any) {
    this.cellDto.formula = (this.cellDto.formula || '') + (fn.syntax || fn.code + '()');
  }

  insertFormulaCellRef(node: ReportStructureDto) {
    this.cellDto.formula = (this.cellDto.formula || '') + (node.code || '');
  }

  loadTemplates() {
    this.templateSrv.byDefinition(this.definitionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => this.templates = r || []
    });
  }

  openUpload() { this.uploadFile = null; this.uploadName = ''; this.uploadNotes = ''; this.uploadDrawerVisible = true; }
  closeUpload() { this.uploadDrawerVisible = false; }

  beforeUpload = (file: any): boolean => {
    this.uploadFile = file as File;
    if (!this.uploadName) this.uploadName = file.name;
    return false;
  };

  doUpload() {
    if (!this.uploadFile) { this.message.warning('Hãy chọn file'); return; }
    const fd = new FormData();
    fd.append('definitionId', this.definitionId);
    fd.append('name', this.uploadName);
    fd.append('notes', this.uploadNotes);
    fd.append('file', this.uploadFile);
    this.templateSrv.upload(fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.uploadDrawerVisible = false; this.loadTemplates(); }
    });
  }

  downloadTemplate(item: any) {
    const base = this.env.getEnv('baseUrl') || '';
    window.open(`${base}Report/Template/Download/${item.id}`, '_blank');
  }

  deleteTemplate(item: any) {
    this.templateSrv.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadTemplates() });
  }

  cellAt(rowCode: string, colCode: string) {
    return this.gridModel?.cellByKey.get(gridCellCode(rowCode, colCode));
  }

  get tableScrollX(): string {
    if (!this.gridModel || !this.gridModel.hasColumns) return '800px';
    return `${240 + this.gridModel.columnLeaves.length * 120}px`;
  }

  back() { this.router.navigate(['/report/definition']); }

  private genId(): string {
    return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  prepareTreeSelectDataCreate(axis: 'col' | 'row') {
    if (axis == 'col') this.treeSelectData = this.mapToTreeSelectCreate(this.colTreeNodes);
    else this.treeSelectData = this.mapToTreeSelectCreate(this.rowTreeNodes);
  }

  mapToTreeSelectCreate(nodes: any[]): any[] {
    const result = nodes.map(node => ({
      title: node.title,
      key: node.key,
      value: node.key,
      children: node.children ? this.mapToTreeSelectCreate(node.children) : [],
      isLeaf: !node.children || node.children.length === 0,
      expanded: true,
    }));

    return result;
  }

  selectFirstNodeCol(): void {
    if (this.colTreeNodes.length > 0) {
      const firstNode = this.colTreeNodes[0];

      firstNode.selected = true;

      this.selectedColNode = firstNode.data;
    }
  }

  selectFirstNodeRow(): void {
    if (this.rowTreeNodes.length > 0) {
      const firstNode = this.rowTreeNodes[0];

      firstNode.selected = true;

      this.selectedRowNode = firstNode.data;
    }
  }

  saveCellEdit(): void {
    this.structureSrv
      .upsert(this.cellDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cellDrawerVisible = false;
        }
      });
  }

  setCellBulk(rowCode: string, colCode: string, on: boolean): void {
    const key = gridCellCode(rowCode, colCode);
    if (on) this.bulkSelected.add(key);
    else this.bulkSelected.delete(key);
    this.bulkSelected = new Set(this.bulkSelected);
  }

  isCellBulkSelected(rowCode: string, colCode: string): boolean {
    return this.bulkSelected.has(gridCellCode(rowCode, colCode));
  }

  isRowAllBulkSelected(rowCode: string): boolean {
    if (!this.gridModel) return false;
    const leaves = this.gridModel.columnLeaves;
    return leaves.length > 0 && leaves.every(col =>
      this.bulkSelected.has(gridCellCode(rowCode, col.code))
    );
  }

  toggleRowBulk(rowCode: string, on: boolean): void {
    if (!this.gridModel) return;
    for (const col of this.gridModel.columnLeaves) {
      const key = gridCellCode(rowCode, col.code);
      if (on) this.bulkSelected.add(key);
      else this.bulkSelected.delete(key);
    }
    this.bulkSelected = new Set(this.bulkSelected);
  }

  selectAllCellsBulk(): void {
    if (!this.gridModel) return;
    for (const r of this.gridModel.flatRows) {
      if (!r.node.isLeaf) continue;
      for (const col of this.gridModel.columnLeaves) {
        this.bulkSelected.add(gridCellCode(r.node.code, col.code));
      }
    }
    this.bulkSelected = new Set(this.bulkSelected);
  }

  clearBulkSelection(): void {
    this.bulkSelected = new Set();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
