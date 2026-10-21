import { Component, OnInit, ViewChild} from '@angular/core';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { RightService } from '../../services/right.service';
import { TreeUtils } from '../../../../shared/utils/tree.utils';
import { RightDto } from '../../models';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-right',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './right.html',
  styleUrl: './right.scss'
})
export class Right implements OnInit {

  @ViewChild('treeCom', { static: false }) treeCom!: NzTreeComponent
  private destroy$ = new Subject<void>();

  visible: boolean = false;
  isEdit: boolean = false;

  searchRight: string = '';
  rightTree: any[] = [];
  displayedRightTree: any[] = [];

  dto: RightDto = new RightDto();

  constructor(
    private global: GlobalService,
    private service: RightService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Danh sách quyền',
        path: 'system-manager/right',
      },
    ]);
  }

  ngOnInit(): void {
    this.getRights();
  }

  getRights() {
    const filter = new RightDto();
    filter.pageSize = 1000;
    this.service.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.rightTree = this.displayedRightTree = TreeUtils.buildNzRightTree(res.data);
      }
    });
  }

  nzEvent(event: any): void {

  }

  reset() {
    this.searchRight = '';
    this.getRights();
  }

  detail(data: any) {
    this.isEdit = true;
    this.service.detail(data.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.dto = res;
        this.visible = true;
      }
    })
  }

  create(data: any) {
    this.isEdit = false;
    this.dto.pId = data;
    this.visible = true;
  }

  updateOrder() {
    const flatList = this.getCurrentTreeOrderFlat();
    this.service.updateOrder(flatList).subscribe({
      next: (res) => {
        this.globalOrderNumber = 1;
        this.getRights();
      }
    })
  }

  private getCurrentTreeOrderFlat(): any[] {
    const treeNodes = this.treeCom.getTreeNodes();
    const flatList: any[] = [];
    this.flattenNodeWithOrderAndPid(treeNodes, 'RIGHT', flatList);
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
      });

      if (node.children && node.children.length > 0) {
        this.flattenNodeWithOrderAndPid(node.children, node.origin.id, result);
      }
    });
  }

  onSearchChangeRight() {
    if (!this.searchRight?.trim()) {
      this.displayedRightTree = this.rightTree;
    } else {
      this.displayedRightTree = this.filterRightTree(this.rightTree, this.searchRight.toLowerCase());
    }
  }

  filterRightTree(RightTree: any[], keyword: string): any[] {
    const result: any[] = [];

    for (const node of RightTree) {
      const childrenMatched = node.children ? this.filterRightTree(node.children, keyword) : [];

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

  deleteRight(id: any) {
    this.service.delete(id).subscribe({
      next: (res) => {
        this.getRights();
      }
    })
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          var pId = this.dto.pId;
          this.getRights();
          if (!this.isEdit) {
            this.dto = new RightDto();
            this.dto.pId = pId;
          } else {
            this.visible = false;
          }
        }
      })
  }

  close() {
    this.visible = false;
    this.dto = new RightDto();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
    this.rightTree = [];
    this.displayedRightTree = [];
    this.dto = new RightDto();
    this.visible = false;
    this.isEdit = false;
    this.searchRight = '';
    this.treeCom = null as any;
  }
}

