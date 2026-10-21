import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskService } from '../../services';
import {
  TaskBoardDto, TaskListDto, TaskCardDto,
  PRIORITY_LIST, BOARD_BACKGROUNDS,
  TaskCardMemberDto
} from '../../models';
import { TaskListView } from '../task-list-view/task-list-view';
import { TaskGanttView } from '../task-gantt-view/task-gantt-view';
import { CardDetail } from '../card-detail/card-detail';
import { BACKGROUND_COLOR_DEFAULT } from '../../../../shared/utils/const';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-board',
  imports: [CommonModule, SharedModules, DragDropModule, CardDetail, TaskListView, TaskGanttView, UserAvatarComponent],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  boardId = '';
  board: TaskBoardDto = new TaskBoardDto();
  priorityList = PRIORITY_LIST;

  isAddingList = false;
  newListName = '';

  addingCardListId = '';
  newCardTitle = '';

  editingListId = '';
  editingListName = '';

  isCardDetailVisible = false;
  selectedCardId = '';
  selectedCard: TaskCardDto = new TaskCardDto();

  isBoardSettingsVisible = false;
  workspaceId: string = '';
  routeCardId: string = '';
  BACKGROUND_COLOR_DEFAULT: string = BACKGROUND_COLOR_DEFAULT;

  currentView: 'board' | 'list' | 'gantt' = 'board';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.boardId = params['id'];
      this.loadDataTaskList();
    });

     this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe(query => {
      this.workspaceId = query['workspaceId'];
      this.routeCardId = query['cardId'] || '';
      this.tryOpenCardFromRoute();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataTaskList(): void {
    if (!this.boardId) return;
    this.taskService.getDataTaskBoardDetail(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.board = data || new TaskBoardDto();
          if (!this.board.lists) this.board.lists = [];
          this.tryOpenCardFromRoute();
        },
      });
  }

  private tryOpenCardFromRoute(): void {
    if (!this.routeCardId || !this.board?.lists?.length) {
      return;
    }

    for (const list of this.board.lists) {
      const card = (list.cards || []).find(c => c.id === this.routeCardId);
      if (card) {
        if (!this.isCardDetailVisible || this.selectedCardId !== card.id) {
          this.openCardDetail(card);
        }
        return;
      }
    }
  }

  startAddList(): void {
    this.isAddingList = true;
    this.newListName = '';
    setTimeout(() => {
      const el = document.getElementById('new-list-input');
      el?.focus();
    }, 100);
  }

  cancelAddList(): void {
    this.isAddingList = false;
    this.newListName = '';
  }

  addList(name?: string): void {
    const listName = name || this.newListName;
    if (!listName.trim()) return;
    this.taskService.createList({ boardId: this.boardId, name: listName.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false && res?.data) {
          const newList: TaskListDto = { ...res.data, cards: [] };
          this.board.lists = [...(this.board.lists || []), newList];
          this.cancelAddList();
        }
      });
  }
  startEditList(list: TaskListDto, event: Event): void {
    event.stopPropagation();
    this.editingListId = list.id;
    this.editingListName = list.name;
  }

  saveListName(list: TaskListDto): void {
    if (!this.editingListName.trim() || this.editingListName === list.name) {
      this.editingListId = '';
      return;
    }
    this.taskService.updateList(list.id, { name: this.editingListName.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) {
          list.name = this.editingListName.trim();
        }
        this.editingListId = '';
      });
  }

  deleteList(list: TaskListDto): void {
    this.taskService.deleteList(list.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.board.lists = (this.board.lists || []).filter(l => l.id !== list.id);
        this.message.success('Đã xóa danh sách!');
      });
  }

  startAddCard(listId: string): void {
    this.addingCardListId = listId;
    this.newCardTitle = '';
    setTimeout(() => {
      const el = document.getElementById(`new-card-input-${listId}`);
      el?.focus();
    }, 100);
  }

  cancelAddCard(): void {
    this.addingCardListId = '';
    this.newCardTitle = '';
  }
  addCard(list: TaskListDto, title?: string): void {
    const cardTitle = title || this.newCardTitle;
    if (!cardTitle.trim()) return;
    this.taskService.createCard({ listId: list.id, title: cardTitle.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false && res?.data) {
          if (!list.cards) list.cards = [];
          list.cards = [...list.cards, { ...res.data, labels: [], members: [], checklists: [], comments: [] }];
          this.cancelAddCard();
        }
      });
  }

  openCardDetail(card: TaskCardDto): void {
    this.selectedCardId = card.id;
    this.selectedCard = card;
    this.isCardDetailVisible = true;
  }

  onCardDetailClosed(updatedCard?: TaskCardDto): void {
    this.isCardDetailVisible = false;
    if (updatedCard) {
      for (const list of (this.board.lists || [])) {
        const idx = (list.cards || []).findIndex(c => c.id === updatedCard.id);
        if (idx >= 0) {
          list.cards![idx] = updatedCard;
          break;
        }
      }
    }
  }

  onCardDeleted(cardId: string): void {
    this.isCardDetailVisible = false;
    for (const list of (this.board.lists || [])) {
      list.cards = (list.cards || []).filter(c => c.id !== cardId);
    }
  }

  toggleCardComplete(card: TaskCardDto): void {
    const newStatus = !card.isCompleted;
    this.taskService.updateCard(card.id, { isCompleted: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) {
          card.isCompleted = newStatus;
          this.message.success(newStatus ? 'Đã hoàn thành nhiệm vụ!' : 'Đã mở lại nhiệm vụ!');
        }
      });
  }

  dropCard(event: CdkDragDrop<TaskCardDto[]>, targetList: TaskListDto): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.saveCardOrder(targetList);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const movedCard = event.container.data[event.currentIndex];
      movedCard.listId = targetList.id;
      this.saveCardOrder(targetList);

      this.taskService.moveCard({
        cardId: movedCard.id,
        targetListId: targetList.id,
        orderIndex: event.currentIndex * 1000,
      }).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  private saveCardOrder(list: TaskListDto): void {
    if (!list.cards?.length) return;
    const items = list.cards.map((c, i) => ({
      id: c.id,
      listId: list.id,
      orderIndex: (i + 1) * 1000,
    }));
    this.taskService.reorderCards({ items })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  dropList(event: CdkDragDrop<TaskListDto[]>): void {
    moveItemInArray(this.board.lists!, event.previousIndex, event.currentIndex);
    const items = this.board.lists!.map((l, i) => ({
      id: l.id,
      orderIndex: (i + 1) * 1000,
    }));
    this.taskService.reorderLists({ items })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getListDropIds(): string[] {
    return (this.board.lists || []).map(l => `list-${l.id}`);
  }

  getPriorityColor(priority?: number): string {
    return this.priorityList.find(p => p.value === priority)?.color || '#bbb';
  }

  getPriorityLabel(priority?: number): string {
    return this.priorityList.find(p => p.value === priority)?.label || '';
  }

  getChecklistProgress(card: TaskCardDto): { done: number; total: number } {
    const all = (card.checklists || []).flatMap(cl => cl.items || []);
    return { done: all.filter(i => i.isDone).length, total: all.length };
  }

  isDueSoon(dueDate?: string): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff < 86400000 * 2;
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getBoardBackground(): string {
    if (this.board.backgroundColor) return this.board.backgroundColor;
    return BACKGROUND_COLOR_DEFAULT;
    // const idx = (this.board.id || 'x').charCodeAt(0) % BOARD_BACKGROUNDS.length;
    // return BOARD_BACKGROUNDS[idx];
  }

  goBack(): void {
    this.router.navigate(['/task/home'], { queryParams: { workspaceId: this.workspaceId } });
  }

  onKeydownList(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.addList();
    }
    if (event.key === 'Escape') this.cancelAddList();
  }

  onKeydownCard(event: KeyboardEvent, list: TaskListDto): void {
    if (event.isComposing) return;

    if (event.key === 'Enter' && !event.shiftKey) {

      event.preventDefault();
      event.stopPropagation();

      this.addCard(list);
    }
    
    if (event.key === 'Escape') this.cancelAddCard();
  }

  onKeydownEditList(event: KeyboardEvent, list: TaskListDto): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.saveListName(list);
    }
    if (event.key === 'Escape') this.editingListId = '';
  }

  getRemainingMembersTooltip(members: TaskCardMemberDto[]): string {
    if (!members || members.length <= 3) return '';

    return members
      .slice(3)
      .map(m => m.fullName || m.userId)
      .join(', ');
  }
}
