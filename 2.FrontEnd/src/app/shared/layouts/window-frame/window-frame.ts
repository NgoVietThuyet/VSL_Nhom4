import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { SharedModules } from '../../ng-zorro.module';
import { AppWindow, WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-window-frame',
  imports: [SharedModules, NgComponentOutlet],
  standalone: true,
  templateUrl: './window-frame.html',
  styleUrl: './window-frame.scss',
})
export class WindowFrame implements OnInit, OnChanges {
  @Input() win!: AppWindow;
  @ViewChild('windowWrap', { static: true }) windowWrapRef!: ElementRef<HTMLElement>;

  isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  isResizing = false;
  private resizeDir = '';
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartW = 0;
  private resizeStartH = 0;
  private resizeStartPosX = 0;
  private resizeStartPosY = 0;

  private savedBounds: { x: number; y: number; w: number; h: number } | null = null;

  constructor(private windowManager: WindowManagerService) {}

  ngOnInit(): void {
    this.syncStyles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['win'] && !this.isDragging && !this.isResizing) {
      this.syncStyles();
    }
  }

  private syncStyles(): void {
    const el = this.windowWrapRef?.nativeElement;
    if (!el) return;
    if (this.win.state === 'maximized' || this.win.state === 'minimized') return;
    el.style.left = this.win.x + 'px';
    el.style.top = this.win.y + 'px';
    el.style.width = this.win.width + 'px';
    el.style.height = this.win.height + 'px';
  }

  get isActive(): boolean {
    return this.windowManager.isActiveWindow(this.win.id);
  }

  onWindowMouseDown(event: MouseEvent): void {
    if (!this.isActive) {
      this.windowManager.focusWindow(this.win.id);
    }
  }

  onTitleBarMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || this.win.state === 'maximized') return;
    event.preventDefault();

    const el = this.windowWrapRef.nativeElement;
    const rect = el.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.isDragging = true;

    if (!this.isActive) {
      this.windowManager.focusWindow(this.win.id);
    }
  }

  onDoubleClickTitleBar(): void {
    this.toggleMaximize();
  }

  onResizeMouseDown(event: MouseEvent, dir: string): void {
    if (event.button !== 0 || this.win.state === 'maximized') return;
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeDir = dir;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;

    const el = this.windowWrapRef.nativeElement;
    const rect = el.getBoundingClientRect();
    this.resizeStartW = rect.width;
    this.resizeStartH = rect.height;
    this.resizeStartPosX = rect.left;
    this.resizeStartPosY = rect.top;

    if (!this.isActive) {
      this.windowManager.focusWindow(this.win.id);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.handleDragMove(event);
    } else if (this.isResizing) {
      this.handleResizeMove(event);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.commitDragPosition();
      this.isDragging = false;
    }
    if (this.isResizing) {
      this.commitResizeBounds();
      this.isResizing = false;
      this.resizeDir = '';
    }
  }

  private handleDragMove(event: MouseEvent): void {
    const el = this.windowWrapRef.nativeElement;
    const taskbarH = 48;

    let x = event.clientX - this.dragOffsetX;
    let y = event.clientY - this.dragOffsetY;

    const minVisible = 60;
    x = Math.max(-(this.win.width - minVisible), Math.min(x, window.innerWidth - minVisible));
    y = Math.max(0, Math.min(y, window.innerHeight - taskbarH - 38));

    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  private handleResizeMove(event: MouseEvent): void {
    const dx = event.clientX - this.resizeStartX;
    const dy = event.clientY - this.resizeStartY;
    const dir = this.resizeDir;

    let newW = this.resizeStartW;
    let newH = this.resizeStartH;
    let newX = this.resizeStartPosX;
    let newY = this.resizeStartPosY;

    const minW = this.win.minWidth || 300;
    const minH = this.win.minHeight || 200;

    if (dir.includes('e')) newW = Math.max(minW, this.resizeStartW + dx);
    if (dir.includes('s')) newH = Math.max(minH, this.resizeStartH + dy);
    if (dir.includes('w')) {
      const possibleW = Math.max(minW, this.resizeStartW - dx);
      newX = this.resizeStartPosX + (this.resizeStartW - possibleW);
      newW = possibleW;
    }
    if (dir.includes('n')) {
      const possibleH = Math.max(minH, this.resizeStartH - dy);
      newY = this.resizeStartPosY + (this.resizeStartH - possibleH);
      newH = possibleH;
    }

    const el = this.windowWrapRef.nativeElement;
    el.style.left = newX + 'px';
    el.style.top = newY + 'px';
    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
  }

  private commitDragPosition(): void {
    const el = this.windowWrapRef.nativeElement;
    const x = parseFloat(el.style.left) || this.win.x;
    const y = parseFloat(el.style.top) || this.win.y;
    this.windowManager.updateWindowPosition(this.win.id, x, y);
  }

  private commitResizeBounds(): void {
    const el = this.windowWrapRef.nativeElement;
    const x = parseFloat(el.style.left) || this.win.x;
    const y = parseFloat(el.style.top) || this.win.y;
    const w = parseFloat(el.style.width) || this.win.width;
    const h = parseFloat(el.style.height) || this.win.height;
    this.windowManager.updateWindowBounds(this.win.id, x, y, w, h);
  }

  minimize(): void {
    this.windowManager.minimizeWindow(this.win.id);
  }

  toggleMaximize(): void {
    if (this.win.state !== 'maximized') {
      const el = this.windowWrapRef.nativeElement;
      this.savedBounds = {
        x: parseFloat(el.style.left) || this.win.x,
        y: parseFloat(el.style.top) || this.win.y,
        w: parseFloat(el.style.width) || this.win.width,
        h: parseFloat(el.style.height) || this.win.height,
      };
    }
    this.windowManager.toggleMaximize(this.win.id);
  }

  close(): void {
    this.windowManager.closeWindow(this.win.id);
  }
}
