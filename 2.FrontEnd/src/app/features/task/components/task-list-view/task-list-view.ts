import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar';
import { TaskBoardDto, TaskCardDto, PRIORITY_LIST , TaskListDto } from '../../models';

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [CommonModule, SharedModules, FormsModule, UserAvatarComponent],
  templateUrl: './task-list-view.html',
  styleUrls: ['./task-list-view.scss']
})
export class TaskListView {
  @Input() board!: TaskBoardDto;
  @Output() cardClicked = new EventEmitter<TaskCardDto>();
  @Output() cardToggleComplete = new EventEmitter<TaskCardDto>();
  @Output() onAddCard = new EventEmitter<{ list: TaskListDto, title: string }>();
  @Output() onAddList = new EventEmitter<string>();

  collapsedGroups = new Set<string>();

  isAddingList = false;
  newListName = '';

  addingCardListId = '';
  newCardTitle = '';

  /** Accent colors for groups (cycles) */
  private readonly LIST_COLORS = [
    '#189AD6', '#7C3AED', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#BE185D'
  ];

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

  getTotalCards(): number {
    return (this.board?.lists || []).reduce((sum, l) => sum + (l.cards?.length || 0), 0);
  }

  // ── Priority ───────────────────────────────────────────────────────────────
  getPriorityColor(priority?: number): string {
    return PRIORITY_LIST.find(p => p.value === priority)?.color || '#97a0af';
  }

  getPriorityLabel(priority?: number): string {
    return PRIORITY_LIST.find(p => p.value === priority)?.label || 'Bình thường';
  }

  // ── Date ───────────────────────────────────────────────────────────────────
  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  isOverdue(date?: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  isDueSoon(date?: string): boolean {
    if (!date || this.isOverdue(date)) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff < 2 * 24 * 60 * 60 * 1000; // within 2 days
  }

  getChecklistProgress(card: TaskCardDto): { done: number; total: number } {
    const all = (card.checklists || []).flatMap(cl => cl.items || []);
    return { done: all.filter(i => i.isDone).length, total: all.length };
  }

  // ── Members ────────────────────────────────────────────────────────────────
  getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  // ── Add List/Card ─────────────────────────────────────────────────────────
  startAddList(): void {
    this.isAddingList = true;
    this.newListName = '';
    setTimeout(() => {
      const el = document.getElementById('new-list-input-lv');
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
      const el = document.getElementById(`new-card-input-lv-${listId}`);
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
