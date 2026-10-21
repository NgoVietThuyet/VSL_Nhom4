import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskService } from '../../services';
import {
  TaskWorkspaceDto,
  TaskBoardDto,
  BOARD_BACKGROUNDS
} from '../../models';
import { LocalStorageUtils } from '../../../../shared/utils';
import { BACKGROUND_COLOR_DEFAULT } from '../../../../shared/utils/const';

@Component({
  selector: 'app-task-home',
  imports: [SharedModules],
  templateUrl: './task-home.html',
  styleUrl: './task-home.scss',
})
export class TaskHome implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  workspaces: TaskWorkspaceDto[] = [];
  selectedWorkspace: TaskWorkspaceDto | null = null;
  boards: TaskBoardDto[] = [];
  accountInfo: any;

  isWorkspaceModalVisible = false;
  isEditWorkspace = false;
  workspaceForm: TaskWorkspaceDto = new TaskWorkspaceDto();

  isBoardModalVisible = false;
  isEditBoard = false;
  boardForm: TaskBoardDto = new TaskBoardDto();
  boardBackgrounds = BOARD_BACKGROUNDS;
  selectedBackground = '#0079BF';
  workspaceIdFromQuery: string = "";
  BACKGROUND_COLOR_DEFAULT: string = BACKGROUND_COLOR_DEFAULT;

  // Trello integration
  trelloAccounts: any[] = [];
  isTrelloConnecting = false;
  isTrelloSyncing = false;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private message: NzMessageService,
    private route: ActivatedRoute
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.workspaceIdFromQuery = this.route.snapshot.queryParams['workspaceId'] ?? null;
    this.loadWorkspaces();
    this.loadAllIntegrations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectedProvider: string = '';
  providerOptions = [
    { label: 'Hệ thống (Nội bộ)', value: '' },
    { label: 'Trello', value: 'Trello' },
    { label: 'Asana', value: 'Asana' },
    { label: 'Jira', value: 'Jira' },
    { label: 'Monday', value: 'Monday' },
    { label: 'ClickUp', value: 'ClickUp' },
    { label: 'MsProject', value: 'MsProject' }
  ];

  get filteredWorkspaces(): TaskWorkspaceDto[] {
    if (!this.selectedProvider) {
      // Nội bộ: id thường là guid, không chứa '_'
      return this.workspaces.filter(w => !w.id.includes('_'));
    }
    const prefix = this.selectedProvider.toLowerCase() + '_';
    return this.workspaces.filter(w => w.id.startsWith(prefix));
  }

  onProviderChange(provider: string): void {
    const wss = this.filteredWorkspaces;
    if (wss.length > 0) {
      this.selectWorkspace(wss[0]);
    } else {
      this.selectedWorkspace = null;
      this.boards = [];
    }
  }

  loadWorkspaces(): void {
    this.taskService.getWorkspaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.workspaces = data || [];

        if (this.workspaces.length === 0) return;

        if (this.workspaceIdFromQuery) {
          const ws = this.workspaces.find(w => w.id === this.workspaceIdFromQuery);
          if (ws) {
            // Find which provider it belongs to
            if (ws.id.includes('_')) {
              const p = ws.id.split('_')[0];
              const matchedProvider = this.supportedProviders.find(sp => sp.toLowerCase() === p);
              if (matchedProvider) {
                this.selectedProvider = matchedProvider;
              }
            } else {
              this.selectedProvider = '';
            }
            this.selectWorkspace(ws);
            return;
          }
        }

        const filtered = this.filteredWorkspaces;
        if (filtered.length > 0 && !this.selectedWorkspace) {
          this.selectWorkspace(filtered[0]);
        }
      });
  }

  selectWorkspace(ws: TaskWorkspaceDto): void {
    this.selectedWorkspace = ws;
    this.loadBoards(ws.id);
  }

  loadBoards(workspaceId: string): void {
    this.taskService.getBoards(workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.boards = data || [];
      });
  }

  openBoard(board: TaskBoardDto): void {
    this.router.navigate(['/task/board', board.id], {
      queryParams: { workspaceId: board.workspaceId }
    });
  }

  openCreateWorkspace(): void {
    this.isEditWorkspace = false;
    this.workspaceForm = new TaskWorkspaceDto();
    this.isWorkspaceModalVisible = true;
  }

  openEditWorkspace(ws: TaskWorkspaceDto, event: Event): void {
    event.stopPropagation();
    this.isEditWorkspace = true;
    this.workspaceForm = { ...ws };
    this.isWorkspaceModalVisible = true;
  }

  saveWorkspace(): void {
    if (!this.workspaceForm.name?.trim()) {
      this.message.warning('Vui lòng nhập tên workspace!');
      return;
    }

    const call = this.isEditWorkspace
      ? this.taskService.updateWorkspace(this.workspaceForm.id, this.workspaceForm)
      : this.taskService.createWorkspace(this.workspaceForm);

    call.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res?.status !== false) {
        this.isWorkspaceModalVisible = false;
        this.loadWorkspaces();
        this.message.success(this.isEditWorkspace ? 'Cập nhật workspace thành công!' : 'Tạo workspace thành công!');
      }
    });
  }

  deleteWorkspace(ws: TaskWorkspaceDto, event: Event): void {
    event.stopPropagation();
    this.deleteWorkspaceById(ws.id);
  }

  deleteWorkspaceById(id: string): void {
    this.taskService.deleteWorkspace(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.selectedWorkspace?.id === id) {
          this.selectedWorkspace = null;
          this.boards = [];
        }
        this.loadWorkspaces();
        this.message.success('Đã xóa workspace!');
      });
  }

  openCreateBoard(): void {
    if (!this.selectedWorkspace) {
      this.message.warning('Vui lòng chọn workspace trước!');
      return;
    }
    this.isEditBoard = false;
    this.boardForm = new TaskBoardDto();
    this.boardForm.workspaceId = this.selectedWorkspace.id;
    this.selectedBackground = BOARD_BACKGROUNDS[0];
    this.boardForm.backgroundColor = this.selectedBackground;
    this.isBoardModalVisible = true;
  }

  openEditBoard(board: TaskBoardDto, event: Event): void {
    event.stopPropagation();
    this.isEditBoard = true;
    this.boardForm = { ...board };
    this.selectedBackground = board.backgroundColor || BOARD_BACKGROUNDS[0];
    this.isBoardModalVisible = true;
  }

  selectBackground(color: string): void {
    this.selectedBackground = color;
    this.boardForm.backgroundColor = color;
  }

  onCustomColorChange(event: any): void {
    const color = event.target.value;
    if (color) {
      this.selectedBackground = color;
      this.boardForm.backgroundColor = color;
    }
  }

  saveBoard(): void {
    if (!this.boardForm.name?.trim()) {
      this.message.warning('Vui lòng nhập tên bảng!');
      return;
    }
    this.boardForm.backgroundColor = this.selectedBackground;

    const call = this.isEditBoard
      ? this.taskService.updateBoard(this.boardForm.id, this.boardForm)
      : this.taskService.createBoard(this.boardForm);

    call.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res?.status !== false) {
        this.isBoardModalVisible = false;
        if (this.selectedWorkspace) this.loadBoards(this.selectedWorkspace.id);
        this.message.success(this.isEditBoard ? 'Cập nhật bảng thành công!' : 'Tạo bảng thành công!');
      }
    });
  }

  deleteBoard(board: TaskBoardDto, event: Event): void {
    event.stopPropagation();
    this.deleteBoardById(board);
  }

  deleteBoardById(board: TaskBoardDto): void {
    this.taskService.deleteBoard(board.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.selectedWorkspace) this.loadBoards(this.selectedWorkspace.id);
        this.message.success('Đã xóa board ' + board.name);
      });
  }

  getBoardBackground(board: TaskBoardDto): string {
    if (board.backgroundColor) return board.backgroundColor;
    const idx = (board.id || 'x').charCodeAt(0) % BOARD_BACKGROUNDS.length;
    return BOARD_BACKGROUNDS[idx];
  }

  getWorkspaceColor(name?: string): string {
    const colors = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91', '#4BBF6B', '#00AECC'];
    if (!name) return colors[0];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  getAvatarText(name?: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      : parts[0].charAt(0).toUpperCase();
  }

  getCurrentUserName(): string {
    return this.accountInfo?.userName || '';
  }

  isWorkspaceOwner(ws: TaskWorkspaceDto | null): boolean {
    if (!ws) return false;
    return ws.ownerId === this.getCurrentUserName();
  }

  // ─────────────────────────── Task Integration ───────────────────────────

  supportedProviders = ['Trello', 'Asana', 'Jira', 'Monday', 'ClickUp', 'MsProject'];
  integrationAccounts: { [provider: string]: any[] } = {};
  isIntegrationConnecting: { [provider: string]: boolean } = {};
  isIntegrationSyncing: { [provider: string]: boolean } = {};

  getIntegrationAccounts(provider: string): any[] {
    return this.integrationAccounts[provider] || [];
  }

  loadAllIntegrations(): void {
    for (const provider of this.supportedProviders) {
      this.loadIntegrationAccounts(provider);
    }
  }

  loadIntegrationAccounts(provider: string): void {
    this.taskService.getIntegrationAccounts(provider)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.integrationAccounts = {
          ...this.integrationAccounts,
          [provider]: Array.isArray(res) ? res : (res?.data || [])
        };
      });
  }

  async connectIntegration(provider: string): Promise<void> {
    if (provider === 'MsProject') {
      this.message.info('Chức năng đang được phát triển, vui lòng quay lại sau!');
      return;
    }

    this.isIntegrationConnecting[provider] = true;
    try {
      const success = await this.taskService.connectIntegration(provider);
      if (success) {
        this.message.success(`Kết nối ${provider} thành công!`);
        this.loadIntegrationAccounts(provider);
        this.loadWorkspaces();
      } else {
        this.message.error(`Kết nối ${provider} thất bại!`);
      }
    } finally {
      this.isIntegrationConnecting[provider] = false;
    }
  }

  disconnectIntegration(provider: string, account: any): void {
    this.taskService.deleteIntegrationAccount(provider, account.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.message.success(`Đã ngắt kết nối ${provider}`);
        window.location.reload();
      });
  }

  syncIntegration(provider: string): void {
    if (provider === 'MsProject') {
      this.message.info('Chức năng đang được phát triển, vui lòng quay lại sau!');
      return;
    }

    this.isIntegrationSyncing[provider] = true;
    this.taskService.syncIntegrationNow(provider)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.isIntegrationSyncing[provider] = false;
        if (res?.status !== false) {
          this.message.success(`Đồng bộ ${provider} thành công!`);
          this.loadWorkspaces();
        } else {
          this.message.error(`Đồng bộ ${provider} thất bại!`);
        }
      }, () => { this.isIntegrationSyncing[provider] = false; });
  }
}
