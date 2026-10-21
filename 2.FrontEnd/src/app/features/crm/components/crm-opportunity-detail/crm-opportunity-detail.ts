import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmOpportunityFullDto } from '../../models';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-opportunity-detail',
  standalone: true,
  imports: [CommonModule, SharedModules],
  templateUrl: './crm-opportunity-detail.html',
  styleUrls: ['./crm-opportunity-detail.scss'],
})
export class CrmOpportunityDetail implements OnInit {
  loading = false;
  opp?: CrmOpportunityFullDto;

  constructor(private route: ActivatedRoute, private router: Router, private svc: CrmService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.back(); return; }
    this.loadDetail(id);
  }

  private loadDetail(id: string): void {
    this.loading = true;
    this.svc.opportunityDetail(id).subscribe({
      next: (res) => {
        this.opp = res ?? undefined;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  back(): void { this.router.navigate(['/crm/opportunity']); }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  }
}
