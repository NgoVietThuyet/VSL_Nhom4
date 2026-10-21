import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { GlobalService } from '../../../../core/services/global.service';

import { OrganizeGroupService } from '../../services/organize-group.service';

import { OrganizeService } from '../../services/organize.service';

import { SharedModules } from '../../../../shared/ng-zorro.module';

import { PaginationResult } from '../../../../shared/models';

import { OrganizeGroupDto } from '../../models/organize-group.model';

import { OrganizeDto } from '../../models/organize.model';

import { TreeUtils } from '../../../../shared/utils/tree.utils';

import { NzNotificationService } from 'ng-zorro-antd/notification';



@Component({

  selector: 'app-organize-group',

  imports: [SharedModules],

  templateUrl: './organize-group.html',

  styleUrl: './organize-group.scss'

})

export class OrganizeGroup implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  visible = false;

  isEdit = false;

  data: PaginationResult = new PaginationResult();

  dto: OrganizeGroupDto = new OrganizeGroupDto();

  filter: OrganizeGroupDto = new OrganizeGroupDto();



  searchFilterOrg = '';

  searchOrg = '';

  orgTree: any[] = [];

  displayedFilterOrgTree: any[] = [];

  displayedOrgTree: any[] = [];

  selectedOrgKeys: string[] = [];

  orgNameMap: Record<string, string> = {};



  constructor(

    private global: GlobalService,

    private service: OrganizeGroupService,

    private orgService: OrganizeService,

    private notification: NzNotificationService

  ) {

    this.global.setBreadcrumb([{ name: 'Nhóm đơn vị', path: 'master-data/organize-group' }]);

  }



  ngOnInit(): void {

    this.loadOrgs();

  }



  loadOrgs(): void {

    const filter = new OrganizeDto();

    filter.pageSize = 1000;

    this.orgService.search(filter).pipe(takeUntil(this.destroy$)).subscribe({

      next: (res: any) => {

        const list = res.data || [];

        this.orgNameMap = list.reduce((acc: Record<string, string>, item: any) => {

          acc[item.id] = item.name || item.id;

          return acc;

        }, {});

        this.orgTree = TreeUtils.buildNzOrgTree(list);

        this.displayedFilterOrgTree = [...this.orgTree];

        this.displayedOrgTree = [...this.orgTree];

        this.autoSelectFirstOrgNode();

      }

    });

  }



  search(): void {

    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({

      next: (res: any) => this.data = res

    });

  }



  onKeydownSearch(event: KeyboardEvent): void {

    if (event.isComposing) return;

    if (event.key === 'Enter' && !event.shiftKey) {

      event.preventDefault();

      event.stopPropagation();

      this.search();

    }

  }



  trackById(_index: number, item: any): any { return item.id || item.code; }



  onFilterOrgClick(e: any): void {

    this.visible = false;

    this.filter.orgId = e.keys.length > 0 ? e.keys[0] : '';

    this.selectedOrgKeys = this.filter.orgId ? [this.filter.orgId] : [];

    if (this.filter.orgId) {

      this.search();

    } else {

      this.data = new PaginationResult();

    }

  }



  onFilterOrgSearch(): void {

    this.displayedFilterOrgTree = this.filterOrgTree(this.orgTree, this.searchFilterOrg.trim().toLowerCase());

  }



  open(data: any, isEdit: boolean): void {

    this.isEdit = isEdit;

    if (isEdit) {

      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({

        next: (res: any) => {

          this.dto = res;

          this.dto.orgName = res.orgName || this.orgNameMap[res.orgId] || res.orgId;

          this.applyOrgChecks();

          this.visible = true;

        }

      });

    } else {

      this.visible = true;

      this.dto = new OrganizeGroupDto();

      this.dto.orgId = this.filter.orgId;

      this.dto.orgName = this.orgNameMap[this.filter.orgId] || this.filter.orgId;

      this.clearOrgChecks(this.orgTree);

      this.displayedOrgTree = [...this.orgTree];

    }

  }



  close(): void {

    this.visible = false;

    this.dto = new OrganizeGroupDto();

  }



  save(): void {

    if (!this.dto.code?.trim()) {

      this.notification.error('Lỗi','Vui lòng nhập mã nhóm đơn vị');

      return;

    }

    if (!this.dto.name?.trim()) {

      this.notification.error('Lỗi','Vui lòng nhập tên nhóm đơn vị');

      return;

    }

    if (!this.dto.orgId?.trim()) {

      this.notification.error('Lỗi','Vui lòng chọn đơn vị quản lý');

      return;

    }



    const orgIds = this.collectCheckedOrgIds(this.orgTree);

    this.dto.organizeGroupOrgs = orgIds.map(orgId => ({

      id: '',

      groupCode: this.dto.code,

      orgId,

      orgName: ''

    }));



    const action = this.isEdit ? 'update' : 'insert';

    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({

      next: () => {

        this.search();

        this.dto = new OrganizeGroupDto();

        this.visible = false;

      }

    });

  }



  reset(): void {

    this.filter = new OrganizeGroupDto();

    this.filter.orgId = this.selectedOrgKeys[0] || '';

    this.search();

  }



  pageIndexChange(e: number): void {

    this.filter.currentPage = e;

    this.search();

  }



  pageSizeChange(e: number): void {

    this.filter.pageSize = e;

    this.search();

  }



  onOrgSearch(): void {

    this.displayedOrgTree = this.filterOrgTree(this.orgTree, this.searchOrg.trim().toLowerCase());

  }



  getOwnerOrgName(item: any): string {

    return item?.orgName || this.orgNameMap[item?.orgId] || item?.orgId || '---';

  }



  private autoSelectFirstOrgNode(): void {

    if (this.filter.orgId || !this.orgTree?.length) return;



    const firstNode = this.orgTree[0];

    const firstNodeKey = firstNode?.key ?? firstNode?.id;

    if (!firstNodeKey) return;



    this.selectedOrgKeys = [firstNodeKey];

    this.onFilterOrgClick({ keys: [firstNodeKey] });

  }



  private filterOrgTree(nodes: any[], keyword: string): any[] {

    if (!keyword) return [...nodes];



    return nodes

      .map(node => {

        const children = node.children ? this.filterOrgTree(node.children, keyword) : [];

        const matched = `${node.title || ''} ${node.key || ''}`.toLowerCase().includes(keyword);

        if (matched || children.length > 0) {

          return { ...node, children: children.length > 0 ? children : node.children };

        }

        return null;

      })

      .filter(Boolean);

  }



  private applyOrgChecks(): void {

    const orgIds = (this.dto.organizeGroupOrgs || []).map(x => x.orgId).filter(Boolean);

    this.setCheckedOrgs(this.orgTree, orgIds);

    this.displayedOrgTree = [...this.orgTree];

  }



  private setCheckedOrgs(nodes: any[], orgIds: string[]): void {

    const ids = new Set(orgIds);

    nodes.forEach(node => {

      node.checked = ids.has(node.key);

      if (node.children?.length) this.setCheckedOrgs(node.children, orgIds);

    });

  }



  private clearOrgChecks(nodes: any[]): void {

    nodes.forEach(node => {

      node.checked = false;

      if (node.children?.length) this.clearOrgChecks(node.children);

    });

  }



  private collectCheckedOrgIds(nodes: any[]): string[] {

    const result: string[] = [];

    const walk = (items: any[]) => {

      items.forEach(node => {

        if (node.checked) result.push(node.key);

        if (node.children?.length) walk(node.children);

      });

    };

    walk(nodes);

    return result;

  }



  ngOnDestroy(): void {

    this.global.setBreadcrumb([]);

    this.destroy$.next();

    this.destroy$.complete();

  }

}


