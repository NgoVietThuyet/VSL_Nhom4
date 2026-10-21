import { DocumentTreePlanNode } from '../../models/document-tree-plan.model';
import { TreePlanUtil } from '../../utils/tree-plan.util';

/** Logic tích chọn / lọc cây phương án — port từ tiep-nhan QLVB. */
export class DcPlanTreeState {
  listOfMapData: DocumentTreePlanNode[] = [];
  mapOfExpandedData: Record<string, DocumentTreePlanNode[]> = {};
  planPreview: DocumentTreePlanNode[] = [];
  visibleRows: DocumentTreePlanNode[] = [];
  khoiDonVi: { id: string; name: string }[] = [];
  planPreviewCount = 0;
  /** Tránh ngModelChange hàng loạt khi tích checkbox cột. */
  bulkUpdating = false;

  checkAllXuLyChinh = false;
  checkAllPhoiHop = false;
  checkAllNhanDeBiet = false;

  filterPlan = { searchText: '', searchKhoi: '' as string | null };
  private nodeStates = new Map<string, Partial<DocumentTreePlanNode>>();

  constructor(private tree: TreePlanUtil) {}

  initFromFlat(flat: DocumentTreePlanNode[]): void {
    this.khoiDonVi = flat
      .filter(x => x.isNotCreatePlan)
      .map(x => ({ id: x.id, name: x.name ?? x.id }));
    this.planPreview = flat.filter(
      x => (x.isXuLyChinh || x.isPhoiHop || x.isNhanDeBiet) && !x.isNotCreatePlan,
    );
    this.listOfMapData = this.tree.buildTreeOptimaze(flat);
    this.mapOfExpandedData = {};
    this.listOfMapData.forEach(item => {
      this.mapOfExpandedData[item.key ?? item.id] = this.tree.convertTreeToList(item);
    });
    this.refreshVisibleRows();
    this.planPreviewCount = this.planPreview.filter(x => !x.isNotCreatePlan).length;
  }

  clear(): void {
    this.listOfMapData = [];
    this.mapOfExpandedData = {};
    this.planPreview = [];
    this.visibleRows = [];
    this.khoiDonVi = [];
    this.planPreviewCount = 0;
    this.nodeStates.clear();
    this.filterPlan = { searchText: '', searchKhoi: null };
  }

  refreshVisibleRows(): void {
    const rows: DocumentTreePlanNode[] = [];
    this.listOfMapData.forEach(root => {
      const key = root.key ?? root.id;
      const nodes = this.mapOfExpandedData[key] ?? [];
      nodes.forEach(item => {
        if ((item.parent && item.parent.expand) || !item.parent) {
          rows.push(item);
        }
      });
    });
    this.visibleRows = rows;
  }

  onExpandChange(item: DocumentTreePlanNode, expanded: boolean): void {
    const key = this.listOfMapData[0]?.key ?? this.listOfMapData[0]?.id;
    if (!key) return;
    const arr = this.mapOfExpandedData[key];
    if (arr) {
      this.tree.collapse(arr, item, expanded);
      item.expand = expanded;
    }
    this.refreshVisibleRows();
  }

  onSearchChange(): void {
    const keyword = this.filterPlan.searchText?.trim().toLowerCase();
    const khoi = this.filterPlan.searchKhoi;

    this.forEachExpanded(node => {
      this.nodeStates.set(node.id, {
        isChuTri: node.isChuTri,
        isXuLyChinh: node.isXuLyChinh,
        isPhoiHop: node.isPhoiHop,
        isNhanDeBiet: node.isNhanDeBiet,
        expand: true,
        color: node.color,
        isChuTriDisabled: node.isChuTriDisabled,
        isXuLyChinhDisabled: node.isXuLyChinhDisabled,
        isPhoiHopDisabled: node.isPhoiHopDisabled,
        isNhanDeBietDisabled: node.isNhanDeBietDisabled,
      });
    });

    if (!keyword && !khoi) {
      this.mapOfExpandedData = {};
      this.listOfMapData.forEach(item => {
        const nodes = this.tree.convertTreeToList(item);
        nodes.forEach(node => {
          const saved = this.nodeStates.get(node.id);
          if (saved) Object.assign(node, saved);
        });
        this.mapOfExpandedData[item.key ?? item.id] = nodes;
      });
      this.refreshVisibleRows();
      return;
    }

    this.mapOfExpandedData = {};
    this.listOfMapData.forEach(item => {
      const allNodes = this.tree.convertTreeToList(item);
      const filteredNodes = new Set<DocumentTreePlanNode>();
      const nodeMap = new Map(allNodes.map(n => [n.id, n]));

      allNodes.forEach(node => {
        const matchKhoi = !khoi || node.id === khoi || this.isDescendant(node, khoi, nodeMap);
        const matchText =
          !keyword ||
          (node.name?.toLowerCase() ?? '').includes(keyword) ||
          (node.nameKhongDau?.toLowerCase() ?? '').includes(keyword);

        if (matchKhoi && matchText) {
          let current: DocumentTreePlanNode | undefined = node;
          while (current) {
            filteredNodes.add(current);
            current = current.parent ? nodeMap.get(current.parent.id) : undefined;
          }
          if (khoi && node.id === khoi) {
            allNodes.forEach(child => {
              if (this.isDescendant(child, node.id, nodeMap)) {
                const childMatch =
                  !keyword ||
                  (child.name?.toLowerCase() ?? '').includes(keyword) ||
                  (child.nameKhongDau?.toLowerCase() ?? '').includes(keyword);
                if (childMatch) filteredNodes.add(child);
              }
            });
          }
        }
      });

      const result = allNodes.filter(n => filteredNodes.has(n));
      result.forEach(node => {
        const saved = this.nodeStates.get(node.id);
        if (saved) Object.assign(node, saved);
        else if (node.children?.length) node.expand = true;
      });
      this.mapOfExpandedData[item.key ?? item.id] = result;
    });
    this.refreshVisibleRows();
  }

  onChangeCheckbox(it: DocumentTreePlanNode, f: keyof DocumentTreePlanNode): void {
    const ex = ['isXuLyChinh', 'isPhoiHop', 'isNhanDeBiet'] as const;
    if (ex.includes(f as typeof ex[number]) && it[f as 'isXuLyChinh']) {
      ex.forEach(k => { if (k !== f) (it as any)[k] = false; });
    }
    this.applyColor(it);

    this.checkAllPhoiHop = this.checkAllNhanDeBiet = this.checkAllXuLyChinh = false;

    if (f === 'isChuTri') {
      this.applyColor(it);
      this.syncToPlanPreview(it);
      this.saveNodeState(it);
      return;
    }

    if (it.isXuLyChinh) it.isChuTriDisabled = false;
    else {
      it.isChuTri = false;
      it.isChuTriDisabled = true;
    }
    if (f === 'isPhoiHop' && it.isPhoiHop) it.isChuTri = false;
    if (f === 'isNhanDeBiet' && it.isNhanDeBiet) it.isChuTri = false;

    const c = !!(it.isXuLyChinh || it.isPhoiHop || it.isNhanDeBiet);

    if (it.type === 'ORG' && !it.isNotCreatePlan) {
      this.forEachExpanded(i => {
        if (i.type === 'USER' && i.pId === it.id) {
          if (c) {
            i.isChuTri = i.isXuLyChinh = i.isPhoiHop = i.isNhanDeBiet = false;
            i.isChuTriDisabled = i.isXuLyChinhDisabled = i.isPhoiHopDisabled = i.isNhanDeBietDisabled = true;
          } else {
            i.isChuTriDisabled = true;
            i.isXuLyChinhDisabled = i.isPhoiHopDisabled = i.isNhanDeBietDisabled = false;
          }
          this.saveNodeState(i);
        }
      });
    }

    if (it.type === 'ORG' && it.isNotCreatePlan) {
      this.forEachExpanded(i => {
        if (i.pId === it.id && i.type === 'ORG' && !(i.isChuTriDisabled && i.isXuLyChinhDisabled && i.isPhoiHopDisabled && i.isNhanDeBietDisabled)) {
          if (f === 'isXuLyChinh') {
            if (it.isXuLyChinh) {
              i.isPhoiHop = false;
              i.isNhanDeBiet = false;
              i.isXuLyChinh = true;
              i.isChuTriDisabled = false;
            } else {
              i.isXuLyChinh = false;
              i.isChuTri = false;
              i.isChuTriDisabled = true;
            }
          }
          if (f === 'isPhoiHop') {
            if (it.isPhoiHop) {
              i.isNhanDeBiet = false;
              if (!i.isXuLyChinh) i.isPhoiHop = true;
            } else i.isPhoiHop = false;
          }
          if (f === 'isNhanDeBiet') {
            if (it.isNhanDeBiet) {
              if (!i.isXuLyChinh && !i.isPhoiHop) i.isNhanDeBiet = true;
            } else i.isNhanDeBiet = false;
          }
          this.applyColor(i);
          this.syncToPlanPreview(i);
          this.saveNodeState(i);
        }
      });
    }

    if (it.type === 'USER') {
      let check = 0;
      this.forEachExpanded(i => {
        if (i.pId === it.pId && i.type === 'USER' && (i.isXuLyChinh || i.isPhoiHop || i.isNhanDeBiet)) check++;
      });
      this.forEachExpanded(i => {
        if (i.id === it.pId && i.type === 'ORG') {
          if (check > 0) {
            i.isChuTri = i.isXuLyChinh = i.isPhoiHop = i.isNhanDeBiet = false;
            i.isChuTriDisabled = i.isXuLyChinhDisabled = i.isPhoiHopDisabled = i.isNhanDeBietDisabled = true;
          } else {
            i.isChuTriDisabled = i.isXuLyChinhDisabled = i.isPhoiHopDisabled = i.isNhanDeBietDisabled = false;
          }
          this.saveNodeState(i);
        }
      });
    }

    this.syncToPlanPreview(it);
    this.saveNodeState(it);
    this.planPreviewCount = this.planPreview.filter(x => !x.isNotCreatePlan).length;
  }

  onChangeCheckboxAll(checked: boolean, f: 'isXuLyChinh' | 'isPhoiHop' | 'isNhanDeBiet'): void {
    this.bulkUpdating = true;
    try {
      this.forEachExpanded(node => {
        const x = !node.isXuLyChinh;
        let changed = false;

        if (f === 'isPhoiHop' && node.isShowCheckbox && !node.isPhoiHopDisabled) {
          const newPhoiHop = checked && x;
          if (node.isPhoiHop !== newPhoiHop) {
            node.isPhoiHop = newPhoiHop;
            changed = true;
          }
          const newNhanDeBiet = newPhoiHop ? false : node.isNhanDeBiet;
          if (node.isNhanDeBiet !== newNhanDeBiet) {
            node.isNhanDeBiet = newNhanDeBiet;
            changed = true;
          }
        }

        if (f === 'isNhanDeBiet' && node.isShowCheckbox && !node.isNhanDeBietDisabled) {
          const newVal = checked && x && !node.isPhoiHop;
          if (node.isNhanDeBiet !== newVal) {
            node.isNhanDeBiet = newVal;
            changed = true;
          }
        }

        if (f === 'isXuLyChinh' && node.type === 'ORG' && node.isShowCheckbox && !node.isXuLyChinhDisabled) {
          if (node.isXuLyChinh !== checked) {
            node.isXuLyChinh = checked;
            changed = true;
          }
          if (!checked && node.isChuTri) {
            node.isChuTri = false;
            changed = true;
          }
          if (node.isPhoiHop) {
            node.isPhoiHop = false;
            changed = true;
          }
          if (node.isNhanDeBiet) {
            node.isNhanDeBiet = false;
            changed = true;
          }
        }

        if (changed) {
          this.applyColor(node);
          this.saveNodeState(node);
        }
      });

      if (f === 'isXuLyChinh') this.checkAllXuLyChinh = checked;
      if (f === 'isPhoiHop') this.checkAllPhoiHop = checked;
      if (f === 'isNhanDeBiet') this.checkAllNhanDeBiet = checked;

      this.rebuildPlanPreview();
    } finally {
      this.bulkUpdating = false;
    }
  }

  deletePreviewPlan(item: DocumentTreePlanNode): void {
    item.isChuTri = item.isXuLyChinh = item.isPhoiHop = item.isNhanDeBiet = false;
    this.forEachExpanded(i => {
      if (i.id === item.id) {
        i.isChuTri = i.isXuLyChinh = i.isPhoiHop = i.isNhanDeBiet = false;
      }
    });
    this.planPreview = this.planPreview.filter(x => x.id !== item.id);
    this.planPreviewCount = this.planPreview.length;
  }

  getSelection(): { toOrganizationIds: string[]; toUsernames: string[]; leaderUsername?: string } {
    const toOrganizationIds = this.planPreview
      .filter(x => x.type === 'ORG' && !x.isNotCreatePlan && (x.isXuLyChinh || x.isPhoiHop || x.isNhanDeBiet))
      .map(x => x.id);
    const toUsernames = this.planPreview
      .filter(x => x.type === 'USER' && (x.isXuLyChinh || x.isPhoiHop || x.isNhanDeBiet))
      .map(x => x.id);
    const leader = this.planPreview.find(x => x.type === 'USER' && x.isLanhDao && x.isXuLyChinh);
    return {
      toOrganizationIds,
      toUsernames,
      leaderUsername: leader?.id,
    };
  }

  private syncToPlanPreview(data: DocumentTreePlanNode): void {
    const c = !!(data.isChuTri || data.isXuLyChinh || data.isPhoiHop || data.isNhanDeBiet);
    if (c && !this.planPreview.some(x => x.id === data.id)) {
      this.planPreview = [...this.planPreview, data];
    } else if (c) {
      this.planPreview = this.planPreview.map(i => (i.id === data.id ? { ...i, ...data } : i));
    } else {
      this.planPreview = this.planPreview.filter(x => x.id !== data.id);
    }
    this.sortPlanPreview();
  }

  /** Gom preview một lần sau tích all — tránh N lần syncToPlanPreview. */
  private rebuildPlanPreview(): void {
    const selected: DocumentTreePlanNode[] = [];
    this.forEachExpanded(node => {
      if (node.isNotCreatePlan) return;
      if (node.isChuTri || node.isXuLyChinh || node.isPhoiHop || node.isNhanDeBiet) {
        selected.push(node);
      }
    });
    this.planPreview = selected;
    this.sortPlanPreview();
  }

  private sortPlanPreview(): void {
    const users = this.planPreview
      .filter(i => i.type === 'USER')
      .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
    const chuTri = this.planPreview.filter(i => i.type === 'ORG' && i.isChuTri && i.isXuLyChinh);
    const xlc = this.planPreview.filter(i => i.type === 'ORG' && !i.isChuTri && i.isXuLyChinh);
    const ph = this.planPreview.filter(i => i.isPhoiHop);
    const ndb = this.planPreview.filter(i => i.isNhanDeBiet);
    this.planPreview = [...users, ...chuTri, ...xlc, ...ph, ...ndb];
    this.planPreviewCount = this.planPreview.filter(x => !x.isNotCreatePlan).length;
  }

  private applyColor(it: DocumentTreePlanNode): void {
    const { kieuXuLyChecked, isXuLyChinh, isPhoiHop, isNhanDeBiet } = it;
    const hasAny = !!(isXuLyChinh || isPhoiHop || isNhanDeBiet);
    const sel = kieuXuLyChecked;
    if (!sel && hasAny) it.color = 'green';
    else if (sel && !hasAny) it.color = 'red';
    else if (sel && hasAny) {
      const b1 = sel === 'XU_LY_CHINH' && isXuLyChinh && !isPhoiHop && !isNhanDeBiet;
      const b2 = sel === 'PHOI_HOP' && isPhoiHop && !isXuLyChinh && !isNhanDeBiet;
      const b3 = sel === 'NHAN_DE_BIET' && isNhanDeBiet && !isXuLyChinh && !isPhoiHop;
      it.color = b1 || b2 || b3 ? 'black' : '#e1a429';
    } else it.color = 'black';
  }

  private saveNodeState(it: DocumentTreePlanNode): void {
    this.nodeStates.set(it.id, {
      isChuTri: it.isChuTri,
      isXuLyChinh: it.isXuLyChinh,
      isPhoiHop: it.isPhoiHop,
      isNhanDeBiet: it.isNhanDeBiet,
      color: it.color,
      isChuTriDisabled: it.isChuTriDisabled,
      isXuLyChinhDisabled: it.isXuLyChinhDisabled,
      isPhoiHopDisabled: it.isPhoiHopDisabled,
      isNhanDeBietDisabled: it.isNhanDeBietDisabled,
    });
  }

  private forEachExpanded(fn: (n: DocumentTreePlanNode) => void): void {
    Object.values(this.mapOfExpandedData).forEach(nodes => nodes.forEach(fn));
  }

  private isDescendant(node: DocumentTreePlanNode, ancestorId: string, map: Map<string, DocumentTreePlanNode>): boolean {
    let cur: DocumentTreePlanNode | undefined = node;
    while (cur?.parent) {
      if (cur.parent.id === ancestorId) return true;
      cur = map.get(cur.parent.id);
    }
    return false;
  }
}
