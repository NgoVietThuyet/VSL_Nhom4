import { Component, OnInit, ViewChild } from '@angular/core';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { Subject, takeUntil } from 'rxjs';
import { OrganizeDto } from '../../models/organize.model';
import { GlobalService } from '../../../../core/services/global.service';
import { TreeUtils } from '../../../../shared/utils/tree.utils';
import { OrganizeService } from '../../services/organize.service';
import { TitleService } from '../../services/title.service';
import { TitleDto } from '../../models/title.model';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FileService } from '../../../../shared/services/file.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-organize',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './organize.html',
  styleUrl: './organize.scss'
})
export class Organize implements OnInit {

  @ViewChild('treeCom', { static: false }) treeCom!: NzTreeComponent
  private destroy$ = new Subject<void>();

  visible: boolean = false;
  isEdit: boolean = false;
  isVisible = false

  searchOrg: string = '';
  OrgTree: any[] = [];
  displayedOrgTree: any[] = [];

  dto: OrganizeDto = new OrganizeDto();
  lstTitle: TitleDto[] = [];
  leaderTitleArr: string[] = [];

  constructor(
    private global: GlobalService,
    private service: OrganizeService,
    private titleService: TitleService,
    private fileS: FileService,
    private modal: NzModalService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Cấu trúc tổ chức',
        path: 'system-manager/organize',
      },
    ]);
  }

  ngOnInit(): void {
    this.getOrgs();
    this.loadTitles();
  }

  loadTitles(): void {
    const filter = new TitleDto();
    filter.pageSize = 1000;
    this.titleService.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.lstTitle = res?.data ?? res ?? []; }
    });
  }

  getOrgs() {
    const filter = new OrganizeDto();
    filter.pageSize = 1000;
    this.service.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.OrgTree = this.displayedOrgTree = TreeUtils.buildNzOrgTree(res.data);
      }
    });
  }

  nzEvent(event: any): void {

  }

  reset() {
    this.searchOrg = '';
    this.getOrgs();
  }

  detail(data: any) {
    this.isEdit = true;
    this.service.detail(data.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.dto = res;
        this.leaderTitleArr = (res.leaderTitleCodes || '')
          .split(',').map((s: string) => s.trim()).filter(Boolean);
        this.visible = true;
      }
    })
  }

  create(data: any) {
    this.isEdit = false;
    this.dto = new OrganizeDto();
    this.dto.pId = data;
    this.leaderTitleArr = [];
    this.visible = true;
  }

  updateOrder() {
    const flatList = this.getCurrentTreeOrderFlat();
    this.service.updateOrder(flatList).subscribe({
      next: (res) => {
        this.globalOrderNumber = 1;
        this.getOrgs()
      }
    })
  }

  private getCurrentTreeOrderFlat(): any[] {
    const treeNodes = this.treeCom.getTreeNodes();
    const flatList: any[] = [];
    this.flattenNodeWithOrderAndPid(treeNodes, 'ORG', flatList);
    return flatList;
  }

  private globalOrderNumber = 1;

  private flattenNodeWithOrderAndPid(nodes: any[], parentId: string, result: any[]): void {
    nodes.forEach((node) => {
      result.push({
        id: node.origin.id,
        pId: parentId,
        name: node.origin.name,
        orderNumber: this.globalOrderNumber++,
        expanded: node.origin.expanded,
        isAffiliated: node.origin.isAffiliated,
        isIssuedBy: node.origin.isIssuedBy,
      });

      if (node.children && node.children.length > 0) {
        this.flattenNodeWithOrderAndPid(node.children, node.origin.id, result);
      }
    });
  }

  onSearchChangeOrg() {
    if (!this.searchOrg?.trim()) {
      this.displayedOrgTree = this.OrgTree;
    } else {
      this.displayedOrgTree = this.filterOrgTree(this.OrgTree, this.searchOrg.toLowerCase());
    }
  }

  filterOrgTree(OrgTree: any[], keyword: string): any[] {
    const result: any[] = [];

    for (const node of OrgTree) {
      const childrenMatched = node.children ? this.filterOrgTree(node.children, keyword) : [];

      const nameMatched = node.name.toLowerCase().includes(keyword);

      if (nameMatched || childrenMatched.length > 0) {
        result.push({
          ...node,
          children: childrenMatched.length > 0 ? childrenMatched : node.children ? [] : null,
          open: childrenMatched.length > 0 || node.open
        });
      }
    }

    return result;
  }

  deleteOrg(id: any) {
    this.service.delete(id).subscribe({
      next: (res) => {
        this.getOrgs();
      }
    })
  }

  save() {
    this.dto.leaderTitleCodes = this.leaderTitleArr.join(',');
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          var pId = this.dto.pId;
          this.getOrgs();
          if (!this.isEdit) {
            this.dto = new OrganizeDto();
            this.dto.pId = pId;
            this.leaderTitleArr = [];
          } else {
            this.visible = false;
          }
        }
      })
  }

  close() {
    this.visible = false;
    this.dto = new OrganizeDto();
    this.leaderTitleArr = [];
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
    this.OrgTree = [];
    this.displayedOrgTree = [];
    this.dto = new OrganizeDto();
    this.visible = false;
    this.isEdit = false;
    this.searchOrg = '';
    this.treeCom = null as any;
  }
}

