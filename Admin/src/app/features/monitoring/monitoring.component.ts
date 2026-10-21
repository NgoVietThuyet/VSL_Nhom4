import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.scss']
})
export class MonitoringComponent implements OnInit {
  private readonly OVERVIEW_API = API_BASE + '/admin/monitoring/overview';
  private readonly AI_ATTEMPTS_API = API_BASE + '/admin/monitoring/ai-attempts';
  private readonly HARD_SIGNS_API = API_BASE + '/admin/monitoring/hard-signs';

  overview: any = null;
  attempts: any[] = [];
  hardSigns: any[] = [];
  loading = false;
  filterCorrect: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.fetchOverview();
    this.fetchHardSigns();
    this.fetchAiAttempts();
  }

  fetchOverview(): void {
    this.http.get<{ data: any }>(this.OVERVIEW_API).subscribe({
      next: (res) => this.overview = res.data
    });
  }

  fetchHardSigns(): void {
    this.http.get<{ data: any[] }>(this.HARD_SIGNS_API).subscribe({
      next: (res) => this.hardSigns = res.data || []
    });
  }

  fetchAiAttempts(): void {
    this.loading = true;
    let url = this.AI_ATTEMPTS_API;
    if (this.filterCorrect) {
      url += `?isCorrect=${this.filterCorrect}`;
    }

    this.http.get<{ data: any[] }>(url).subscribe({
      next: (res) => {
        this.attempts = res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  errorColor(rate: number): string {
    if (rate >= 50) return '#ff4d4f';
    if (rate >= 25) return '#fa8c16';
    return '#faad14';
  }

  initials(name?: string): string {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}
