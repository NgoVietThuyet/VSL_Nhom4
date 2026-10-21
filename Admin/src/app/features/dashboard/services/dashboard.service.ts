import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AdminDashboardData } from '../../../shared/models/dashboard.model';
import { API_BASE } from '../../../core/config/api.config';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = API_BASE + '/admin/stats/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<AdminDashboardData> {
    return this.http.get<ApiResponse<AdminDashboardData>>(this.API_URL).pipe(
      map(res => res.data)
    );
  }
}
