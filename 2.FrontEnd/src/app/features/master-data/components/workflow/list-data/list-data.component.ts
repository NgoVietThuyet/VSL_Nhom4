import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { id, tr } from 'date-fns/locale';
import { WorkflowDetailComponent } from '../workflow-detail/workflow-detail.component';
import { Subject, takeUntil } from 'rxjs';
import * as GlobalConstants from '../../../../../shared/constants/global.constants';
import {NzModalService} from 'ng-zorro-antd/modal';
import { NzFormatEmitEvent, NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { SharedModules } from '../../../../../shared/ng-zorro.module';
import { OrganizeFilter } from '../../../../filter/document/master-data/organize.filter';
import { GlobalService } from '../../../../../core';
import { OrganizationalUnitService } from '../../../services/organizational-unit.service';
import { OrganizeInService } from '../../../services/organize-in.service';
import { OrganizeService } from '../../../services/organize.service';
import { WorkflowService } from '../../../../system-manager/services/workflow.service';
import { ModuleTypeService } from '../../../services/module-type.service';

@Component({
  selector: 'app-list-data',
  imports: [SharedModules, WorkflowDetailComponent],
  templateUrl: './list-data.component.html',
  styleUrl: './list-data.component.scss'
})
export class ListDataComponent implements OnInit {
  listDataByType: any[] = [];
  currentModuleType: any = null;

  // Drawer properties
  drawerVisible = false;
  isVisibleStepFlow = false;
  isEditWorkflow = false;

  selectedWorkflowId: string = '';
  validateForm: FormGroup;
  organizations: any[] = [];
  moduleTypes: any[] = [];
  workflowType: any[] = [
    { value: 'DIEU_HANH', label: 'Điều hành văn bản' },
    { value: 'XU_LY_CV', label: 'Xử lý công việc' },
  ]
  private destroy$ = new Subject<void>();
  searchInputList$ = new Subject<string>();

  filterOrganize = new OrganizeFilter();
  total = 0;
  pageSize = 50;
  pageIndex = 1;
  searchText: string = '';
  totalPageOrg = 1;
  isEditModalVisible = false;

  searchValueNodeOrg: string = '';
  listUnselected: any[] = [];
  listUnselectedOrigin: any[] = [];
  defaultCheckedKeys: string[] = [];
  listSelected: any[] = [];
  selectedNodeUnitId: any = null;
  setOfCheckedKey = new Set<string>();
  indeterminate = false;
  isCheckedAll = false;
  searchValueSelected = '';
  listSelectedOrigin: any[] = [];
  defaultSelectedKeys: string[] = [];
  defaultExpandedKeys: string[] = [];

  constructor(
    private router: Router,
    private organizationalUnitService: OrganizationalUnitService,
    private _sOrg: OrganizeService,
    public globalService: GlobalService,
    private workflowService: WorkflowService,
    private fb: NonNullableFormBuilder,
    private message: NzMessageService,
    private organizeInService: OrganizeInService,
    private moduleTypeService: ModuleTypeService,
    private modal: NzModalService,
  ) {
    this.validateForm = this.fb.group({
      id: [],
      workflowCode: ['', [Validators.required]],
      workflowName: ['', [Validators.required]],
      moduleTypeCode: [null, [Validators.required]],
      workflowType: [''],
      organizeInCodes: [null, [Validators.required]],
      isActive: [true, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.filterOrganize.DataFilter.isNgoaiNganh = true;
    this.onChangeOrganize();
    // this.getKhoiDonVi();

    this.workflowService.listDataByType$.subscribe(data => {
      this.listDataByType = data;
    });

    this.workflowService.selectedModuleType$.subscribe(type => {
      this.currentModuleType = type;
      if (type) {
        this.validateForm.patchValue({ moduleTypeCode: type.code });
      }
    });

    this.fetchDropdownData();
    this.searchNodeOrg();
  }

  organizationsFilter: any[] = [];

  fetchDropdownData(): void {
    this.organizeInService.getOrg().subscribe((res: any) => {
      this.organizations = res;
      this.organizationsFilter = [...res];
    });
    this.moduleTypeService.getAll().subscribe(res => {
      this.moduleTypes = res;
    });
  }

  getWorkflowTypeLabel(value: string): string {
    const type = this.workflowType.find((item) => item.value === value);
    return type ? type.label : value;
  }

  filter = {
    keyWord: '',
    workflowType: null,
    organizeInCode: null
  };

  onSearch(): void {
    const baseFilter = {
      pageSize: 1000,
      pageNumber: 1,
      KeyWord: this.filter.keyWord || '',
      DataFilter: {
        ModuleTypeCode: this.currentModuleType?.code || '',
        WorkflowType: this.filter.workflowType || '',
        OrganizeInCode: this.filter.organizeInCode || ''
      }
    };

    this.workflowService.search(baseFilter).subscribe(res => {
      this.listDataByType = res.data || [];
    });
  }


  onItemClick(item: any): void {
    this.selectedWorkflowId = item.id;
    this.isVisibleStepFlow = true;
    // this.router.navigate([`system-manager/workflow/${item.id}`]);
  }
  closeEditStepflow(): void {
    this.isVisibleStepFlow = false;
  }
  checkedKeys: string[] = [];
  openCreateEditWorkflow(item?: any): void {
    if (!item) {
      this.isEditWorkflow = false;
      this.listSelected = []
      this.defaultCheckedKeys = []
      this.disableCheckboxInPlace(this.listUnselected);
      this.validateForm.reset();
      if (this.currentModuleType) {
        this.validateForm.patchValue({
          moduleTypeCode: this.currentModuleType.code,
          isActive: true,
        });
      }
    }
    else {
      this.isEditWorkflow = true;

      if (this.currentModuleType) {
        const selectedOrgs = item.workflowOrganizeIns.map((org: any) => ({
          key: org.organizeInCode,
          title: org.organizeInName,
          isChecked:true,
        }));

        this.validateForm.patchValue({
          id: item.id,
          workflowCode: item.workflowCode,
          workflowName: item.workflowName,
          workflowType: item.workflowType,
          organizeInCodes: selectedOrgs.map((x:any) => x.key),
          moduleTypeCode: this.currentModuleType.code,
          isActive: true,
        });

        this.listSelected = selectedOrgs;
        this.listSelectedOrigin = [...selectedOrgs]
        this.defaultCheckedKeys = selectedOrgs.map((x:any) => x.key);
        this.syncCheckedNodesOpenEdit(this.listUnselected);
        this.disableCheckboxInPlace(this.listUnselected);
        this.syncUnitStatus(this.listUnselected);
      }
    }
    this.drawerVisible = true;
  }

disableCheckboxInPlace(nodes: any[]): boolean {
  let hasCheckedChild = false;

  for (const node of nodes) {

    let allChildrenChecked = false;

    // Đệ quy xử lý children
    if (node.children?.length) {
      allChildrenChecked = this.disableCheckboxInPlace(node.children);
    }

    // Kiểm tra node có được chọn hay không
    const isSelfSelected = this.listSelected.some(x => x.key === node.key);

    // Nếu node là Unit, disable chỉ khi tất cả con của nó đã checked
    if (node.type === 'Unit') {
      node.disableCheckbox = node.children?.length
        ? node.children.every((c:any) => this.defaultCheckedKeys.includes(c.key))
        : isSelfSelected;
    } else {
      // Node con ORG hoặc leaf: disable nếu được chọn
      node.disableCheckbox = isSelfSelected;
    }

    // Nếu node disable mà chưa có trong defaultCheckedKeys → push vào
    if (node.disableCheckbox && !this.defaultCheckedKeys.includes(node.key)) {
      this.defaultCheckedKeys.push(node.key);
      if (!this.listSelected.some(x => x.key === node.key)) {
        this.listSelected.push({ key: node.key, title: node.title, type: node.type } );
      }
    }

    // Trả về true nếu tất cả con checked
    hasCheckedChild = node.children?.length
      ? node.children.every((c:any) => this.defaultCheckedKeys.includes(c.key))
      : isSelfSelected;
  }

  return hasCheckedChild;
}

    syncCheckedNodesOpenEdit(nodes: any[]) {
    for (const node of nodes) {
      node.checked = this.defaultCheckedKeys.includes(node.key);

      if (node.children?.length) {
        this.syncCheckedNodesOpenEdit(node.children);
      }
    }
  }

  closeDrawer(): void {
    this.fetchDropdownData();
    this.filterOrganize.DataFilter.khoiDonViId = [];
    this.drawerVisible = false;
  }

submitForm(): void {
  const organizeCtrl = this.validateForm.get('organizeInCodes');
  organizeCtrl?.clearValidators();
  organizeCtrl?.updateValueAndValidity({ emitEvent: false });

  if (this.validateForm.invalid) {
    Object.values(this.validateForm.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity();
    });
    return;
  }

  const formData = this.validateForm.getRawValue();

    const organizeCodes: string[] = this.isEditWorkflow
    ? this.listSelected.map(x => x.key)
    : (formData.organizeInCodes ?? []);

  const payload = {
    ...formData,
    id: this.isEditWorkflow ? formData.id : null,
    moduleTypeName: this.currentModuleType?.name || '',
    workflowOrganizeIns: organizeCodes.map(code => {
      const org = this.organizations.find(o => o.code === code);
      return {
        organizeInCode: code,
        organizeInName: org?.name || ''
      };
    })
  };

  delete payload.organizeInCodes;

    // this.workflowService.addWorkflow(payload).subscribe({
    //   next: (res) => {
    //     this.closeDrawer();
    //     this.workflowService.updateListDataByType(this.currentModuleType.id);
    //   },
    //   error: () => this.message.error('Thêm mới thất bại!')
    // });
    const action = this.isEditWorkflow
      ? this.workflowService.updateWorkflow(payload)
      : this.workflowService.addWorkflow(payload);

    action.subscribe({
      next: (res) => {
        this.closeDrawer();
        this.workflowService.updateListDataByType(this.currentModuleType.code);
      },
      error: () => this.message.error(this.isEditWorkflow ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!')
    });
  }

  onChangeOrganize() {
    // this.filter.DataFilter.filter.donViGuiId = null;
    this.filterOrganize.PageSize = this.pageSize;
    this.filterOrganize.CurrentPage = this.pageIndex;
    this.filterOrganize.KeyWord = this.searchText;
    this.filterOrganize.DataFilter.id = '';
    this.filterOrganize.CurrentPage = 1;
    this.globalService.showLoading();

    this._sOrg
      .search(this.filterOrganize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.organizationsFilter = data.data;
          this.totalPageOrg = data.totalPage;
          this.total = data.totalRecord || 0;
          this.globalService.hideLoading();
        },
        error: () => {
          this.globalService.hideLoading();
        },
      });
  }

  customFilter = (input: string, option: any): boolean => {
    const normalize = (str: string) =>
      str
        .normalize('NFD') // tách dấu ra
        .replace(/[\u0300-\u036f]/g, '') // xóa dấu
        .toLowerCase();

    return normalize(option.nzLabel).includes(normalize(input));
  };

  listKhoiDonVi: any[] = [];
  readonly globalConstants = GlobalConstants;
  getKhoiDonVi() {
    this.organizationalUnitService
      .getAllKhoiDonViByOrgId({
        dataFilter: {
          orgId: this.globalConstants.BO_CONG_AN_CODE,
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.listKhoiDonVi = data;
        },
      });
  }

  changePage(step: number): void {
    const current = this.filterOrganize.CurrentPage || 1;
    const nextPage = current + step;

    if (nextPage >= 1 && nextPage <= this.totalPageOrg) {
      this.filterOrganize.CurrentPage = nextPage;
      this._sOrg.search(this.filterOrganize).subscribe((res) => {
        this.organizationsFilter = res.data;
        this.totalPageOrg = res.totalPage;
        if (this.filterOrganize.CurrentPage > res.totalPage) {
          this.filterOrganize.CurrentPage = 1;
        }
        this.totalPageOrg = res.totalPage;
      });
    }
  }

  onSearchInputList(value: string): void {
    this.searchInputList$.next(value);
  }


  deleteWorkflows(id: string): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa luồng quy trình',
      nzContent: 'Đồng chí có chắc chắn muốn xóa luồng quy trình này?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Đóng',
      nzOnOk: () => {
        this.globalService.showLoading();
        this.workflowService.deleteWorkflows(id).subscribe({
          next: (res) => {
            this.globalService.hideLoading();
            this.onSearch();
          },
          error: () => {
            this.globalService.hideLoading();
          }
        });
      }
    });
  }

showModelEditOrganizationalUnit(): void {
  if (this.searchValueNodeOrg) {
    this.searchValueNodeOrg = '';
  }

  this.filterNodeOrg();

  this.defaultExpandedKeys = this.collectAllExpandableKeys(this.listUnselected);

  this.isEditModalVisible = true;
}
  closeModelEditOrganizationalUnit(): void {
    this.isEditModalVisible = false;
    this.arrayUnit = [];
  }

  resetNodeOrg() {
    this.searchValueNodeOrg = '';
    this.filterNodeOrg();
  }
  searchNodeOrg() {
    this.organizationalUnitService
      .GetTreeOrganize({ orgId: 'G01' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any[]) => {
          const treeData = this.buildNzTree(res);
          this.listUnselected = treeData;
          this.listUnselectedOrigin = structuredClone(treeData);

          this.defaultExpandedKeys = this.collectAllExpandableKeys(
            this.listUnselected
          );
        },
        error: (err) => console.error('API ERROR', err),
      });
  }

  nzEvent(event: NzFormatEmitEvent): void {
    const checkedNodes = event.checkedKeys ?? [];

    this.defaultCheckedKeys = checkedNodes.map((n) => n.key as string);
  }

  private isUnitFullySelected(node: any): boolean {
  if (!node.children || node.children.length === 0) return false;

  return node.children.every((child: any) =>
    this.listSelected.some(s => s.key === child.key)
  );
}
arrayUnit:string[] = [];
syncUnitStatus(nodes: any[]): void {
  for (const node of nodes) {
    if (node.type === 'Unit') {
      const isFull = this.isUnitFullySelected(node);
      
      if (isFull) {
        node.disableCheckbox = true;
        this.arrayUnit.push(node.key);
        if (!this.defaultCheckedKeys.includes(node.key)) {
          this.defaultCheckedKeys.push(node.key);
        }
      }
    }

    if (node.children?.length) {
      this.syncUnitStatus(node.children);
    }
  }
}

  moveToSelected(): void {
    const newSelectedNodes: any[] = [];

const collectNewCheckedNodes = (nodes: any[]): void => {
  for (const node of nodes) {
    const isChecked = this.defaultCheckedKeys.includes(node.key);
    const alreadyExists = this.listSelected.some(s => s.key === node.key);

    if (node.type === 'Unit') {
      if (node.children?.length) {
        collectNewCheckedNodes(node.children);
      }
      continue;
    }

    if (isChecked && !alreadyExists && node.type === 'ORG') {
      newSelectedNodes.push({
        key: node.key,
        title: node.title
      });
    }

    if (node.children?.length) {
      collectNewCheckedNodes(node.children);
    }
  }
};


    collectNewCheckedNodes(this.listUnselected);

    if (newSelectedNodes.length === 0) {
      this.message.warning('Không có đơn vị nào mới để thêm');
      return;
    }

    const formData = this.validateForm.getRawValue();

const mergedSelected = Array.from(
  new Map(
    [...this.listSelected, ...newSelectedNodes]
      .filter(item => item.type !== 'Unit')
      .map(item => [item.key, item])
  ).values()
);
    

if (this.isEditWorkflow) {

  const organizeCtrl = this.validateForm.get('organizeInCodes');
  organizeCtrl?.clearValidators();
  organizeCtrl?.updateValueAndValidity({ emitEvent: false });

  if (this.validateForm.invalid) {
    Object.values(this.validateForm.controls).forEach((control) => {
      control.markAsDirty();
      control.updateValueAndValidity();
    });
    return;
  }

  const payload = {
    ...formData,
    id: this.isEditWorkflow ? formData.id : null,
    moduleTypeName: this.currentModuleType?.name || '',
    workflowOrganizeIns: mergedSelected.map((item) => {
      const org = this.organizations.find((o) => o.code === item.key);
      return {
        organizeInCode: item.key,
        organizeInName: org?.name || item.title || '',
      };
    }),
  };

  delete payload.organizeInCodes;

  this.workflowService.updateWorkflow(payload).subscribe({
    next: () => {
      this.listSelected = mergedSelected;
      newSelectedNodes.forEach((n) => {
        this.setOfCheckedKey.delete(n.key);
      });

      this.refreshCheckedStatus();

      const uncheckNodes = (nodes: any[]) => {
        for (const node of nodes) {
          if (this.defaultCheckedKeys.includes(node.key)) {
            node.checked = false;
          }
          if (node.children?.length) {
            uncheckNodes(node.children);
          }
        }
      };
      uncheckNodes(this.listUnselected);

      this.listUnselected = this.disableCheckboxSelected(this.listUnselected);
      this.syncUnitStatus(this.listUnselected);
      this.defaultCheckedKeys = this.listSelected.map((x) => x.key);
      this.defaultCheckedKeys = this.defaultCheckedKeys.concat(this.arrayUnit);
      this.arrayUnit = [];
      this.workflowService.updateListDataByType(this.currentModuleType.code);
      // this.message.success('Cập nhật đơn vị thành công');
    },
    error: (err) => {
      this.message.error('Cập nhật workflow thất bại');
      console.error(err);
    },
  });
}
else{
  this.listSelected = mergedSelected;
        newSelectedNodes.forEach((n) => {
          this.setOfCheckedKey.delete(n.key);
        });

        this.refreshCheckedStatus();

        const uncheckNodes = (nodes: any[]) => {
          for (const node of nodes) {
            if (this.defaultCheckedKeys.includes(node.key)) {
              node.checked = false;
            }
            if (node.children?.length) {
              uncheckNodes(node.children);
            }
          }
        };
        uncheckNodes(this.listUnselected);
        this.listUnselected = this.disableCheckboxSelected(this.listUnselected);
        this.syncUnitStatus(this.listUnselected);
        this.defaultCheckedKeys = this.listSelected.map((x) => x.key);
        this.validateForm.get('organizeInCodes')?.setValue(this.defaultCheckedKeys);
        this.defaultCheckedKeys = this.defaultCheckedKeys.concat(this.arrayUnit);
        this.arrayUnit = [];
}

  }

  disableCheckboxSelected(nodes: any[]): any[] {
    const selectedKeys = new Set(this.listSelected.map((x) => x.key));
    return nodes.map((node) => {
      const newNode = {
        ...node,
        disableCheckbox: selectedKeys.has(node.key),
      };
      if (node.children?.length) {
        newNode.children = this.disableCheckboxSelected(node.children);
      }
      return newNode;
    });
  }

  onItemChecked(key: string, checked: boolean): void {
    this.updateCheckedSet(key, checked);
    this.refreshCheckedStatus();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedKey.add(id);
    } else {
      this.setOfCheckedKey.delete(id);
    }
  }

  refreshCheckedStatus(): void {
    this.isCheckedAll = this.listSelected.every((item) =>
      this.setOfCheckedKey.has(item.key)
    );
    this.indeterminate =
      this.listSelected.some((item) => this.setOfCheckedKey.has(item.key)) &&
      !this.isCheckedAll;
  }
  onAllChecked(value: boolean): void {
    this.listSelected.forEach((item) => this.updateCheckedSet(item.key, value));
    this.refreshCheckedStatus();
  }

  resetSearchSelected(): void {
    this.searchValueSelected = '';
    this.listSelected = structuredClone(this.listSelectedOrigin);
  }

  searchSelected(): void {
    const search = this.searchValueSelected?.trim().toLowerCase() || '';
    this.listSelected = this.listSelectedOrigin.filter(
      (x) =>
        x.key.toLowerCase().includes(search) ||
        x.title.toLowerCase().includes(search)
    );
  }

  moveToUnselected(): void {
    const removedKeys = Array.from(this.setOfCheckedKey);

    if (removedKeys.length === 0) {
      this.message.warning('Không có đơn vị nào được chọn để thay đổi!');
      return;
    }

    const remainingSelected = this.listSelected.filter(
      (item) => !this.setOfCheckedKey.has(item.key) && item.type !== 'Unit'
    );

    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formData = this.validateForm.getRawValue();

    const payload = {
      ...formData,
      id: this.isEditWorkflow ? formData.id : null,
      moduleTypeName: this.currentModuleType?.name || '',
      workflowOrganizeIns: remainingSelected.map((item) => {
        const org = this.organizations.find((o) => o.code === item.key);
        return {
          organizeInCode: item.key,
          organizeInName: org?.name || item.title || '',
        };
      }),
    };

    delete payload.organizeInCodes;

    this.workflowService.updateWorkflow(payload).subscribe({
      next: () => {
        this.listSelected = remainingSelected;

        this.setOfCheckedKey.clear();

        this.refreshCheckedStatus();
        this.syncCheckedNodes(this.listUnselected);

        this.listUnselected = this.disableCheckboxSelected(this.listUnselected);

        this.defaultCheckedKeys = this.listSelected.map((item) => item.key);
        this.workflowService.updateListDataByType(this.currentModuleType.code);
        this.arrayUnit = [];
        // this.message.success('Cập nhật đơn vị thành công');
      },
      error: (error) => {
        this.message.error('Cập nhật workflow thất bại');
        console.error(error);
      },
    });
  }

  syncCheckedNodes(nodes: any[]) {
    for (const node of nodes) {
      node.checked = this.setOfCheckedKey.has(node.key);

      if (node.children && node.children.length > 0) {
        this.syncCheckedNodes(node.children);
      }
    }
  }

  buildNzTree(flat: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    flat.forEach((item) => {
      map.set(item.id, {
        key: item.id,
        title: item.name,
        type: item.type,
        children: [],
        isLeaf: true,
      });
    });

    flat.forEach((item) => {
      const node = map.get(item.id);
      if (!item.pId) {
        roots.push(node);
      } else {
        const parent = map.get(item.pId);
        if (parent) {
          parent.children.push(node);
          parent.isLeaf = false;
        }
      }
    });

    return roots;
  }

  collectAllExpandableKeys(nodes: any[]): string[] {
    const keys: string[] = [];

    const dfs = (list: any[]) => {
      for (const n of list) {
        if (n.children && n.children.length > 0) {
          keys.push(n.key);
          dfs(n.children);
        }
      }
    };

    dfs(nodes);
    return keys;
  }

filterNodeOrg() {
  const searchText = this.searchValueNodeOrg?.trim().toLowerCase();

  // ===== Không search =====
  if (!searchText) {
    this.listUnselected = this.disableCheckboxSelected(this.listUnselectedOrigin);
    this.defaultCheckedKeys = [...this.defaultCheckedKeys];
    this.defaultExpandedKeys = this.collectAllExpandableKeys(this.listUnselected);
    return;
  }

  const expandKeySet = new Set<string>();
  const lockedSet = new Set(this.listSelected.map(x => x.key));

const filterRecursive = (nodes: NzTreeNodeOptions[]): NzTreeNodeOptions[] => {
  const result: NzTreeNodeOptions[] = [];

  for (const node of nodes) {
    const title = (node.title || '').toLowerCase();
    const isSelfMatch = title.includes(searchText) || node.key.toLowerCase().includes(searchText);

    let children: NzTreeNodeOptions[] = [];

    if (node.children?.length) {
      children = filterRecursive(node.children);
    }

    if (isSelfMatch || children.length > 0) {
      result.push({ ...node, children });
      expandKeySet.add(node.key);
    }
  }

  return result;
};

  const filteredList = filterRecursive(this.listUnselectedOrigin);

  this.listUnselected = this.disableCheckboxSelected(filteredList);
  this.defaultCheckedKeys = [...this.defaultCheckedKeys]; // giữ tick
  this.defaultExpandedKeys = Array.from(expandKeySet);
}


onCheckOrg(event: NzFormatEmitEvent) {
  const node = event.node;
  if (!node) return;

  const checked = node.isChecked;

  const fixedKeys = this.listSelected.map(x => x.key); // những node luôn giữ
  const checkedSet = new Set(this.defaultCheckedKeys);

  this.updateCheckedRecursive(node, checked, checkedSet);

  // this.updateParentState(node.key, checkedSet);

  fixedKeys.forEach(k => checkedSet.add(k));

  this.defaultCheckedKeys = Array.from(checkedSet);
}

  updateCheckedRecursive(node: any, checked: boolean, checkedSet: Set<string>) {
    if (checked) {
      checkedSet.add(node.key);
    } else {
      checkedSet.delete(node.key);
    }

    if (node.children?.length) {
      node.children.forEach((child: any) =>
        this.updateCheckedRecursive(child, checked, checkedSet)
      );
    }
  }

  setCheckedRecursive(node: NzTreeNode, checked: boolean) {
    if (checked) {
      this.setOfCheckedKey.add(node.key);
    } else {
      this.setOfCheckedKey.delete(node.key);
    }

    if (node.children && node.children.length) {
      node.children.forEach((child) =>
        this.setCheckedRecursive(child, checked)
      );
    }
  }
}
