import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CrmCustomerDto } from '../../models';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-crm-customer-detail',
  standalone: true,
  imports: [CommonModule, SharedModules],
  templateUrl: './crm-customer-detail.html',
  styleUrls: ['./crm-customer-detail.scss'],
})
export class CrmCustomerDetail {
  @Input() customer: CrmCustomerDto | null = null;

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  getAvatarColor(name: string): string {
    const colors = ['#4f8ef7', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getTypeColor(type: string): string {
    const m: Record<string, string> = { Customer: 'cyan', Prospect: 'purple', Lead: 'gold' };
    return m[type] ?? 'default';
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = { Active: 'green', Inactive: 'default', Pending: 'orange' };
    return m[status] ?? 'default';
  }

  formatRevenue(v: number | null | undefined): string {
    if (!v) return '–';
    return '$' + new Intl.NumberFormat('en-US').format(v);
  }
}
