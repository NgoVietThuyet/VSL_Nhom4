import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfDefinitionService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { WfProcessDesignDto, WfProcessStepDto, WfProcessTransitionDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-wf-designer',
  imports: [SharedModules],
  templateUrl: './wf-designer.html'
})
export class WfDesigner implements OnInit, OnChanges, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() id = '';
  @Input() embedMode = false;
  design: WfProcessDesignDto = new WfProcessDesignDto();
  skipNextLoad = false;
  stepDrawer = false;
  stepIsEdit = false;
  stepDto: WfProcessStepDto = new WfProcessStepDto();
  stepIndex = -1;
  transDrawer = false;
  transIsEdit = false;
  transDto: WfProcessTransitionDto = new WfProcessTransitionDto();
  transIndex = -1;
  activeTab = 0;

  stepTypes = [
    { value: 'START', label: 'Bắt đầu' },
    { value: 'APPROVAL', label: 'Phê duyệt' },
    { value: 'PARALLEL', label: 'Song song' },
    { value: 'CONDITION', label: 'Điều kiện' },
    { value: 'END', label: 'Kết thúc' }
  ];
  modes = [
    { value: 'SEQUENTIAL', label: 'Tuần tự' },
    { value: 'PARALLEL_ALL', label: 'Song song – tất cả duyệt' },
    { value: 'PARALLEL_ANY', label: 'Song song – một duyệt' }
  ];
  assigneeTypes = [
    { value: 'USER', label: 'Tài khoản (UserName, cách nhau dấu , )' },
    { value: 'GROUP', label: 'Nhóm tài khoản (Id, cách nhau dấu , )' },
    { value: 'INITIATOR', label: 'Người tạo yêu cầu' },
    { value: 'EXPRESSION', label: 'Biểu thức (key trong FormData)' }
  ];

  constructor(
    private global: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private service: WfDefinitionService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([
      { name: 'Định nghĩa quy trình', path: 'workflow/definition' },
      { name: 'Thiết kế', path: '' }
    ]);
  }

  ngOnInit(): void {
    if (!this.id) {
      this.id = this.route.snapshot.paramMap.get('id') || '';
    }
    if (this.id) this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id'] && this.id && !changes['id'].firstChange) {
      if (this.skipNextLoad) {
        this.skipNextLoad = false;
        return;
      }
      this.load();
    }
  }

  load() {
    this.service.design(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.design = res || new WfProcessDesignDto();
        this.design.steps = this.design.steps || [];
        this.design.transitions = this.design.transitions || [];
      }
    });
  }

  trackByStepCode(_: number, item: any) { return item.stepCode; }
  trackByTransId(_: number, item: any) { return item.id || (item.fromStepCode + '-' + item.toStepCode); }

  addStep() {
    this.stepIsEdit = false;
    this.stepIndex = -1;
    this.stepDto = new WfProcessStepDto();
    this.stepDto.orderNumber = (this.design.steps?.length || 0) + 1;
    this.stepDrawer = true;
  }

  editStep(item: WfProcessStepDto, idx: number) {
    this.stepIsEdit = true;
    this.stepIndex = idx;
    this.stepDto = JSON.parse(JSON.stringify(item));
    this.stepDrawer = true;
  }

  saveStep() {
    if (!this.stepDto.stepCode || !this.stepDto.name) {
      this.message.error('Vui lòng nhập đầy đủ Mã và Tên bước');
      return;
    }
    if (this.stepIsEdit && this.stepIndex >= 0) {
      this.design.steps[this.stepIndex] = { ...this.stepDto };
      this.design.steps = [...this.design.steps];
    } else {
      this.design.steps = [...this.design.steps, { ...this.stepDto }];
    }
    this.stepDrawer = false;
  }

  removeStep(idx: number) {
    const code = this.design.steps[idx].stepCode;
    this.design.steps = this.design.steps.filter((_, i) => i !== idx);
    this.design.transitions = this.design.transitions.filter(t => t.fromStepCode !== code && t.toStepCode !== code);
  }

  moveStep(idx: number, dir: number) {
    const j = idx + dir;
    if (j < 0 || j >= this.design.steps.length) return;
    const steps = [...this.design.steps];
    const tmp = steps[idx];
    steps[idx] = steps[j];
    steps[j] = tmp;
    steps.forEach((s, i) => s.orderNumber = i + 1);
    this.design.steps = steps;
  }

  addTrans() {
    this.transIsEdit = false;
    this.transIndex = -1;
    this.transDto = new WfProcessTransitionDto();
    this.transDto.orderNumber = (this.design.transitions?.length || 0) + 1;
    this.transDrawer = true;
  }

  editTrans(item: WfProcessTransitionDto, idx: number) {
    this.transIsEdit = true;
    this.transIndex = idx;
    this.transDto = JSON.parse(JSON.stringify(item));
    this.transDrawer = true;
  }

  saveTrans() {
    if (!this.transDto.fromStepCode || !this.transDto.toStepCode) {
      this.message.error('Vui lòng chọn bước đi và bước đến');
      return;
    }
    if (this.transIsEdit && this.transIndex >= 0) {
      this.design.transitions[this.transIndex] = { ...this.transDto };
      this.design.transitions = [...this.design.transitions];
    } else {
      this.design.transitions = [...this.design.transitions, { ...this.transDto }];
    }
    this.transDrawer = false;
  }

  removeTrans(idx: number) { this.design.transitions = this.design.transitions.filter((_, i) => i !== idx); }

  save() {
    this.service.saveDesign(this.design).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Lưu thiết kế thành công');
        this.load();
      }
    });
  }

  publish() {
    this.service.publish(this.id, !this.design.definition.isPublished).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.load()
    });
  }

  back() { this.router.navigate(['workflow/definition']); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}