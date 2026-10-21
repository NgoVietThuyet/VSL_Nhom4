import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GlobalService } from '../../../../core/services/global.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MENU_PARENT_ROOT } from '../../../../shared/utils/const';
import { MenuService } from '../../services/menu.service';
import { Subject, takeUntil } from 'rxjs';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { RightService } from '../../services/right.service';
import { TreeUtils } from '../../../../shared/utils/tree.utils';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { MenuDto, MenuRightDto, RightDto } from '../../models';

@Component({
  selector: 'app-menu',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu implements OnInit, OnDestroy {
  @ViewChild('treeComMenu') treeComMenu!: NzTreeComponent;
  @ViewChild('treeComRight') treeComRight!: NzTreeComponent;

  private destroy$ = new Subject<void>();

  visible = false;
  isEdit = false;

  searchMenu = '';
  menuTree: any[] = [];
  displayedMenuTree: any[] = [];

  searchRight = '';
  menuRight: any[] = [];
  displayedRightTree: any[] = [];

  dto = new MenuDto();

  constructor(
    private global: GlobalService,
    private service: MenuService,
    private right: RightService,
    private message: NzMessageService,
  ) {
    this.global.setBreadcrumb([{ name: 'Cấu hình menu', path: 'system-manager/menu' }]);
  }

  ngOnInit() {
    this.loadMenus();
  }

  private loadMenus() {
    const filter = new MenuDto();
    filter.pageSize = 1000;
    this.service.search(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => this.displayedMenuTree = this.menuTree = TreeUtils.buildNzMenuTree(res.data));
  }

  private loadRights(withCheck = false) {
    const filter = new RightDto();
    filter.pageSize = 1000;
    this.right.search(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.menuRight = TreeUtils.buildNzRightTree(res.data);
        if (withCheck) this.setCheckedRights(this.menuRight, this.dto.menuRights ?? []);
        this.displayedRightTree = [...this.menuRight];
      });
  }

  reset() {
    this.searchMenu = '';
    this.loadMenus();
  }

  detail(menu: any) {
    this.isEdit = true;
    this.service.detail(menu.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.dto = res;
        this.loadRights(true);
        this.visible = true;
      });
  }

  create(pId: string) {
    this.dto = new MenuDto();
    this.dto.pId = pId;
    this.isEdit = false;
    this.loadRights();
    this.visible = true;
  }

  private setCheckedRights(nodes: any[], rights: MenuRightDto[]) {
    const rightIds = new Set(rights.map(r => r.rightId));
    nodes.forEach(node => {
      node.checked = rightIds.has(node.id);
      node.children?.length && this.setCheckedRights(node.children, rights);
    });
  }

  updateOrder() {
    if (this.searchMenu.trim()) {
      this.message.warning('Hãy xóa ô tìm kiếm và bấm Đồng bộ trước khi cập nhật thứ tự — nếu không chỉ một phần menu được lưu.');
      return;
    }

    const flatList: any[] = [];
    const seenIds = new Set<string>();
    const flatten = (nodes: any[], parentId: string | null) => {
      let order = 1;
      nodes.forEach((n) => {
        const id = String(n.origin?.id ?? '');
        if (!id || seenIds.has(id)) return;
        seenIds.add(id);
        const pid = parentId ?? n.origin.pId ?? MENU_PARENT_ROOT;
        flatList.push({
          id,
          pId: pid,
          name: n.origin.name,
          url: n.origin.url ?? '',
          icon: n.origin.icon ?? '',
          orderNumber: order++,
          expanded: n.origin.expanded,
        });
        if (n.children?.length) {
          flatten(n.children, id);
        }
      });
    };

    flatten(this.treeComMenu.getTreeNodes(), null);

    if (!flatList.length) {
      this.message.warning('Không có menu để cập nhật thứ tự.');
      return;
    }

    this.service.updateOrder(flatList).subscribe({
      next: () => {
        this.loadMenus();
        this.global.menuTreeRefresh$.next();
        this.message.success('Đã cập nhật thứ tự menu. Sidebar sẽ hiển thị theo thứ tự mới.');
      },
    });
  }


  onSearchChangeMenu() {
    const keyword = this.searchMenu.trim().toLowerCase();
    const filterTree = (nodes: any[]): any[] =>
      nodes
        .map(n => {
          const children = filterTree(n.children ?? []);
          return n.name.toLowerCase().includes(keyword) || children.length
            ? { ...n, children, open: !!children.length || n.open }
            : null;
        })
        .filter(Boolean) as any[];
    this.displayedMenuTree = keyword ? filterTree(this.menuTree) : this.menuTree;
  }

  deleteMenu(id: string) {
    this.service.delete(id).subscribe(() => this.loadMenus());
  }

  private getCheckedRights(): MenuRightDto[] {
    if (!this.treeComRight) return [];
    const checked: any[] = [];
    const collect = (node: any) => {
      if (node.isChecked) checked.push(node.origin);
      node.children?.forEach(collect);
    };
    this.treeComRight.getTreeNodes().forEach(collect);
    return checked.map(o => ({ id: '', menuId: this.dto.id, rightId: o.id }));
  }

  save() {
    this.dto.menuRights = this.getCheckedRights();
    const action$ = this.isEdit ? this.service.update(this.dto) : this.service.insert(this.dto);
    action$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const pId = this.dto.pId;
      this.loadMenus();
      if (!this.isEdit) this.dto = { ...new MenuDto(), pId }
      else this.visible = false;
    });
  }

  close() {
    this.visible = false;
    this.dto = new MenuDto();
    this.searchRight = '';
    this.menuRight = [];
    this.displayedRightTree = [];
  }

  ngOnDestroy() {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
