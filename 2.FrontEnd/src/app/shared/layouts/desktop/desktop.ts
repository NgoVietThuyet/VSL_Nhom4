import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../ng-zorro.module';
import { AppWindow, WindowManagerService } from '../../services/window-manager.service';
import { WindowFrame } from '../window-frame/window-frame';
import { Taskbar } from '../taskbar/taskbar';

@Component({
  selector: 'app-desktop',
  imports: [SharedModules, WindowFrame, Taskbar],
  standalone: true,
  templateUrl: './desktop.html',
  styleUrl: './desktop.scss',
})
export class Desktop implements OnInit, OnDestroy {
  windows: AppWindow[] = [];
  private destroy$ = new Subject<void>();

  constructor(public windowManager: WindowManagerService) {}

  ngOnInit(): void {
    this.windowManager.windows$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wins => (this.windows = wins));

    if (this.windows.length === 0) {
      this.windowManager.openApp('home');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(_: number, item: AppWindow): string {
    return item.id;
  }
}
