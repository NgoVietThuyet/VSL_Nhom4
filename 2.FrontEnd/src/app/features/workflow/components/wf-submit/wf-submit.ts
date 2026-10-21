import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfDefinitionService, WfInstanceService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { WfSubmitRequest } from '../../models';

interface FormField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { value: any; label: string }[];
  placeholder?: string;
  rows?: number;
}

@Component({
  selector: 'app-wf-submit',
  imports: [SharedModules],
  templateUrl: './wf-submit.html'
})
export class WfSubmit implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  processes: any[] = [];
  selectedProcess: any = null;
  fields: FormField[] = [];
  formValue: { [key: string]: any } = {};
  request: WfSubmitRequest = new WfSubmitRequest();
  priorities = [
    { value: 'LOW', label: 'Thấp' },
    { value: 'NORMAL', label: 'Bình thường' },
    { value: 'HIGH', label: 'Cao' },
    { value: 'URGENT', label: 'Khẩn cấp' }
  ];

  constructor(private global: GlobalService, private defService: WfDefinitionService,
    private service: WfInstanceService, public router: Router) {
    this.global.setBreadcrumb([{ name: 'Tạo yêu cầu', path: 'workflow/submit' }]);
  }

  ngOnInit(): void {
    this.defService.getPublished().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.processes = res || []; }
    });
  }

  onSelectProcess(id: string) {
    const p = this.processes.find(x => x.id === id);
    this.selectedProcess = p || null;
    this.request.processDefinitionId = id;
    this.request.title = '';
    this.fields = [];
    this.formValue = {};
    if (p?.formSchema) {
      try {
        const schema = JSON.parse(p.formSchema);
        this.fields = (schema.fields || []) as FormField[];
        this.fields.forEach(f => { this.formValue[f.key] = ''; });
      } catch { }
    }
  }

  buildTitle(): string {
    if (this.request.title?.trim()) return this.request.title.trim();
    let t = this.selectedProcess?.titleTemplate || (this.selectedProcess?.name || '');
    t = t.replace(/\{\{\s*(\w+)\s*\}\}/g, (_: string, k: string) => this.formValue[k] != null ? String(this.formValue[k]) : '');
    return t;
  }

  submit(saveDraft: boolean) {
    if (!this.request.processDefinitionId) return;
    const required = this.fields.filter(f => f.required && (this.formValue[f.key] == null || this.formValue[f.key] === ''));
    if (!saveDraft && required.length > 0) return;
    this.request.title = this.buildTitle();
    this.request.formData = JSON.stringify(this.formValue || {});
    this.request.saveDraft = saveDraft;
    this.service.submit(this.request).pipe(takeUntil(this.destroy$)).subscribe({
      next: (id: any) => {
        if (id) this.router.navigate(['workflow/detail', id]);
        else this.router.navigate(['workflow/my-requests']);
      }
    });
  }

  trackByKey(_: number, item: FormField) { return item.key; }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
