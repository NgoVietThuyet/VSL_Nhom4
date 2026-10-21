import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmService } from '../../services/crm.service';
import { CrmActivityFullDto, CrmCustomerDto, CrmLeadDto, CrmOpportunityForecastDto, CrmOpportunityPipelineDto } from '../../models';

@Component({
  selector: 'app-crm-home',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './crm-home.html',
  styleUrls: ['./crm-home.scss'],
})
export class CrmHome implements OnInit {
  // Stats
  totalCustomers = 0;
  totalLeads = 0;
  totalOpportunities = 0;
  forecast: CrmOpportunityForecastDto = { totalExpectedRevenue: 0, totalWonRevenue: 0, totalLostRevenue: 0 };

  // Pipeline
  pipelineStages: CrmOpportunityPipelineDto[] = [];
  pipelineLoading = false;

  // Recent data
  recentLeads: CrmLeadDto[] = [];
  recentCustomers: CrmCustomerDto[] = [];
  recentActivities: CrmActivityFullDto[] = [];
  dataLoading = false;

  constructor(private service: CrmService, private router: Router) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadPipeline();
    this.loadRecentData();
  }

  loadSummary(): void {
    const filter = { currentPage: 1, pageSize: 1, isActive: true } as any;
    this.service.searchCustomers(filter).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        this.totalCustomers = d?.totalRecord ?? 0;
      },
    });
    this.service.searchLeads(filter).subscribe({
      next: (res) => { this.totalLeads = res?.data?.totalRecord ?? 0; },
    });
    this.service.searchOpportunities(filter).subscribe({
      next: (res) => { this.totalOpportunities = res?.data?.totalRecord ?? 0; },
    });
    this.service.forecast().subscribe({
      next: (res) => { this.forecast = res ?? this.forecast; },
    });
  }

  loadPipeline(): void {
    this.pipelineLoading = true;
    this.service.pipeline().subscribe({
      next: (res) => { this.pipelineStages = res ?? []; this.pipelineLoading = false; },
      error: () => { this.pipelineLoading = false; },
    });
  }

  loadRecentData(): void {
    this.dataLoading = true;
    const filter = { currentPage: 1, pageSize: 5, isActive: true } as any;

    this.service.searchLeads(filter).subscribe({
      next: (res) => { this.recentLeads = res?.data?.data ?? []; },
    });
    this.service.searchCustomers(filter).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        this.recentCustomers = d?.data ?? [];
        this.dataLoading = false;
      },
      error: () => { this.dataLoading = false; },
    });
    this.service.myTodayActivities().subscribe({
      next: (res) => { this.recentActivities = res?.data ?? []; },
    });
  }

  // Navigation helpers
  navTo(path: string): void { this.router.navigate([path]); }

  // Formatters
  formatCurrency(v: number | null | undefined): string {
    if (!v) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  }

  totalPipelineAmount(): number {
    return this.pipelineStages.reduce((s, st) =>
      s + (st.opportunities ?? []).reduce((ss, o) => ss + (o.amount ?? 0), 0), 0);
  }

  totalPipelineCount(): number {
    return this.pipelineStages.reduce((s, st) => s + (st.count ?? 0), 0);
  }

  getStageColor(stage: string): string {
    const map: Record<string, string> = {
      PROSPECTING: 'default', QUALIFIED: 'blue', PROPOSAL: 'orange',
      NEGOTIATION: 'purple', WON: 'success', LOST: 'error',
    };
    return map[stage?.toUpperCase()] ?? 'default';
  }

  getLeadStatusColor(status: string): string {
    const map: Record<string, string> = { New: 'default', Contacted: 'processing', Qualified: 'success', Unqualified: 'error', Converted: 'purple' };
    return map[status] ?? 'default';
  }

  getActivityTypeColor(type: string): string {
    const map: Record<string, string> = { Call: 'blue', Email: 'cyan', Meeting: 'purple', Task: 'orange', Note: 'green' };
    return map[type] ?? 'default';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  getAvatarColor(name: string): string {
    const colors = ['#4f8ef7', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
