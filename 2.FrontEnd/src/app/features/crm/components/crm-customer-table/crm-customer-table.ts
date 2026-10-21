import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CrmCustomerDto } from '../../models';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-crm-customer-table',
  standalone: true,
  imports: [CommonModule, SharedModules],
  templateUrl: './crm-customer-table.html',
  styleUrls: ['./crm-customer-table.scss'],
})
export class CrmCustomerTable {
  @Input() customers: CrmCustomerDto[] = [];
  @Input() loading = false;
  @Output() view = new EventEmitter<CrmCustomerDto>();
  @Output() edit = new EventEmitter<CrmCustomerDto>();
  @Output() delete = new EventEmitter<CrmCustomerDto>();

  emitView(c: CrmCustomerDto): void { this.view.emit(c); }
  emitEdit(c: CrmCustomerDto): void { this.edit.emit(c); }
  emitDelete(c: CrmCustomerDto): void { this.delete.emit(c); }

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

  getOwnerInitials(owner: string): string {
    if (!owner) return '?';
    return owner.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
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
