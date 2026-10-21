import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmCampaignDto } from '../../models';

@Component({
  selector: 'app-crm-campaign-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-campaign-form.html',
  styleUrls: ['./crm-campaign-form.scss'],
})
export class CrmCampaignForm implements OnChanges {
  @Input() campaign: CrmCampaignDto = new CrmCampaignDto();
  @Input() isEdit = false;
  @Output() submitCampaign = new EventEmitter<CrmCampaignDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  statusOptions = ['Draft', 'Active', 'Completed', 'Cancelled'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id: [''],
      code: [''], 
      name: ['', [Validators.required]],
      status: ['Draft'],
      startDate: [null],
      endDate: [null],
      budget: [null],
      ownerUser: [''],
      description: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaign']) {
      this.patchCampaign();
    }
  }

  private patchCampaign(): void {
    this.form.patchValue({
      ...this.campaign,
      startDate: this.campaign?.startDate ? new Date(this.campaign.startDate) : null,
      endDate: this.campaign?.endDate ? new Date(this.campaign.endDate) : null,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...this.form.value } as CrmCampaignDto;
    if (!value.id) value.id = crypto.randomUUID();
    value.startDate = value.startDate
      ? (value.startDate as any) instanceof Date ? (value.startDate as any).toISOString() : value.startDate
      : '';
    value.endDate = value.endDate
      ? (value.endDate as any) instanceof Date ? (value.endDate as any).toISOString() : value.endDate
      : '';
    this.submitCampaign.emit(value);
  }

  get control() { return this.form.controls; }

  readonly formatNumber = (v: number): string =>
    v == null ? '' : v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  readonly parseNumber = (v: string): number =>
    Number(v.replace(/\./g, '')) || 0;
}
