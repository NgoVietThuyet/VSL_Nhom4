import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmCustomerDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { CrmCustomerForm } from '../crm-customer-form/crm-customer-form';

@Component({
  selector: 'app-crm-customer-update',
  standalone: true,
  imports: [CommonModule, SharedModules, CrmCustomerForm],
  templateUrl: './crm-customer-update.html',
  styleUrls: ['./crm-customer-update.scss'],
})
export class CrmCustomerUpdate implements OnInit {
  customer = new CrmCustomerDto();
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crmService: CrmService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/crm/customer']);
      return;
    }

    this.loadCustomer(id);
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    this.crmService.customerDetail(id).subscribe({
      next: (result) => {
        this.customer = result?.data ?? new CrmCustomerDto();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  updateCustomer(customer: CrmCustomerDto): void {
    this.loading = true;
    this.crmService.updateCustomer(customer).subscribe({
      next: () => {
        this.message.success('Cập nhật khách hàng thành công');
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
