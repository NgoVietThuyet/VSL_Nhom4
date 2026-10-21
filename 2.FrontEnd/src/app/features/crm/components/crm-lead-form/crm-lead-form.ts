import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CrmLeadDto } from '../../models';

@Component({
  selector: 'app-crm-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzGridModule, NzInputModule, NzSelectModule, NzButtonModule, NzSpinModule],
  templateUrl: './crm-lead-form.html',
  styleUrls: ['./crm-lead-form.scss'],
})
export class CrmLeadForm implements OnChanges {
  @Input() lead: CrmLeadDto = new CrmLeadDto();
  @Input() isEdit = false;
  @Input() loading = false;
  @Output() submitLead = new EventEmitter<CrmLeadDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  statusOptions = [
    { value: 'New',         label: 'Mới' },
    { value: 'Contacted',   label: 'Đã liên hệ' },
    { value: 'Qualified',   label: 'Tiềm năng' },
    { value: 'Unqualified', label: 'Không tiềm năng' },
    { value: 'Converted',   label: 'Đã chuyển đổi' },
  ];
  ownerOptions = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'];
  sourceOptions = ['Website', 'Sự kiện', 'Giới thiệu', 'Quảng cáo', 'Khác'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      company: [''],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      sourceCode: [''],
      status: ['New'],
      ownerUser: [''],
      campaignId: [''],
      score: [null],
      note: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead']) {
      this.patchLead();
    }
  }

  private patchLead(): void {
    this.form.patchValue({
      ...this.lead,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = { ...this.form.value } as CrmLeadDto;
    this.submitLead.emit(value);
  }

  cancelForm(): void {
    this.cancel.emit();
  }

  get control() {
    return this.form.controls;
  }
}
