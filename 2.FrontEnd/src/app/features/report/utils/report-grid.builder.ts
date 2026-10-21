import { ReportStructureDto } from '../models/report-structure.model';

export interface GridColNode {
    id: string;
    code: string;
    name: string;
    level: number;
    colspan: number;
    isLeaf: boolean;
    children: GridColNode[];
    data: ReportStructureDto;
}

export interface GridRowNode {
    id: string;
    code: string;
    name: string;
    level: number;
    isLeaf: boolean;
    isInput: boolean;
    isFormula: boolean;
    formula?: string;
    format?: string;
    dataTypeCode?: string;
    children: GridRowNode[];
    data: ReportStructureDto;
}

export interface GridCellMeta {
    code: string;
    rowCode?: string;
    colCode?: string;
    isInput: boolean;
    isFormula: boolean;
    formula?: string;
    /** Effective format: cell.format ?? row.format ?? col.format */
    format?: string;
    /** Effective data type: cell.dataTypeCode ?? row.dataTypeCode ?? col.dataTypeCode */
    dataTypeCode?: string;
    rawFormat?: string;
    rawDataTypeCode?: string;
    data?: ReportStructureDto;
}

export interface GridModel {
    hasColumns: boolean;
    columnTree: GridColNode[];
    columnLeaves: GridColNode[];
    headerRows: GridColNode[][];
    columnDepth: number;
    rowTree: GridRowNode[];
    rowLeaves: GridRowNode[];
    flatRows: { node: GridRowNode; level: number }[];
    cellByKey: Map<string, GridCellMeta>;          // key = `${rowCode}_${colCode}`
    cellByOriginalCode: Map<string, GridCellMeta>; // key = original cell.code
}

const ROW_TYPES = new Set(['RowGroup', 'Row']);
const COL_TYPES = new Set(['ColumnGroup', 'Column']);

/** Canonical cell code = rowCode_colCode */
export function gridCellCode(rowCode: string, colCode: string): string {
    return `${rowCode}_${colCode}`;
}

/** Canonical cell name = rowName - colName */
export function gridCellName(rowName: string, colName: string): string {
    return `${rowName} - ${colName}`;
}

export function buildGridModel(structure: ReportStructureDto[]): GridModel {
    const all = (structure || []).slice().sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

    const colNodes = all.filter(n => n.nodeType && COL_TYPES.has(n.nodeType));
    const rowNodes = all.filter(n => n.nodeType && ROW_TYPES.has(n.nodeType));
    const cellNodes = all.filter(n => n.nodeType === 'Cell');

    const columnTree = buildColTree(colNodes);
    const columnLeaves: GridColNode[] = [];
    collectColLeaves(columnTree, columnLeaves);
    const columnDepth = depthOfCols(columnTree);
    const headerRows: GridColNode[][] = [];
    for (let i = 0; i < columnDepth; i++) headerRows.push([]);
    fillHeaderRows(columnTree, 0, headerRows);

    const rowTree = buildRowTree(rowNodes);
    const rowLeaves: GridRowNode[] = [];
    collectRowLeaves(rowTree, rowLeaves);
    const flatRows: { node: GridRowNode; level: number }[] = [];
    flattenRows(rowTree, 0, flatRows);

    const colByCode = new Map<string, GridColNode>();
    columnLeaves.forEach(c => { if (c.code) colByCode.set(c.code, c); });
    const rowByCode = new Map<string, GridRowNode>();
    rowLeaves.forEach(r => { if (r.code) rowByCode.set(r.code, r); });

    const cellByKey = new Map<string, GridCellMeta>();
    const cellByOriginalCode = new Map<string, GridCellMeta>();

    for (const c of cellNodes) {
        const code = c.code || c.id;
        const match = matchCellToRowCol(code, rowByCode, colByCode);
        const colNode = match?.colCode ? colByCode.get(match.colCode) : undefined;
        const rowNode = match?.rowCode ? rowByCode.get(match.rowCode) : undefined;

        const effDataType =
            (c.dataTypeCode && c.dataTypeCode !== '') ? c.dataTypeCode :
            (rowNode?.dataTypeCode && rowNode.dataTypeCode !== '') ? rowNode.dataTypeCode :
            (colNode?.data?.dataTypeCode && colNode.data.dataTypeCode !== '') ? colNode.data.dataTypeCode :
            undefined;

        const effFormat =
            (c.format && c.format !== '') ? c.format :
            (rowNode?.format && rowNode.format !== '') ? rowNode.format :
            (colNode?.data?.format && colNode.data.format !== '') ? colNode.data.format :
            undefined;

        const meta: GridCellMeta = {
            code,
            rowCode: match?.rowCode,
            colCode: match?.colCode,
            isInput: !!c.isInput,
            isFormula: !!c.isFormula,
            formula: c.formula || undefined,
            format: effFormat,
            dataTypeCode: effDataType,
            rawFormat: c.format || undefined,
            rawDataTypeCode: c.dataTypeCode || undefined,
            data: c
        };
        cellByOriginalCode.set(code, meta);
        if (match?.rowCode && match?.colCode) {
            cellByKey.set(gridCellCode(match.rowCode, match.colCode), meta);
        }
    }

    return {
        hasColumns: columnLeaves.length > 0,
        columnTree, columnLeaves, headerRows, columnDepth,
        rowTree, rowLeaves, flatRows,
        cellByKey, cellByOriginalCode
    };
}

function matchCellToRowCol(
    code: string,
    rowByCode: Map<string, GridRowNode>,
    colByCode: Map<string, GridColNode>
): { rowCode: string; colCode: string } | undefined {
    if (!code) return undefined;
    // 1) New canonical: rowCode_colCode (longest row first)
    const rowCodes = Array.from(rowByCode.keys()).sort((a, b) => b.length - a.length);
    for (const rowCode of rowCodes) {
        const prefix = rowCode + '_';
        if (code.startsWith(prefix)) {
            const colCode = code.slice(prefix.length);
            if (colByCode.has(colCode)) return { rowCode, colCode };
        }
    }
    // 2) Legacy: colCode_rowCode (longest col first)
    const colCodes = Array.from(colByCode.keys()).sort((a, b) => b.length - a.length);
    for (const colCode of colCodes) {
        const prefix = colCode + '_';
        if (code.startsWith(prefix)) {
            const rowCode = code.slice(prefix.length);
            if (rowByCode.has(rowCode)) return { rowCode, colCode };
        }
    }
    // 3) Legacy double-underscore: rowCode__colCode
    const dbl = code.indexOf('__');
    if (dbl > 0) {
        const rowCode = code.slice(0, dbl);
        const colCode = code.slice(dbl + 2);
        if (rowByCode.has(rowCode) && colByCode.has(colCode)) return { rowCode, colCode };
    }
    return undefined;
}

// ---------- helpers ----------
function buildColTree(nodes: ReportStructureDto[]): GridColNode[] {
    const map = new Map<string, GridColNode>();
    const ids = new Set(nodes.map(n => n.id));
    nodes.forEach(n => map.set(n.id, {
        id: n.id, code: n.code || '', name: n.name || '', level: 0,
        colspan: 0, isLeaf: true, children: [], data: n
    }));
    const roots: GridColNode[] = [];
    nodes.forEach(n => {
        const node = map.get(n.id)!;
        if (n.pId && ids.has(n.pId)) map.get(n.pId)!.children.push(node);
        else roots.push(node);
    });
    const finalize = (list: GridColNode[], level: number) => {
        list.sort((a, b) => (a.data.orderNumber || 0) - (b.data.orderNumber || 0));
        for (const x of list) {
            x.level = level;
            x.isLeaf = x.children.length === 0;
            finalize(x.children, level + 1);
            x.colspan = x.isLeaf ? 1 : x.children.reduce((s, c) => s + c.colspan, 0);
        }
    };
    finalize(roots, 0);
    return roots;
}

function collectColLeaves(list: GridColNode[], out: GridColNode[]): void {
    for (const c of list) { if (c.isLeaf) out.push(c); else collectColLeaves(c.children, out); }
}

function depthOfCols(list: GridColNode[]): number {
    let d = 0;
    const walk = (nodes: GridColNode[], lvl: number) => {
        if (!nodes.length) return;
        d = Math.max(d, lvl + 1);
        for (const n of nodes) walk(n.children, lvl + 1);
    };
    walk(list, 0);
    return d;
}

function fillHeaderRows(list: GridColNode[], level: number, out: GridColNode[][]): void {
    for (const n of list) {
        out[level].push(n);
        if (n.children.length) fillHeaderRows(n.children, level + 1, out);
    }
}

function buildRowTree(nodes: ReportStructureDto[]): GridRowNode[] {
    const map = new Map<string, GridRowNode>();
    const ids = new Set(nodes.map(n => n.id));
    nodes.forEach(n => map.set(n.id, {
        id: n.id, code: n.code || '', name: n.name || '', level: 0,
        isLeaf: true, isInput: !!n.isInput, isFormula: !!n.isFormula,
        formula: n.formula || undefined, format: n.format || undefined,
        dataTypeCode: n.dataTypeCode || undefined,
        children: [], data: n
    }));
    const roots: GridRowNode[] = [];
    nodes.forEach(n => {
        const node = map.get(n.id)!;
        if (n.pId && ids.has(n.pId)) map.get(n.pId)!.children.push(node);
        else roots.push(node);
    });
    const finalize = (list: GridRowNode[], level: number) => {
        list.sort((a, b) => (a.data.orderNumber || 0) - (b.data.orderNumber || 0));
        for (const x of list) {
            x.level = level;
            x.isLeaf = x.children.length === 0;
            finalize(x.children, level + 1);
        }
    };
    finalize(roots, 0);
    return roots;
}

function collectRowLeaves(list: GridRowNode[], out: GridRowNode[]): void {
    for (const r of list) { if (r.isLeaf) out.push(r); else collectRowLeaves(r.children, out); }
}

function flattenRows(list: GridRowNode[], level: number, out: { node: GridRowNode; level: number }[]): void {
    for (const r of list) {
        out.push({ node: r, level });
        if (r.children.length) flattenRows(r.children, level + 1, out);
    }
}
