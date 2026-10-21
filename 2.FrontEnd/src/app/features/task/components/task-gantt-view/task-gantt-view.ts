import { Component, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar';
import { TaskBoardDto, TaskCardDto , TaskListDto } from '../../models';

interface TimelineCol {
  date: Date;
  label: string;   // e.g. "T2" or "Thg 5"
  dayNum: string;  // e.g. "12"
  isToday: boolean;
}

@Component({
  selector: 'app-task-gantt-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModules, UserAvatarComponent],
  templateUrl: './task-gantt-view.html',
  styleUrls: ['./task-gantt-view.scss']
})
export class TaskGanttView implements OnChanges, AfterViewInit {
  @ViewChild('timelineContainer') timelineContainer!: ElementRef;
  @Input() board!: TaskBoardDto;
  @Output() cardClicked = new EventEmitter<TaskCardDto>();
  @Output() cardToggleComplete = new EventEmitter<TaskCardDto>();
  @Output() onAddCard = new EventEmitter<{ list: TaskListDto, title: string }>();
  @Output() onAddList = new EventEmitter<string>();

  viewMode: 'week' | 'month' = 'month';
  viewDate: Date = new Date();
  collapsedGroups = new Set<string>();

  isAddingList = false;
  newListName = '';

  addingCardListId = '';
  newCardTitle = '';

  timelineCols: TimelineCol[] = [];
  colWidth = 40; // px per column
  timelineStartDate!: Date;

  private readonly LIST_COLORS = [
    '#189AD6', '#7C3AED', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#BE185D'
  ];

  private readonly DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  ngOnChanges(): void {
    this.buildTimeline();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToToday(), 100);
  }

  // ── Timeline builder ───────────────────────────────────────────────────────
  buildTimeline(): void {
    const cards = this.allCards.filter(c => !!c.dueDate);
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    cards.forEach(card => {
      const s = this.getCardStartDate(card);
      const e = new Date(card.dueDate!);

      if (!minDate || s < minDate) minDate = s;
      if (!maxDate || e > maxDate) maxDate = e;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Default range around today if no cards
    let start = minDate ? new Date(minDate) : new Date(today);
    let end = maxDate ? new Date(maxDate) : new Date(today);

    // Padding: at least 30 days before and after for "infinite" start
    start.setDate(start.getDate() - 30);
    end.setDate(end.getDate() + 60);

    // Ensure we see today if it's outside the range
    if (today < start) start = new Date(today.getTime() - 30 * 86400000);
    if (today > end) end = new Date(today.getTime() + 60 * 86400000);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    this.timelineStartDate = start;
    const totalDays = this.diffDays(end, start) + 1;

    const cols: TimelineCol[] = [];
    this.colWidth = this.viewMode === 'week' ? 80 : 40;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cols.push(this.createCol(d, today));
    }

    this.timelineCols = cols;
  }

  private createCol(d: Date, today: Date): TimelineCol {
    let label = this.DAY_LABELS[d.getDay()];
    if (this.viewMode === 'month' && d.getDate() === 1) {
      label = `Thg ${d.getMonth() + 1}`;
    }
    return {
      date: d,
      label: label,
      dayNum: String(d.getDate()),
      isToday: this.isSameDay(d, today)
    };
  }

  private isExtending = false;

  onScroll(e: Event): void {
    if (this.isExtending) return;

    const el = e.target as HTMLElement;
    const threshold = 400; // pixels from edge

    // Extend right
    if (el.scrollLeft + el.clientWidth > el.scrollWidth - threshold) {
      this.isExtending = true;
      this.extendTimelineDays(60, 'end');
      setTimeout(() => this.isExtending = false, 100);
    }

    // Extend left
    if (el.scrollLeft < threshold) {
      this.isExtending = true;
      const prevScrollWidth = el.scrollWidth;
      this.extendTimelineDays(60, 'start');

      // Keep scroll position stable after adding columns to the left
      setTimeout(() => {
        const newScrollWidth = el.scrollWidth;
        el.scrollLeft += (newScrollWidth - prevScrollWidth);
        this.isExtending = false;
      }, 0);
    }
  }

  private extendTimelineDays(days: number, direction: 'start' | 'end'): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (direction === 'end') {
      const lastDate = this.timelineCols[this.timelineCols.length - 1].date;
      for (let i = 1; i <= days; i++) {
        const d = new Date(lastDate);
        d.setDate(lastDate.getDate() + i);
        this.timelineCols.push(this.createCol(d, today));
      }
    } else {
      const firstDate = this.timelineCols[0].date;
      const newCols: TimelineCol[] = [];
      // Use i from days down to 1 and push to maintain chronological order
      for (let i = days; i >= 1; i--) {
        const d = new Date(firstDate);
        d.setDate(firstDate.getDate() - i);
        newCols.push(this.createCol(d, today));
      }
      this.timelineCols = [...newCols, ...this.timelineCols];
      this.timelineStartDate = this.timelineCols[0].date;
    }
  }

  // ── Bar positioning ────────────────────────────────────────────────────────
  getBarLeft(card: TaskCardDto): number {
    const start = this.getCardStartDate(card);
    const diffDays = this.diffDays(start, this.timelineStartDate);
    return diffDays * this.colWidth;
  }

  getBarWidth(card: TaskCardDto): number {
    const start = this.getCardStartDate(card);
    const due = card.dueDate ? new Date(card.dueDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const duration = Math.max(1, this.diffDays(due, start) + 1);
    return duration * this.colWidth - 4;
  }

  private getCardStartDate(card: TaskCardDto): Date {
    if (card.startDate) return new Date(card.startDate);
    if (card.createDate) return new Date(card.createDate);
    if (card.dueDate) {
      const d = new Date(card.dueDate);
      d.setDate(d.getDate() - 2);
      return d;
    }
    return new Date();
  }

  // ── Group helpers ──────────────────────────────────────────────────────────
  toggleGroup(listId: string): void {
    if (this.collapsedGroups.has(listId)) {
      this.collapsedGroups.delete(listId);
    } else {
      this.collapsedGroups.add(listId);
    }
  }

  getListColor(index: number): string {
    return this.LIST_COLORS[index % this.LIST_COLORS.length];
  }

  scrollToToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.scrollToDate(today);
  }

  jumpToDate(date: Date | null): void {
    if (date) {
      this.scrollToDate(date);
    }
  }

  private scrollToDate(date: Date): void {
    if (!this.timelineContainer || !this.timelineStartDate) return;
    const diff = this.diffDays(date, this.timelineStartDate);
    const scrollLeft = diff * this.colWidth - 150; // Center a bit
    this.timelineContainer.nativeElement.scrollLeft = Math.max(0, scrollLeft);
  }

  get allCards(): TaskCardDto[] {
    return (this.board?.lists || []).flatMap(l => l.cards || []);
  }

  // ── Date utils ─────────────────────────────────────────────────────────────
  formatDate(date?: string | Date): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getBarDateRange(card: TaskCardDto): string {
    const start = this.getCardStartDate(card);
    const end = card.dueDate ? new Date(card.dueDate) : null;
    if (!end) return this.formatDate(start);
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  getGroupRange(list: any): { start: Date; end: Date } | null {
    const cards = (list.cards || []).filter((c: any) => !!c.dueDate);
    if (cards.length === 0) return null;

    let min: Date | null = null;
    let max: Date | null = null;

    cards.forEach((card: TaskCardDto) => {
      const s = this.getCardStartDate(card);
      const e = card.dueDate ? new Date(card.dueDate) : new Date(s.getTime() + 86400000);
      if (!min || s < min) min = s;
      if (!max || e > max) max = e;
    });

    if (!min || !max) return null;
    return { start: min, end: max };
  }

  getRangeLeft(range: { start: Date; end: Date }): number {
    const diffDays = this.diffDays(range.start, this.timelineStartDate);
    return diffDays * this.colWidth;
  }

  getRangeWidth(range: { start: Date; end: Date }): number {
    const duration = Math.max(1, this.diffDays(range.end, range.start) + 1);
    return duration * this.colWidth;
  }

  private diffDays(from: Date, baseDate: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((from.getTime() - baseDate.getTime()) / msPerDay);
  }

  // ── Add List/Card ─────────────────────────────────────────────────────────
  startAddList(): void {
    this.isAddingList = true;
    this.newListName = '';
    setTimeout(() => {
      const el = document.getElementById('new-list-input-gv');
      el?.focus();
    }, 100);
  }

  cancelAddList(): void {
    this.isAddingList = false;
    this.newListName = '';
  }

  submitAddList(): void {
    if (!this.newListName.trim()) return;
    this.onAddList.emit(this.newListName.trim());
    this.cancelAddList();
  }

  startAddCard(listId: string): void {
    this.addingCardListId = listId;
    this.newCardTitle = '';
    setTimeout(() => {
      const el = document.getElementById(`new-card-input-gv-${listId}`);
      el?.focus();
    }, 100);
  }

  cancelAddCard(): void {
    this.addingCardListId = '';
    this.newCardTitle = '';
  }

  submitAddCard(list: TaskListDto): void {
    if (!this.newCardTitle.trim()) return;
    this.onAddCard.emit({ list, title: this.newCardTitle.trim() });
    this.cancelAddCard();
  }

  onKeydownList(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.submitAddList();
    }
    if (event.key === 'Escape') this.cancelAddList();
  }

  onKeydownCard(event: KeyboardEvent, list: TaskListDto): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.submitAddCard(list);
    }
    if (event.key === 'Escape') this.cancelAddCard();
  }
}
