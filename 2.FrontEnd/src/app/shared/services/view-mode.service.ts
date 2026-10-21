import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ViewMode = 'normal' | 'window';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private readonly STORAGE_KEY = 'appViewMode';
  private modeSubject = new BehaviorSubject<ViewMode>(this.loadMode());

  readonly mode$ = this.modeSubject.asObservable();

  get mode(): ViewMode {
    return this.modeSubject.value;
  }

  get isWindowMode(): boolean {
    return this.modeSubject.value === 'window';
  }

  setMode(mode: ViewMode): void {
    this.modeSubject.next(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  toggleMode(): void {
    this.setMode(this.mode === 'normal' ? 'window' : 'normal');
  }

  private loadMode(): ViewMode {
    return localStorage.getItem(this.STORAGE_KEY) === 'window' ? 'window' : 'normal';
  }
}
