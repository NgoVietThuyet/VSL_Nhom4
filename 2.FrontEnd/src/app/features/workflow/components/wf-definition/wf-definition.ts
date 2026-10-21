import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfCategoryService, WfDefinitionService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { WfProcessDefinitionDto, WfProcessDesignDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

import { WfDesigner } from '../wf-designer/wf-designer';

@Component({
  selector: 'app-wf-definition',
  imports: [SharedModules, WfDesigner],
  templateUrl: './wf-definition.html'
})
export class WfDefinition implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(WfDesigner) designer?: WfDesigner;
  visible = false;
  cloneVisible = false;
  isEdit = false;
  activeTab = 0;
  listTab = 0;
  data: PaginationResult = new PaginationResult();
  dto: WfProcessDefinitionDto = new WfProcessDefinitionDto();
  filter: WfProcessDefinitionDto = new WfProcessDefinitionDto();
  categories: any[] = [];
  cloneInfo = { id: '', newCode: '', newName: '' };

  constructor(
    private global: GlobalService,
    private service: WfDefinitionService,
    private categoryService: WfCategoryService,
    private router: Router,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Định nghĩa quy trình', path: 'workflow/definition' }]);
  }

  ngOnInit(): void { 
    this.filter.isPublished = false;
    this.loadCategories(); 
    this.search(); 
  }

  loadCategories() {
    this.categoryService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.categories = res || []; }
    });
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res; }
    });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    this.activeTab = 0;
    if (isEdit) {
      this.service.detail(data.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new WfProcessDefinitionDto();
    }
  }

  close() { this.visible = false; this.dto = new WfProcessDefinitionDto(); }

  save() {
    if (!this.dto.code || !this.dto.name) {
      this.message.error('Vui lòng nhập đầy đủ Mã và Tên quy trình');
      return;
    }

    const design = this.designer?.design || new WfProcessDesignDto();
    design.definition = { ...this.dto };

    this.service.saveDesign(design).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const isNew = !this.isEdit;
        this.search();
        if (isNew) {
          if (this.designer) {
            this.designer.skipNextLoad = true;
            this.designer.design.definition.id = res;
          }
          this.dto.id = res;
          this.isEdit = true;
          this.activeTab = 0;
        }
      }
    });
  }

  publish(item: any) {
    this.service.publish(item.id, !item.isPublished).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.search()
    });
  }

  openClone(item: any) {
    this.cloneInfo = { id: item.id, newCode: item.code + '_COPY', newName: item.name + ' (Copy)' };
    this.cloneVisible = true;
  }

  doClone() {
    this.service.clone(this.cloneInfo.id, { newCode: this.cloneInfo.newCode, newName: this.cloneInfo.newName })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.cloneVisible = false; this.search(); }
      });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  openDesigner(item: any) { this.router.navigate(['workflow/designer', item.id]); }

  reset() { 
    this.filter = new WfProcessDefinitionDto(); 
    this.filter.isPublished = this.listTab === 1; 
    this.search(); 
  }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  tabChange(index: number) {
    this.listTab = index;
    this.filter.isPublished = index === 1;
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
