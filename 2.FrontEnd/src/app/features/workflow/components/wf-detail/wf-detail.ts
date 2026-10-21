import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfInstanceService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { WfActionRequest, WfInstanceDetailDto } from '../../models';

interface FormField {
  key: string; label: string; type: string; required?: boolean;
  options?: { value: any; label: string }[]; placeholder?: string; rows?: number;
}

@Component({
  selector: 'app-wf-detail',
  imports: [SharedModules],
  templateUrl: './wf-detail.html'
})
export class WfDetail implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  id = '';
  data: WfInstanceDetailDto = new WfInstanceDetailDto();
  fields: FormField[] = [];
  formValue: { [key: string]: any } = {};
  actionVisible = false;
  actionType: 'APPROVE' | 'RETURN' | 'REJECT' | 'CANCEL' | 'DELEGATE' | 'RESUBMIT' = 'APPROVE';
  action: WfActionRequest = new WfActionRequest();

  constructor(private global: GlobalService, private route: ActivatedRoute,
    public router: Router, private service: WfInstanceService) {
    this.global.setBreadcrumb([{ name: 'Chi tiết yêu cầu', path: '' }]);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (this.id) this.load();
  }

  load() {
    this.service.detail(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res || new WfInstanceDetailDto();
        try {
          if (this.data.definition?.formSchema) {
            const schema = JSON.parse(this.data.definition.formSchema);
            this.fields = (schema.fields || []) as FormField[];
          } else this.fields = [];
        } catch { this.fields = []; }
        try {
          this.formValue = this.data.instance?.formData ? JSON.parse(this.data.instance.formData) : {};
        } catch { this.formValue = {}; }
      }
    });
  }

  hasAction(a: string) { return this.data.availableActions?.includes(a); }

  openAction(type: 'APPROVE' | 'RETURN' | 'REJECT' | 'CANCEL' | 'DELEGATE' | 'RESUBMIT') {
    this.actionType = type;
    this.action = new WfActionRequest();
    this.actionVisible = true;
  }

  doAction() {
    let obs;
    switch (this.actionType) {
      case 'APPROVE': obs = this.service.approve(this.id, this.action); break;
      case 'REJECT': obs = this.service.reject(this.id, this.action); break;
      case 'RETURN': obs = this.service.return(this.id, this.action); break;
      case 'CANCEL': obs = this.service.cancel(this.id, this.action); break;
      case 'DELEGATE': obs = this.service.delegate(this.id, this.action); break;
      case 'RESUBMIT': obs = this.service.resubmit(this.id, this.action); break;
    }
    obs?.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.actionVisible = false; this.load(); }
    });
  }

  trackByStepCode(_: number, item: any) { return item.stepCode || item.id; }
  trackByHistoryId(_: number, item: any) { return item.id; }
  trackByKey(_: number, item: FormField) { return item.key; }

  statusColor(s: string) {
    switch (s) {
      case 'RUNNING': return 'processing';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'RETURNED': return 'warning';
      case 'CANCELLED': return 'default';
      case 'DRAFT': return 'default';
      case 'PENDING': return 'processing';
      default: return 'default';
    }
  }

  timelineColor(s: string) {
    switch (s) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'RETURNED': return 'orange';
      case 'CANCELLED': return 'gray';
      case 'RUNNING': return 'blue';
      default: return 'gray';
    }
  }

  actionTitle() {
    switch (this.actionType) {
      case 'APPROVE': return 'PHÊ DUYỆT';
      case 'REJECT': return 'TỪ CHỐI';
      case 'RETURN': return 'TRẢ LẠI';
      case 'CANCEL': return 'HỦY YÊU CẦU';
      case 'DELEGATE': return 'ỦY QUYỀN';
      case 'RESUBMIT': return 'GỬI LẠI';
    }
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
