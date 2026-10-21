import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_BASE } from '../config/api.config';

export interface UserInfo {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  xp?: number;
  level?: number;
  streakDays?: number;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: UserInfo;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = API_BASE;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_BASE}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res?.data?.accessToken) {
          localStorage.setItem('admin_token', res.data.accessToken);
          localStorage.setItem('admin_user', JSON.stringify(res.data.user));
          this.currentUserSubject.next(res.data.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  getStoredUser(): UserInfo | null {
    const raw = localStorage.getItem('admin_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value || this.getStoredUser();
    return user?.role?.toUpperCase() === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
