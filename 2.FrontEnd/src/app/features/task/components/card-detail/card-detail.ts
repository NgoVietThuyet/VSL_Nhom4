import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskService } from '../../services';
import {
  TaskCardDto, TaskLabelDto, TaskBoardMemberDto,
  TaskChecklistDto, TaskChecklistItemDto, TaskCommentDto,
  TaskCardLabelDto, TaskCardMemberDto, LABEL_COLORS, PRIORITY_LIST
} from '../../models';
import { LocalStorageUtils, StringUtils } from '../../../../shared/utils';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../../system-manager/services/account.service';
import { AccountDto } from '../../../system-manager/models';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-card-detail',
  imports: [CommonModule, SharedModules, UserAvatarComponent],
  templateUrl: './card-detail.html',
  styleUrl: './card-detail.scss',
})
export class CardDetail implements OnInit, OnDestroy, OnChanges {
  @ViewChild('dueDatePicker') dueDatePicker: any;
  @Input() cardId = '';
  @Input() boardLabels: TaskLabelDto[] = [];
  @Input() boardMembers: TaskBoardMemberDto[] = [];
  @Input() visible = false;
  @Output() closed = new EventEmitter<TaskCardDto | undefined>();
  @Output() cardDeleted = new EventEmitter<string>();

  private readonly destroy$ = new Subject<void>();

  @Input() card: TaskCardDto = new TaskCardDto();
  accountInfo: any;

  isEditingTitle = false;
  editTitle = '';
  isEditingDesc = false;
  editDesc = '';

  newChecklistTitle = '';
  isAddingChecklist = false;
  addingItemChecklistId = '';
  newItemContent = '';

  newComment = '';

  isLabelPopoverVisible = false;

  isMemberPopoverVisible = false;

  priorityList = PRIORITY_LIST;
  isPriorityVisible = false;

  isDueDateVisible = false;
  selectedDateRange: Date[] = [];

  labelColors = LABEL_COLORS;
  newLabelName = '';
  newLabelColor = '#61BD4F';
  boardId: string = '';
  dataListTaskLabel: TaskLabelDto[] = [];
  dataListAccount: AccountDto[] = [];

  isUploadVisible = false;
  uploadFileList: NzUploadFile[] = [];

  constructor(
    private taskService: TaskService,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private accountService: AccountService,
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if(params['id']){
        this.boardId = params['id'];
        this.getDataTaskLabel(params['id']);
      }
    });
    // if (this.cardId) this.loadCard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['cardId'] && this.cardId) {
    //   this.loadCard();
    // }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCard(): void {
    this.taskService.getCardDetail(this.cardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.card = data || new TaskCardDto();
          if (!this.card.labels) this.card.labels = [];
          if (!this.card.members) this.card.members = [];
          if (!this.card.checklists) this.card.checklists = [];
          if (!this.card.comments) this.card.comments = [];
          this.selectedDateRange = [];
          if (this.card.startDate && this.card.dueDate) {
            this.selectedDateRange = [new Date(this.card.startDate), new Date(this.card.dueDate)];
          } else if (this.card.dueDate) {
            this.selectedDateRange = [new Date(this.card.dueDate), new Date(this.card.dueDate)];
          }
        },
      });
  }

  close(): void {
    this.closed.emit(this.card);
  }

  startEditTitle(): void {
    this.editTitle = this.card.title;
    this.isEditingTitle = true;
  }

  saveTitle(): void {
    if (!this.editTitle.trim() || this.editTitle === this.card.title) {
      this.isEditingTitle = false;
      return;
    }
    this.taskService.updateCard(this.card.id, { ...this.card, title: this.editTitle.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) {
          this.card.title = this.editTitle.trim();
        }
        this.isEditingTitle = false;
      });
  }

  startEditDesc(): void {
    this.editDesc = this.card.description || '';
    this.isEditingDesc = true;
  }

  saveDesc(): void {
    this.taskService.updateCard(this.card.id, { ...this.card, description: this.editDesc })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) {
          this.card.description = this.editDesc;
        }
        this.isEditingDesc = false;
      });
  }

  setPriority(priority: number): void {
    const prev = this.card.priority;
    this.card.priority = this.card.priority === priority ? undefined : priority;
    this.isPriorityVisible = false;
    this.taskService.updateCard(this.card.id, { ...this.card })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status === false) this.card.priority = prev;
      });
  }

  onDateRangeChange(dates: Date[]): void {
    this.selectedDateRange = dates;
    if (dates && dates.length === 2) {
      this.card.startDate = dates[0].toISOString();
      this.card.dueDate = dates[1].toISOString();
    } else {
      this.card.startDate = undefined;
      this.card.dueDate = undefined;
    }
    this.taskService.updateCard(this.card.id, { ...this.card })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    // Do not auto-close on range change as it takes two clicks usually, but ng-zorro might close it.
  }

  removeDateRange(): void {
    this.selectedDateRange = [];
    this.card.startDate = undefined;
    this.card.dueDate = undefined;
    this.taskService.updateCard(this.card.id, { ...this.card })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  isLabelActive(label: TaskLabelDto): boolean {
    return (this.card.labels || []).some(cl => 
      cl.taskCardLabelId 
      ? cl.id === label.id 
      : cl.labelId === label.id
    );
  }

  toggleLabel(label: TaskLabelDto): void {
    const existing = (this.card.labels || []).find(cl => cl.taskCardLabelId 
      ? cl.id === label.id 
      : cl.labelId === label.id
    );
    if (existing) {
      if(existing.taskCardLabelId){
        this.taskService.removeLabelFromCard(existing.taskCardLabelId)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.card.labels = (this.card.labels || []).filter(cl => cl.id !== label.id);
          });
      }else{
        this.taskService.removeLabelFromCard(existing.labelId)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.card.labels = (this.card.labels || []).filter(cl => cl.labelId !== label.id);
          });
      }
    } else {
      this.taskService.addLabelToCard({ cardId: this.card.id, labelId: label.id })
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          var newCardLabel: TaskCardLabelDto = {
            id: StringUtils.generateUUID(),
            cardId: this.card.id,
            labelId: label.id,
            name: label.name,
            color: label.color,
          };
          this.card.labels = [...(this.card.labels || []), newCardLabel];
        });
    }
  }

  createLabel(): void {
    if (!this.newLabelName.trim()) return;
    this.taskService.createLabel({
      boardId: this.boardId ?? '',
      name: this.newLabelName.trim(),
      color: this.newLabelColor,
    }).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res?.data) {
        // this.boardLabels = [...this.boardLabels, res.data];
        this.dataListTaskLabel = [...(this.dataListTaskLabel || []), res.data];
        this.newLabelName = '';
      }
    });
  }

  // isMemberActive(member: TaskBoardMemberDto): boolean {
  //   return (this.card.members || []).some(cm => cm.userId === member.userId);
  // }

  isMemberActive(member: any): boolean {
    return (this.card.members || []).some(cm => cm.userId === member.userName);
  }

  // toggleMember(member: TaskBoardMemberDto): void {
  toggleMember(member: any): void {
    const existing = (this.card.members || []).find(cm => cm.userId === member.userName);
    if (existing) {
      this.taskService.removeCardMember(existing.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.card.members = (this.card.members || []).filter(cm => cm.userId !== member.userName);
        });
    } else {
      this.taskService.addCardMember({ cardId: this.card.id, userId: member.userName })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: any) => {
          const newMember: TaskCardMemberDto = {
            id: res.id ?? StringUtils.generateUUID(),
            cardId: this.card.id,
            userId: member.userName,
            fullName: member.fullName,
          };
          this.card.members = [...(this.card.members || []), newMember];
        });
    }
  }

  addChecklist(): void {
    if (!this.newChecklistTitle.trim()) return;
    this.taskService.createChecklist({ cardId: this.card.id, title: this.newChecklistTitle.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.data) {
          const cl: TaskChecklistDto = { ...res.data, items: [] };
          this.card.checklists = [...(this.card.checklists || []), cl];
          this.newChecklistTitle = '';
          this.isAddingChecklist = false;
        }
      });
  }

  deleteChecklist(checklist: TaskChecklistDto): void {
    this.taskService.deleteChecklist(checklist.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.card.checklists = (this.card.checklists || []).filter(cl => cl.id !== checklist.id);
      });
  }

  startAddItem(checklistId: string): void {
    this.addingItemChecklistId = checklistId;
    this.newItemContent = '';
  }

  cancelAddItem(): void {
    this.addingItemChecklistId = '';
    this.newItemContent = '';
  }

  addItem(checklist: TaskChecklistDto): void {
    if (!this.newItemContent.trim()) return;
    this.taskService.createChecklistItem({ checklistId: checklist.id, content: this.newItemContent.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.data) {
          if (!checklist.items) checklist.items = [];
          checklist.items = [...checklist.items, res.data];
          this.cancelAddItem();
        }
      });
  }

  toggleItem(item: TaskChecklistItemDto): void {
    const newDone = !item.isDone;
    this.taskService.updateChecklistItem(item.id, { ...item, isDone: newDone })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) item.isDone = newDone;
      });
  }

  deleteItem(checklist: TaskChecklistDto, item: TaskChecklistItemDto): void {
    this.taskService.deleteChecklistItem(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        checklist.items = (checklist.items || []).filter(i => i.id !== item.id);
      });
  }

  getChecklistProgress(checklist: TaskChecklistDto): number {
    const items = checklist.items || [];
    if (!items.length) return 0;
    return Math.round((items.filter(i => i.isDone).length / items.length) * 100);
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.taskService.addComment({ cardId: this.card.id, content: this.newComment.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.data) {
          const comment: TaskCommentDto = {
            ...res.data,
            fullName: this.accountInfo?.fullName,
          };
          this.card.comments = [comment, ...(this.card.comments || [])];
          this.newComment = '';
        }
      });
  }

  deleteComment(comment: TaskCommentDto): void {
    this.taskService.deleteComment(comment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.card.comments = (this.card.comments || []).filter(c => c.id !== comment.id);
      });
  }

  archiveCard(): void {
    const newArchived = !this.card.isArchived;
    this.taskService.updateCard(this.card.id, { ...this.card, isArchived: newArchived })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.status !== false) {
          this.card.isArchived = newArchived;
          this.message.success(newArchived ? 'Đã lưu trữ thẻ!' : 'Đã khôi phục thẻ!');
        }
      });
  }

  deleteCard(): void {
    this.taskService.deleteCard(this.card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.message.success('Đã xóa thẻ!');
        this.cardDeleted.emit(this.card.id);
      });
  }

  getPriorityColor(priority?: number): string {
    return this.priorityList.find(p => p.value === priority)?.color || '#bbb';
  }

  getPriorityLabel(priority?: number): string {
    return this.priorityList.find(p => p.value === priority)?.label || 'Chọn ưu tiên';
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  formatDateTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  onKeydownComment(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.submitComment();
    }
  }

  onKeydownAddChecklist(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.addChecklist();
    }
  }

  onKeydownAddItem(event: KeyboardEvent, checklist: TaskChecklistDto): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.addItem(checklist);
    }
  }

  onLoadAccountAllSystem(): void{
    this.getDataListAccount();
  }

  getRemainingMembersTooltip(members: TaskCardMemberDto[]): string {
    if (!members || members.length <= 3) return '';

    return members
      .slice(3)
      .map(m => m.fullName || m.userId)
      .join(', ');
  }

  showUploadModal(): void {
    this.uploadFileList = [];
    this.isUploadVisible = true;
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.uploadFileList = [...this.uploadFileList, file];
    return false;
  };

  onUploadChange(info: any): void {
    this.uploadFileList = info.fileList;
  }

  confirmUpload(): void {
      const files = this.uploadFileList
        .map(f => (f.originFileObj || f) as File)
        .filter(f => !!f);
  
      if (files.length === 0) {
        this.message.warning('Vui lòng chọn tệp để tải lên');
        return;
      }
  
      this.taskService.uploadFilesCard(files, this.cardId)
      .subscribe({
        next: (res: any) => {
          this.isUploadVisible = false;
          let dataMerge = this.uploadFileList.map((item) => {
            return {
              fileName: item.name,
              fileSize: item.size
            }
          }) ?? [];
          this.card.files = [...(this.card.files || []), ...dataMerge];
          this.uploadFileList = [];
          this.message.success(`Đã tải lên ${files.length} tệp`);
          
        },
        error: () => {
          this.message.error('Tải lên thất bại!');
        },
      });
    }

  formatFileSizeToMb(fileSize: number): string {
    if (!fileSize) return '0 MB';

    const sizeMb = fileSize / 1024 / 1024 ;
    return sizeMb.toFixed(2) + ' MB';
  }

  removeFile(file: any): void {
    this.taskService.deleteFile(file.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        if(this.card && this.card.files) {
          this.card.files = this.card.files.filter(f => f.id !== file.id);
        }
      },
      error: () => {
        this.message.error('Xóa tệp thất bại!');
      }
    });
  }

  private getDataTaskLabel(boardId: string): void{
    this.taskService.getDataTaskLabelFollowBoard(boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.dataListTaskLabel = data || [];
        },
      });
  }

  private getDataListAccount(): void{
    const filter = new AccountDto();
    filter.pageSize = 1000;
    this.accountService.search(filter)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.dataListAccount = res.data || [];
      },
    });
  }
}
