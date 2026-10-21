import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmCustomerDto, CrmCustomerGroupDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { AccountService } from '../../../system-manager/services/account.service';
import { AccountDto } from '../../../system-manager/models';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-crm-customer-form',
  standalone: true,
  imports: [CommonModule, SharedModules],
  templateUrl: './crm-customer-form.html',
  styleUrls: ['./crm-customer-form.scss'],
})
export class CrmCustomerForm implements OnChanges, OnInit {
  @Input() customer: CrmCustomerDto = new CrmCustomerDto();
  @Input() isEdit = false;
  @Output() submitCustomer = new EventEmitter<CrmCustomerDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  customerTypeOptions: string[] = [];
  statusOptions: string[] = [];
  ownerOptions: AccountDto[] = [];
  groupOptions: CrmCustomerGroupDto[] = [];
  industryOptions: string[] = [];
  leadSourceOptions: string[] = [];

  constructor(private fb: FormBuilder, private crmService: CrmService, private accountService: AccountService) {
    this.form = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      shortName: [''],
      customerType: [''],
      taxCode: [''],
      industry: [''],
      website: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required]],
      address: [''],
      groupId: [''],
      ownerUser: [''],
      status: ['Active'],
      leadSource: [''],
      totalRevenue: [null],
      lastActivityDate: [null],
      note: [''],
    });
  }

  ngOnInit(): void {
    this.crmService.listCustomerTypes().subscribe(v => this.customerTypeOptions = v);
    this.crmService.listCustomerStatuses().subscribe(v => this.statusOptions = v);
    this.crmService.listCustomerGroups().subscribe(v => this.groupOptions = v);
    this.crmService.listIndustries().subscribe(v => this.industryOptions = v);
    this.crmService.listLeadSources().subscribe(v => this.leadSourceOptions = v);
    this.accountService.listUsers().subscribe(v => this.ownerOptions = v);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customer']) {
      this.patchCustomer();
    }
  }

  private patchCustomer(): void {
    const lastActivityDate =
      this.customer?.lastActivityDate && this.customer.lastActivityDate !== ''
        ? new Date(this.customer.lastActivityDate)
        : null;

    this.form.patchValue({
      ...this.customer,
      lastActivityDate,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = { ...this.form.value } as CrmCustomerDto;
    value.lastActivityDate = value.lastActivityDate
      ? (value.lastActivityDate as any) instanceof Date
        ? (value.lastActivityDate as any).toISOString()
        : value.lastActivityDate
      : '';

    this.submitCustomer.emit(value);
  }

  cancelForm(): void {
    this.cancel.emit();
  }

  get control() {
    return this.form.controls;
  }
}
