import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmLeadDto } from '../../models';

@Component({
  selector: 'app-crm-lead-detail',
  standalone: true,
  imports: [CommonModule, SharedModules],
  templateUrl: './crm-lead-detail.html',
  styleUrls: ['./crm-lead-detail.scss'],
})
export class CrmLeadDetail {
  @Input() lead: CrmLeadDto | null = null;

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#4f8ef7', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = {
      New: 'default', Contacted: 'processing', Qualified: 'success', Unqualified: 'error', Converted: 'purple',
    };
    return m[status] ?? 'default';
  }

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      New: 'Mới', Contacted: 'Đã liên hệ', Qualified: 'Tiềm năng', Unqualified: 'Không tiềm năng', Converted: 'Đã chuyển đổi',
    };
    return m[status] ?? status;
  }
}
