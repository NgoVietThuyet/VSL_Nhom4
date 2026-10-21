import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmCustomerDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { CrmCustomerForm } from '../crm-customer-form/crm-customer-form';

@Component({
  selector: 'app-crm-customer-create',
  standalone: true,
  imports: [CommonModule, SharedModules, CrmCustomerForm],
  templateUrl: './crm-customer-create.html',
  styleUrls: ['./crm-customer-create.scss'],
})
export class CrmCustomerCreate {
  customer = new CrmCustomerDto();
  loading = false;

  constructor(
    private crmService: CrmService,
    private router: Router,
    private message: NzMessageService,
  ) {}

  createCustomer(customer: CrmCustomerDto): void {
    this.loading = true;
    this.crmService.createCustomer(customer).subscribe({
      next: () => {
        this.message.success('Tạo khách hàng thành công');
        this.router.navigate(['/crm/customer']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/crm/customer']);
  }
}
