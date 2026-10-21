import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar';
import { ExplorerService } from '../../services/explorer.service';
import { ExplorerItem } from '../../models/explorer.model';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { EnvironmentService, LoadingService } from '../../../../core';
import { LocalStorageUtils } from '../../../../shared/utils';
import {
  UPLOAD_MAX_BYTES,
  validateClientFile,
} from '../../../../shared/utils/file-upload-guard';
import {
  NzContextMenuService,
  NzDropdownMenuComponent,
} from 'ng-zorro-antd/dropdown';
import { ViewModeService } from '../../../../shared/services/view-mode.service';
import { WindowManagerService } from '../../../../shared/services/window-manager.service';
import { SignalRService } from '../../../../shared/services/signalr.service';
import { FileService } from '../../../../shared/services/file.service';
import { HttpClient } from '@angular/common/http';
import { buildOnlyOfficeDocumentUrl } from '../../../../shared/utils/onlyoffice-helper';

export interface FileItem {
  id: string;
  name: string;
  type:
    | 'folder'
    | 'image'
    | 'pdf'
    | 'docx'
    | 'xlsx'
    | 'pptx'
    | 'zip'
    | 'txt'
    | string;
  size?: string;
  sizeBytes?: number;
  modifiedDate: Date;
  createdDate: Date;
  viewDate?: Date;
  owner: string;
  shared: boolean;
  favorite: boolean;
  color?: string;
  tag?: string;
  childCount?: number;
  hasChildFolder?: boolean;
  checked?: boolean;
  isDragOver?: boolean;
}

export interface QuickAccessItem {
  key: string;
  label: string;
  icon: string;
  color: string;
  count?: number;
}

export interface ColorTag {
  id: string;
  label: string;
  color: string;
}

export interface SharedPerson {
  id?: string;
  name: string;
  email: string;
  userName?: string;
  avatarFileId?: string | null;
  role: 'view' | 'edit' | 'admin' | string;
  status?: string;
}

@Component({
  selector: 'app-personal',
  imports: [SharedModules, UserAvatarComponent],
  templateUrl: './personal.html',
  styleUrl: './personal.scss',
})
export class Personal implements OnInit, OnDestroy {
  @ViewChild('itemMenuList') itemMenuList!: NzDropdownMenuComponent;

  shareLinkRole: 'view' | 'edit' = 'view';

  isSelecting = false;
  startX = 0;
  startY = 0;

  isDragOverlayVisible = false;
  dragCounter = 0;
  selectionBoxStyle = { left: '0px', top: '0px', width: '0px', height: '0px' };
  preSelection: FileItem[] = [];

  clipboardItems: FileItem[] = [];
  clipboardAction: 'copy' | 'cut' = 'copy';
  draggedItems: FileItem[] = [];

  viewMode: 'grid' | 'list' | 'detail' = 'grid';
  sidebarCollapsed = false;

  currentPath: string[] = [];
  currentPathIds: (string | null)[] = [];
  history: { names: string[]; ids: (string | null)[] }[] = [];
  historyIndex = -1;

  isAddTagVisible = false;
  newTagName = '';
  newTagColor = '#1890ff';

  presetColors = [
    '#f5222d',
    '#fa541c',
    '#fa8c16',
    '#faad14',
    '#fadb14',
    '#a0d911',
    '#52c41a',
    '#13c2c2',
    '#1890ff',
    '#2f54eb',
    '#722ed1',
    '#eb2f96',
  ];

  get currentFolderId(): string | null {
    return this.currentPathIds.length > 0
      ? this.currentPathIds[this.currentPathIds.length - 1]
      : null;
  }

  get canGoBack(): boolean {
    return this.historyIndex > 0;
  }
  get canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  searchText = '';
  sortBy: 'name' | 'date' | 'size' | 'type' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  activeFilters: string[] = ['folder', 'file'];

  changeMode: 'view' | 'edit' = 'view';

  allItems: FileItem[] = [];
  filteredItems: FileItem[] = [];
  pagedItems: FileItem[] = [];
  selectedItems: FileItem[] = [];
  allSelected = false;

  currentPage = 1;
  pageSize = 50;
  totalRecord = 0;

  contextItem: FileItem | null = null;
  previewItem: FileItem | null = null;
  contentMenuVisible = false;
  contentMenuX = 0;
  contentMenuY = 0;

  activeSidebarItem = 'all';
  expandedKeys: string[] = ['root'];
  selectedKeys: string[] = [];

  quickAccess: QuickAccessItem[] = [
    { key: 'all', label: 'Tất cả tệp', icon: 'folder', color: '#1890ff' },
    { key: 'recent', label: 'Gần đây', icon: 'clock-circle', color: '#fa8c16' },
    { key: 'favorite', label: 'Yêu thích', icon: 'star', color: '#faad14' },
    {
      key: 'shared',
      label: 'Được chia sẻ',
      icon: 'share-alt',
      color: '#52c41a',
    },
    {
      key: 'invitations',
      label: 'Lời mời chia sẻ',
      icon: 'mail',
      color: '#13c2c2',
    },
    { key: 'trash', label: 'Thùng rác', icon: 'delete', color: '#f5222d' },
  ];

  colorTags: ColorTag[] = [];
  currentTagId: string | null = null;

  get currentTagName(): string | null {
    if (!this.currentTagId) return null;
    return (
      this.colorTags.find((t) => t.id === this.currentTagId)?.label || null
    );
  }

  folderTreeData: any[] = [
    {
      title: 'Tài liệu của tôi',
      key: 'root',
      icon: 'home',
      expanded: true,
      children: [],
    },
  ];

  storagePercent = 0;
  storageUsed = '0 B';
  storageTotal = '∞';

  isUploadVisible = false;
  uploadFileList: NzUploadFile[] = [];

  isNewFolderVisible = false;
  newFolderName = '';

  isRenameVisible = false;
  renameValue = '';
  renameTargetItem: FileItem | null = null;

  isShareVisible = false;
  shareTargetItem: FileItem | null = null;
  shareEmail = '';
  sharedWith: SharedPerson[] = [];
  shareLinkEnabled = false;
  shareLinkLoading = false;
  shareLink = '';

  // Share user search
  shareSearchResults: any[] = [];
  shareSearchLoading = false;
  shareSearchVisible = false;
  private shareSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  isViewFileVisible = false;
  currentViewFile: FileItem | null = null;
  viewFileType: 'onlyoffice' | 'image' | 'video' = 'onlyoffice';
  filePreviewUrl: SafeResourceUrl | null = null;
  mediaUrl: SafeUrl | null = null;
  idTabActive = '';

  isActivityVisible = false;
  activityLoading = false;
  activityKeyword = '';
  activityItems: any[] = [];
  activityPageIndex = 1;
  activityPageSize = 10;
  activityTotal = 0;

  pendingShares: any[] = [];
  isPendingSharesVisible = false;

  // Address bar search
  isAddressEditing = false;
  addressInputText = '';
  @ViewChild('addressInput') addressInput?: ElementRef<HTMLInputElement>;

  constructor(
    private message: NzMessageService,
    private modalService: NzModalService,
    private explorerService: ExplorerService,
    private loadingService: LoadingService,
    private sanitizer: DomSanitizer,
    private env: EnvironmentService,
    private nzContextMenuService: NzContextMenuService,
    private viewModeService: ViewModeService,
    private windowManager: WindowManagerService,
    private signalR: SignalRService,
    private route: ActivatedRoute,
    private router: Router,
    private fileService: FileService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.pushHistory();

    const itemIdParam = this.route.snapshot.queryParamMap.get('itemId');
    if (itemIdParam && itemIdParam.trim()) {
      this.navigateToItemId(itemIdParam);
    } else {
      this.loadItems();
    }

    this.loadTags();
    this.loadPendingShares();
    this.bindExplorerRealtime();

    this.shareSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword) => {
          if (!keyword.trim()) {
            return of(null);
          }
          this.shareSearchLoading = true;
          return this.explorerService.searchUsers(keyword).pipe(
            catchError(() => {
              this.shareSearchLoading = false;
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res === null) {
          this.shareSearchResults = [];
          this.shareSearchVisible = false;
          this.shareSearchLoading = false;
          return;
        }

        let list: any[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        }

        const currentInfo = LocalStorageUtils.getItem('accountInfo') || {};
        const currentUserName = currentInfo.userName;
        const alreadyShared = (this.sharedWith || []).map((p) =>
          (p.email || '').toLowerCase(),
        );

        this.shareSearchResults = list.filter(
          (u) =>
            u &&
            u.userName &&
            u.userName !== currentUserName &&
            !alreadyShared.includes(u.userName.toLowerCase()),
        );

        this.shareSearchVisible = this.shareSearchResults.length > 0;
        this.shareSearchLoading = false;
      });
  }

  navigateToItemId(itemId: string): void {
    forkJoin({
      item: this.explorerService.getItem(itemId),
      ancestors: this.explorerService.getAncestors(itemId),
    }).subscribe({
      next: (res: any) => {
        const folder = res.item?.data ?? res.item;
        const ancestors = res.ancestors?.data ?? res.ancestors;

        if (folder) {
          this.currentPath = [
            ...ancestors.map((a: any) => a.name),
            folder.name,
          ];
          this.currentPathIds = [...ancestors.map((a: any) => a.id), folder.id];

          this.pushHistory();
          this.loadItems();
        } else {
          this.message.error('Không tìm thấy thư mục yêu cầu');
          this.navigateToRoot();
        }
      },
      error: () => this.navigateToRoot(),
    });
  }

  hideShareSearchWithDelay(): void {
    setTimeout(() => {
      this.shareSearchVisible = false;
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindExplorerRealtime(): void {
    this.signalR.explorerEvent$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadItems();
      this.loadTags();
      this.loadPendingShares();
    });
  }

  private syncUrlPath(): void {
    const itemId = this.currentFolderId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { itemId: itemId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadItems(): void {
    let obs$;
    switch (this.activeSidebarItem) {
      case 'favorite':
        obs$ = this.explorerService.getFavorites(null);
        break;
      case 'recent':
        obs$ = this.explorerService.getRecent(
          this.currentPage,
          this.pageSize,
          null,
        );
        break;
      case 'shared':
        obs$ = this.explorerService.getShared();
        break;
      case 'trash':
        obs$ = this.explorerService.getTrash();
        break;
      case 'invitations':
        obs$ = this.explorerService.getPendingShares();
        break;
      default:
        if (this.currentFolderId) {
          if (this.searchText.trim()) {
            obs$ = this.explorerService.searchItems(
              this.searchText.trim(),
              this.currentFolderId,
            );
          } else {
            obs$ = this.explorerService.getItems(this.currentFolderId);
          }
        } else {
          if (this.searchText.trim()) {
            obs$ = this.explorerService.searchItems(
              this.searchText.trim(),
              null,
            );
          } else {
            obs$ = this.explorerService.getItems(null);
          }
        }
        break;
    }

    obs$.subscribe({
      next: (res: any) => {
        let _data = [];
        let isBackendPaginated = false;
        if (Array.isArray(res)) {
          _data = res;
        } else if (res && Array.isArray(res.data)) {
          _data = res.data;
          isBackendPaginated = true;
          this.totalRecord = res.totalRecord || 0;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          _data = res.data.data;
          isBackendPaginated = true;
          this.totalRecord = res.data.totalRecord || 0;
        }

        const items: ExplorerItem[] = _data;
        this.allItems = items.map((i) => this.mapToFileItem(i));
        this.updateFolderTree();

        if (isBackendPaginated) {
          this.filteredItems = this.doSort(this.allItems);
          this.pagedItems = this.filteredItems;
          this.updateSelectAll();
        } else {
          this.applyFilter();
        }
      },
    });
  }

  private loadTags(): void {
    this.explorerService.getTags().subscribe({
      next: (data: any) => {
        const tags: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        this.colorTags = tags.map((t) => ({
          id: t.id,
          label: t.name || '',
          color: t.color || 'blue',
        }));
      },
    });
  }

  private updateFolderTree(): void {
    const currentFolders = this.allItems
      .filter((i) => i.type === 'folder')
      .map((f) => ({
        title: f.name,
        key: f.id,
        icon: 'folder',
        isLeaf: !f.hasChildFolder,
        children: [],
        isExpanded: false,
      }));

    if (!this.currentFolderId) {
      this.folderTreeData[0].children = this.mergeNodes(
        this.folderTreeData[0].children,
        currentFolders,
      );
    } else {
      const findAndUpdate = (nodes: any[]): boolean => {
        for (const node of nodes) {
          if (node.key === this.currentFolderId) {
            node.children = this.mergeNodes(
              node.children || [],
              currentFolders,
            );
            node.isLeaf = node.children.length === 0;
            return true;
          }
          if (node.children && findAndUpdate(node.children)) {
            return true;
          }
        }
        return false;
      };
      findAndUpdate(this.folderTreeData);
    }

    this.folderTreeData = [...this.folderTreeData];
  }

  private mergeNodes(oldNodes: any[], newNodes: any[]): any[] {
    const oldMap = new Map((oldNodes || []).map((n) => [n.key, n]));
    return newNodes.map((newNode) => {
      const oldNode = oldMap.get(newNode.key);
      if (oldNode) {
        newNode.children = oldNode.children;
        newNode.isExpanded = oldNode.isExpanded;
      }
      return newNode;
    });
  }

  private mapToFileItem(dto: any): FileItem {
    return {
      id: dto.id,
      name: dto.name,
      type: dto.isFolder ? 'folder' : dto.type || 'file',
      size: dto.sizeText ?? undefined,
      sizeBytes: dto.size ?? undefined,
      modifiedDate: dto.updateDate
        ? new Date(dto.updateDate as string)
        : dto.createDate
          ? new Date(dto.createDate as string)
          : new Date(),
      createdDate: dto.createDate
        ? new Date(dto.createDate as string)
        : new Date(),
      viewDate: dto.viewDate ? new Date(dto.viewDate as string) : undefined,
      owner: dto.ownerId || 'Tôi',
      shared: dto.isShared === true,
      favorite: dto.isFavorite === true,
      color: dto.color ?? undefined,
      tag: dto.tagId ?? undefined,
      childCount: dto.childCount ?? 0,
      hasChildFolder: dto.hasChildFolder,
      checked: false,
    };
  }

  applyFilter(): void {
    let items = [...this.allItems];

    if (this.activeFilters.length > 0 && this.activeFilters.length < 2) {
      if (this.activeFilters.includes('folder')) {
        items = items.filter((i) => i.type === 'folder');
      } else if (this.activeFilters.includes('file')) {
        items = items.filter((i) => i.type !== 'folder');
      }
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (this.currentTagId) {
      items = items.filter((i) => i.tag === this.currentTagId);
    }

    if (this.activeSidebarItem === 'recent') {
      this.filteredItems = items.sort((a, b) => {
        const timeA = a.viewDate ? a.viewDate.getTime() : 0;
        const timeB = b.viewDate ? b.viewDate.getTime() : 0;
        return timeB - timeA;
      });
    } else {
      this.filteredItems = this.doSort(items);
    }

    this.totalRecord = this.filteredItems.length;
    this.currentPage = 1;
    this.updatePagedItems();
  }

  pageIndexChange(e: number) {
    this.currentPage = e;
    this.updatePagedItems();
  }

  pageSizeChange(e: number) {
    this.pageSize = e;
    this.currentPage = 1;
    this.updatePagedItems();
  }

  updatePagedItems() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedItems = this.filteredItems.slice(
      startIndex,
      startIndex + this.pageSize,
    );
    this.updateSelectAll();
  }

  private doSort(items: FileItem[]): FileItem[] {
    return [...items].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      let cmp = 0;
      switch (this.sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'vi');
          break;
        case 'date':
          cmp = a.modifiedDate.getTime() - b.modifiedDate.getTime();
          break;
        case 'size':
          cmp = (a.sizeBytes || 0) - (b.sizeBytes || 0);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
      }
      return this.sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  sortItems(): void {
    this.applyFilter();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  onSearch(): void {
    if (
      this.activeSidebarItem !== 'favorite' &&
      this.activeSidebarItem !== 'shared' &&
      this.activeSidebarItem !== 'trash'
    ) {
      this.loadItems();
    } else {
      this.applyFilter();
    }
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.onSearch();
    }
  }

  // === Address Bar – điều hướng theo đường dẫn ===
  activateAddressSearch(): void {
    const pathParts = ['Tài liệu của tôi', ...this.currentPath];
    this.addressInputText = pathParts.join(' / ');
    this.isAddressEditing = true;
    // Chọn toàn bộ text để dễ xoá và nhập lại
    setTimeout(() => {
      const el = this.addressInput?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  onAddressInput(): void {
    this.isAddressEditing = false;
    const raw = this.addressInputText.trim();
    if (!raw) return;

    // Parse path: tách bởi '/' hoặc '>' rồi bỏ root
    const ROOT = 'tài liệu của tôi';
    const segments = raw
      .split(/[/>]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Bỏ segment đầu nếu là root
    const pathSegments =
      segments[0]?.toLowerCase() === ROOT ? segments.slice(1) : segments;

    if (pathSegments.length === 0) {
      // Chỉ nhập root → về gốc
      this.navigateToRoot();
      return;
    }

    this.navigateToPath(pathSegments);
  }

  onKeydownAddress(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.onAddressInput();
    }
  }

  /**
   * Điều hướng đến đường dẫn bằng cách gọi API từng cấp:
   * - Lần lượt getItems(parentId) rồi tìm folder khớp tên
   * - Nếu thành công: cập nhật currentPath + currentPathIds
   * - Nếu không tìm thấy: thông báo lỗi
   */
  private navigateToPath(segments: string[]): void {
    const resolvedNames: string[] = [];
    const resolvedIds: (string | null)[] = [null]; // bắt đầu từ root

    const resolveStep = (segIndex: number, parentId: string | null): void => {
      if (segIndex >= segments.length) {
        this.currentPath = resolvedNames;
        this.currentPathIds = resolvedIds.slice(1);
        this.searchText = '';
        this.activeSidebarItem = 'all';
        this.pushHistory();
        this.syncUrlPath();
        this.loadItems();
        return;
      }

      const targetName = segments[segIndex].toLowerCase();

      this.explorerService.getItems(parentId).subscribe({
        next: (res: any) => {
          const items: any[] = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : [];

          const matched = items.find(
            (i: any) => i.isFolder && i.name?.toLowerCase() === targetName,
          );

          if (!matched) {
            this.message.error(
              `Không tìm thấy thư mục "${segments[segIndex]}"` +
                (resolvedNames.length
                  ? ` trong "${resolvedNames.join(' / ')}"`
                  : ''),
            );
            return;
          }

          resolvedNames.push(matched.name);
          resolvedIds.push(matched.id);
          resolveStep(segIndex + 1, matched.id);
        },
        error: () => {
          this.message.error('Lỗi kết nối khi điều hướng.');
        },
      });
    };

    resolveStep(0, null);
  }

  onAddressBlur(): void {
    setTimeout(() => {
      this.isAddressEditing = false;
    }, 150);
  }

  onFilterChange(values: string[]): void {
    this.activeFilters = values;
    this.applyFilter();
  }

  navigateToRoot(): void {
    this.currentPath = [];
    this.currentPathIds = [];
    this.activeSidebarItem = 'all';
    this.currentTagId = null;
    this.searchText = '';
    this.pushHistory();
    this.syncUrlPath();
    this.loadItems();
  }

  navigateToIndex(index: number): void {
    this.currentPath = this.currentPath.slice(0, index + 1);
    this.currentPathIds = this.currentPathIds.slice(0, index + 1);
    this.currentTagId = null;
    this.searchText = '';
    this.pushHistory();
    this.syncUrlPath();
    this.loadItems();
  }

  goBack(): void {
    if (!this.canGoBack) return;
    this.historyIndex--;
    const h = this.history[this.historyIndex];
    this.currentPath = [...h.names];
    this.currentPathIds = [...h.ids];
    this.currentTagId = null;
    this.searchText = '';
    this.syncUrlPath();
    this.loadItems();
  }

  goForward(): void {
    if (!this.canGoForward) return;
    this.historyIndex++;
    const h = this.history[this.historyIndex];
    this.currentPath = [...h.names];
    this.currentPathIds = [...h.ids];
    this.currentTagId = null;
    this.searchText = '';
    this.syncUrlPath();
    this.loadItems();
  }

  goUp(): void {
    if (this.currentPath.length === 0) return;
    this.currentPath = this.currentPath.slice(0, -1);
    this.currentPathIds = this.currentPathIds.slice(0, -1);
    this.searchText = '';
    this.pushHistory();
    this.syncUrlPath();
    this.loadItems();
  }

  private pushHistory(): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({
      names: [...this.currentPath],
      ids: [...this.currentPathIds],
    });
    this.historyIndex = this.history.length - 1;
  }

  refresh(): void {
    this.selectedItems = [];
    this.loadItems();
    this.message.success('Đã làm mới!');
  }

  openActivityHistory(): void {
    this.isActivityVisible = true;
    this.activityPageIndex = 1;
    this.loadActivityHistory();
  }

  onActivitySearch(): void {
    this.activityPageIndex = 1;
    this.loadActivityHistory();
  }

  onKeydownActivitySearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.onActivitySearch();
    }
  }

  onActivityPageIndexChange(page: number): void {
    this.activityPageIndex = page;
    this.loadActivityHistory();
  }

  onActivityPageSizeChange(size: number): void {
    this.activityPageSize = size;
    this.activityPageIndex = 1;
    this.loadActivityHistory();
  }

  private loadActivityHistory(): void {
    this.activityLoading = true;
    this.explorerService
      .getUserActivities(
        this.activityPageIndex,
        this.activityPageSize,
        this.activityKeyword,
      )
      .pipe(finalize(() => (this.activityLoading = false)))
      .subscribe({
        next: (res: any) => {
          this.activityItems = Array.isArray(res) ? res : [];
          this.activityTotal = Number(res?.totalRecord || 0);
        },
        error: () => {
          this.activityItems = [];
          this.activityTotal = 0;
          this.message.error('Không thể tải lịch sử hoạt động');
        },
      });
  }

  isSelected(item: FileItem): boolean {
    return this.selectedItems.some((s) => s.id === item.id);
  }

  selectItem(event: MouseEvent, item: FileItem): void {
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
      if (this.isSelected(item)) {
        this.selectedItems = this.selectedItems.filter((s) => s.id !== item.id);
      } else {
        this.selectedItems = [...this.selectedItems, item];
      }
    } else if (event.shiftKey && this.selectedItems.length > 0) {
      const lastIdx = this.filteredItems.findIndex(
        (i) => i.id === this.selectedItems[this.selectedItems.length - 1].id,
      );
      const curIdx = this.filteredItems.findIndex((i) => i.id === item.id);
      const [from, to] =
        lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
      this.selectedItems = this.filteredItems.slice(from, to + 1);
    } else {
      this.selectedItems = [item];
    }
    this.previewItem = item;
    this.updateSelectAll();
  }

  deselectAll(): void {
    this.selectedItems = [];
    this.allSelected = false;
    this.contentMenuVisible = false;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const newItems = this.pagedItems.filter((i) => !this.isSelected(i));
      this.selectedItems = [...this.selectedItems, ...newItems];
      this.pagedItems.forEach((i) => (i.checked = true));
    } else {
      const pagedIds = new Set(this.pagedItems.map((i) => i.id));
      this.selectedItems = this.selectedItems.filter(
        (i) => !pagedIds.has(i.id),
      );
      this.pagedItems.forEach((i) => (i.checked = false));
    }
  }

  onItemCheck(item: FileItem): void {
    if (item.checked) {
      if (!this.isSelected(item))
        this.selectedItems = [...this.selectedItems, item];
    } else {
      this.selectedItems = this.selectedItems.filter((s) => s.id !== item.id);
    }
    this.updateSelectAll();
  }

  private updateSelectAll(): void {
    this.allSelected =
      this.pagedItems.length > 0 &&
      this.pagedItems.every((i) => this.isSelected(i));
  }

  openItem(item: FileItem | null): void {
    if (!item) return;

    if (item.type === 'folder') {
      this.currentPath = [...this.currentPath, item.name];
      this.currentPathIds = [...this.currentPathIds, item.id];
      this.pushHistory();
      this.allItems = [];
      this.filteredItems = [];
      this.pagedItems = [];
      this.selectedItems = [];
      this.previewItem = null;
      this.searchText = '';
      this.syncUrlPath();
      this.loadItems();
    } else {
      const isSupported =
        this.isOnlyOfficeFile(item.name) ||
        this.isImageFile(item.name) ||
        this.isVideoFile(item.name);

      if (this.viewModeService.isWindowMode && isSupported) {
        this.windowManager.openFileViewer(item);
        return;
      }

      if (this.isOnlyOfficeFile(item.name)) {
        this.openOnlyOfficeViewer(item);
      } else if (this.isImageFile(item.name) || this.isVideoFile(item.name)) {
        this.openMediaViewer(item);
      } else {
        this.message.info(
          'Hiện tại không hỗ trợ chức năng mở file dạng này, vui lòng tải xuống!',
        );
      }
    }
  }

  isOnlyOfficeFile(name: string): boolean {
    if (!name) return false;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const officeExt = [
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.txt',
      '.csv',
    ];
    return officeExt.includes(ext);
  }

  isImageFile(name: string): boolean {
    if (!name) return false;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const imageExt = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    return imageExt.includes(ext);
  }

  isVideoFile(name: string): boolean {
    if (!name) return false;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const videoExt = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    return videoExt.includes(ext);
  }

  openMediaViewer(item: FileItem): void {
    this.currentViewFile = item;
    this.viewFileType = this.isImageFile(item.name) ? 'image' : 'video';

    this.fileService.requestDownloadTicket(item.id).subscribe({
      next: (res) => {
        const ticket = res?.ticket;
        if (!ticket) {
          this.message.error('Không thể mở file');
          return;
        }
        const base = this.env.getEnv('baseUrl');
        const url =
          this.viewFileType === 'video'
            ? `${base}/File/StreamVideo/${item.id}?dl=${encodeURIComponent(ticket)}&t=${Date.now()}`
            : this.fileService.getDownloadUrl(item.id, ticket) +
              `&t=${Date.now()}`;
        this.mediaUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.isViewFileVisible = true;
      },
      error: () => this.message.error('Không thể mở file'),
    });
  }

  openOnlyOfficeViewer(item: FileItem): void {
    this.currentViewFile = item;
    this.viewFileType = 'onlyoffice';
    this.idTabActive = '_' + Math.random().toString(36).substring(2, 11);

    this.fileService.requestOnlyOfficeTicket(item.id, 'Explorer').subscribe({
      next: (ticket) => {
        if (!ticket) {
          this.message.error('Không thể mở file (thiếu quyền tải xuống)');
          return;
        }

        this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `only-office/only-office-viewer-explorer.html?id=${this.idTabActive}&t=${Date.now()}`,
        );
        this.isViewFileVisible = true;

        const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};
        const message = {
          file: { ...item },
          mode: 'view',
          idTab: this.idTabActive,
          account: accountInfo,
          environment: this.env.getEnv('baseUrl'),
          onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
          documentUrl: buildOnlyOfficeDocumentUrl(
            this.env,
            item.id,
            ticket,
            'Explorer',
          ),
        };

        setTimeout(
          () => this.observeIframeAndPostMessage(this.idTabActive, message),
          100,
        );
      },
      error: () => this.message.error('Không thể mở file'),
    });
  }

  observeIframeAndPostMessage(idTab: string, message: any): void {
    const postIt = (iframeEl: HTMLIFrameElement) => {
      iframeEl.contentWindow?.postMessage(message, '*');
      iframeEl.onload = () => iframeEl.contentWindow?.postMessage(message, '*');
    };

    const iframe = document.getElementById(idTab) as HTMLIFrameElement;
    if (iframe) {
      postIt(iframe);
      return;
    }

    const observer = new MutationObserver(() => {
      const iframeEl = document.getElementById(idTab) as HTMLIFrameElement;
      if (iframeEl) {
        postIt(iframeEl);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  downloadItem(item: FileItem | null): void {
    if (!item) return;

    if (item.type === 'folder') {
      this.selectedItems = [item];
      this.downloadSelected();
      return;
    }

    this.explorerService.downloadFile(item.id, item.name);
    this.message.success(`Đang tải xuống: ${item.name}`);
  }

  downloadSelected(): void {
    if (this.selectedItems.length === 0) return;

    if (
      this.selectedItems.length === 1 &&
      this.selectedItems[0].type !== 'folder'
    ) {
      this.downloadItem(this.selectedItems[0]);
    } else {
      this.message.info(
        'Đang chuẩn bị file ZIP (bao gồm các thư mục), vui lòng đợi...',
        { nzDuration: 3000 },
      );

      const ids = this.selectedItems.map((f) => f.id);

      this.explorerService.downloadMultipleAsZip(ids).subscribe({
        next: (response: any) => {
          const blob = new Blob([response.body], { type: 'application/zip' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          const contentDisposition = response.headers.get(
            'content-disposition',
          );
          let fileName = 'Tai_Lieu.zip';
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
              fileName = decodeURIComponent(match[1]);
            }
          }

          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.message.success('Tải xuống thành công!');
          this.deselectAll();
        },
        error: () => {
          this.message.error('Có lỗi xảy ra khi tạo file nén!');
        },
      });
    }
  }

  restoreSelected(): void {
    if (this.selectedItems.length === 0) return;

    const count = this.selectedItems.length;
    this.loadingService.setLoading(true);

    const requests = this.selectedItems.map((item) =>
      this.explorerService.restoreItem(item.id),
    );

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.loadingService.setLoading(false);
          this.deselectAll();
        }),
      )
      .subscribe({
        next: () => {
          this.message.success(`Đã khôi phục thành công ${count} mục.`);
          this.loadItems();
          this.updateFolderTree();
        },
        error: () => this.message.error('Khôi phục thất bại!'),
      });
  }

  deleteItem(item: FileItem | null): void {
    if (!item) return;
    this.explorerService.deleteItem(item.id).subscribe({
      next: () => {
        this.allItems = this.allItems.filter((i) => i.id !== item.id);
        this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id);
        if (this.previewItem?.id === item.id) this.previewItem = null;
        this.applyFilter();
        this.message.success(`Đã xóa: ${item.name}`);
      },
      error: () => this.message.error('Xóa thất bại!'),
    });
  }

  deleteSelected(): void {
    if (this.selectedItems.length === 0) return;

    const isTrashMode = this.activeSidebarItem === 'trash';

    if (isTrashMode) {
      this.executePermanentDelete();
    } else {
      this.executeSoftDelete();
    }
  }

  private executeSoftDelete(): void {
    const ids = new Set(this.selectedItems.map((i) => i.id));
    const requests = this.selectedItems.map((i) =>
      this.explorerService.deleteItem(i.id),
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.allItems = this.allItems.filter((i) => !ids.has(i.id));
        if (this.previewItem && ids.has(this.previewItem.id))
          this.previewItem = null;
        this.selectedItems = [];
        this.applyFilter();
        this.message.success('Đã chuyển các mục vào thùng rác');
      },
      error: () => this.message.error('Xóa thất bại'),
    });
  }

  private executePermanentDelete(): void {
    const count = this.selectedItems.length;
    const ids = this.selectedItems.map((i) => i.id);

    this.loadingService.setLoading(true);

    const requests = ids.map((id) => this.explorerService.hardDeleteItem(id));

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.loadingService.setLoading(false);
          this.deselectAll();
        }),
      )
      .subscribe({
        next: () => {
          this.allItems = this.allItems.filter((i) => !ids.includes(i.id));
          this.applyFilter();
          this.message.success(`Đã xóa ${count} mục khỏi hệ thống`);
          this.updateFolderTree();
        },
        error: () => this.message.error('Có lỗi khi xóa!'),
      });
  }

  moveSelected(): void {
    this.handleCut();
  }

  copySelected(): void {
    this.handleCopy();
  }

  toggleFavorite(event: Event, item: FileItem | null): void {
    if (!item) return;
    event.stopPropagation();

    const itemsToToggle =
      this.selectedItems.length > 1 &&
      this.selectedItems.some((i) => i.id === item.id)
        ? this.selectedItems
        : [item];

    if (itemsToToggle.length === 1) {
      this.explorerService.toggleFavorite(item.id).subscribe({
        next: (res: any) => {
          const updated = res?.data ?? res;
          item.favorite = updated?.isFavorite === true;
          this.message.success(
            item.favorite
              ? `Đã thêm "${item.name}" vào yêu thích`
              : `Đã bỏ yêu thích "${item.name}"`,
          );
        },
        error: () => this.message.error('Thao tác thất bại!'),
      });
    } else {
      const requests = itemsToToggle.map((i) =>
        this.explorerService.toggleFavorite(i.id),
      );

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          responses.forEach((res, index) => {
            const updated = res?.data ?? res;
            itemsToToggle[index].favorite = updated?.isFavorite === true;
          });
          this.message.success(
            `Đã đảo trạng thái yêu thích cho ${itemsToToggle.length} mục!`,
          );
        },
        error: () => {
          this.message.error('Cập nhật thất bại đối với một số mục!');
        },
      });
    }
  }

  renameItem(item: FileItem | null): void {
    if (!item) return;
    this.renameTargetItem = item;
    this.renameValue = item.name;
    this.isRenameVisible = true;
  }

  confirmRename(): void {
    if (!this.renameTargetItem || !this.renameValue.trim()) return;

    this.explorerService
      .renameItem(this.renameTargetItem.id, this.renameValue.trim())
      .subscribe({
        next: (res: any) => {
          const updatedItem = res?.data ?? res;
          const index = this.allItems.findIndex((i) => i.id === updatedItem.id);
          if (index !== -1) {
            this.allItems[index] = this.mapToFileItem(updatedItem);
            this.applyFilter();
          }
          this.message.success('Đã đổi tên thành công');
          this.isRenameVisible = false;
          this.renameTargetItem = null;
          this.renameValue = '';
        },
        error: () => this.message.error('Đổi tên thất bại!'),
      });
  }

  onKeydownRename(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.confirmRename();
    }
  }

  moveItemToTrash(item: FileItem | null): void {
    if (!item) return;
    this.deleteItem(item);
  }

  copyLinkItem(item: FileItem | null): void {
    if (!item) return;
    this.explorerService
      .createShareLink(item.id, this.shareLinkRole)
      .subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          const code = data?.shareCode;
          if (code) {
            const link = `${window.location.origin}/share/${code}`;
            navigator.clipboard?.writeText(link).catch(() => {});
          }
          this.message.success('Đã sao chép liên kết vào clipboard');
        },
      });
  }

  setContextItem(item: FileItem): void {
    this.contextItem = item;
  }

  onItemContextMenu(event: MouseEvent, item: FileItem): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextItem = item;

    if (!this.isSelected(item)) {
      this.selectedItems = [item];
    }

    this.nzContextMenuService.create(event, this.itemMenuList);
  }

  onContentContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contentMenuVisible = true;
    this.contentMenuX = event.clientX;
    this.contentMenuY = event.clientY;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.contentMenuVisible = false;
  }

  createFolder(): void {
    this.newFolderName = '';
    this.isNewFolderVisible = true;
  }

  confirmNewFolder(): void {
    if (!this.newFolderName.trim()) return;
    const dto = {
      name: this.newFolderName.trim(),
      parentId: this.currentFolderId,
      color: '#ffc53d',
    };
    this.explorerService.createFolder(dto).subscribe({
      next: (res: any) => {
        const data: ExplorerItem = res?.data ?? res;
        if (data?.id) {
          const newFolder = this.mapToFileItem(data);
          this.allItems = [newFolder, ...this.allItems];
          this.applyFilter();
          this.message.success(`Đã tạo thư mục: ${newFolder.name}`);
          this.updateFolderTree();
        }
        this.isNewFolderVisible = false;
        this.newFolderName = '';
      },
      error: () => this.message.error('Tạo thư mục thất bại!'),
    });
  }

  onKeydownNewFolder(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.confirmNewFolder();
    }
  }

  createFile(type: string): void {
    this.message.info('Chức năng tạo tệp mới đang phát triển');
  }

  showUploadModal(): void {
    this.uploadFileList = [];
    this.isUploadVisible = true;
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = (file.originFileObj || file) as File;
    const err = validateClientFile(raw, UPLOAD_MAX_BYTES.explorer);
    if (err) {
      this.message.error(err);
      return false;
    }
    this.uploadFileList = [...this.uploadFileList, file];
    return false;
  };

  onUploadChange(info: any): void {
    this.uploadFileList = info.fileList;
  }

  confirmUpload(): void {
    const files = this.uploadFileList
      .map((f) => (f.originFileObj || f) as File)
      .filter((f) => !!f);

    if (files.length === 0) {
      this.message.warning('Vui lòng chọn tệp để tải lên');
      return;
    }
    this.explorerService
      .uploadFiles(files, this.currentFolderId)
      .pipe(
        finalize(() => {
          this.loadingService.setLoading(false);
          this.loadingService.hide();
          this.loadingService.reset();
        }),
      )
      .subscribe({
        next: (res: any) => {
          const items: ExplorerItem[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          const newFileItems = items.map((i) => this.mapToFileItem(i));
          this.allItems = [...newFileItems, ...this.allItems];
          this.applyFilter();
          this.updateFolderTree();
          this.isUploadVisible = false;
          this.uploadFileList = [];
          this.message.success(`Đã tải lên ${newFileItems.length} tệp`);
        },
        error: () => {
          this.message.error('Tải lên thất bại!');
        },
      });
  }

  canShare(item: FileItem | null): boolean {
    if (!item) return false;
    const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};
    return item.owner === accountInfo.userName;
  }

  shareItem(item: FileItem | null): void {
    if (!item) return;
    this.shareTargetItem = item;
    this.shareEmail = '';
    this.shareLink = '';
    this.shareLinkEnabled = false;
    this.shareLinkRole = 'view';
    this.shareLinkLoading = false;
    this.sharedWith = [];
    this.isShareVisible = true;

    this.explorerService.getShares(item.id).subscribe({
      next: (data: any) => {
        const shares: any[] = Array.isArray(data) ? data : [];
        this.sharedWith = shares.map((s) => ({
          id: s.id,
          name: (s.userId as string)?.split('@')[0] || s.userId || '',
          email: s.userId || '',
          userName: s.userId || '',
          role: s.role || 'view',
          status: s.status || 'Pending',
        }));
      },
    });
  }

  onShareEmailInput(value: string): void {
    this.shareSearch$.next(value);
  }

  selectShareUser(user: any): void {
    this.shareEmail = user.userName;
    this.shareSearchVisible = false;
    this.shareSearchResults = [];
    this.addShareEmail();
  }

  addShareEmail(): void {
    if (!this.shareEmail.trim() || !this.shareTargetItem) return;
    const dto = {
      itemId: this.shareTargetItem.id,
      userId: this.shareEmail.trim(),
      role: 'view',
    };
    this.explorerService.shareItem(dto).subscribe({
      next: (res: any) => {
        const share = res?.data ?? res;
        if (share?.id) {
          const selectedUser =
            this.shareSearchResults.find(
              (u) => u.userName === this.shareEmail,
            ) || null;
          this.sharedWith = [
            ...this.sharedWith,
            {
              id: share.id,
              name: selectedUser?.fullName || this.shareEmail.split('@')[0],
              email: this.shareEmail.trim(),
              userName: this.shareEmail.trim(),
              avatarFileId: selectedUser?.avatarFileId ?? null,
              role: share.role || 'view',
              status: share.status || 'Pending',
            },
          ];
        }
        this.shareEmail = '';
        this.shareSearchResults = [];
        this.shareSearchVisible = false;
      },
      error: () => this.message.error('Chia sẻ thất bại!'),
    });
  }

  removeShare(person: SharedPerson): void {
    if (!person.id) {
      this.sharedWith = this.sharedWith.filter((p) => p.email !== person.email);
      return;
    }
    this.explorerService.removeShare(person.id).subscribe({
      next: () => {
        this.sharedWith = this.sharedWith.filter((p) => p.id !== person.id);
      },
      error: () => this.message.error('Xóa chia sẻ thất bại!'),
    });
  }

  confirmShare(): void {
    if (this.shareTargetItem) {
      this.shareTargetItem.shared =
        this.sharedWith.length > 0 || this.shareLinkEnabled;
    }
    this.isShareVisible = false;
    this.message.success('Đã cập nhật quyền chia sẻ');
  }

  onShareLinkToggle(enabled: boolean): void {
    if (!this.shareTargetItem) return;

    if (!enabled) {
      this.shareLink = '';
      return;
    }

    this.shareLink = '';
    this.shareLinkLoading = true;
    this.explorerService
      .createShareLink(this.shareTargetItem.id, this.shareLinkRole)
      .subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          const code = data?.shareCode;
          if (code) {
            this.shareLink = `${window.location.origin}/share/${code}`;
            navigator.clipboard?.writeText(this.shareLink).catch(() => {});
            this.message.success('Đã tạo và sao chép liên kết chia sẻ mới');
          }
          this.shareLinkLoading = false;
        },
        error: () => {
          this.shareLinkLoading = false;
          this.shareLinkEnabled = false;
          this.message.error('Tạo liên kết thất bại!');
        },
      });
  }

  copyShareLink(): void {
    if (!this.shareLink) return;
    navigator.clipboard
      ?.writeText(this.shareLink)
      .then(() => {
        this.message.success('Đã sao chép liên kết chia sẻ');
      })
      .catch(() => {
        this.message.error('Sao chép liên kết thất bại!');
      });
  }

  onShareRoleChange(): void {
    if (this.shareLinkEnabled && this.shareTargetItem) {
      this.shareLinkLoading = true;
      this.shareLink = 'Đang cập nhật liên kết...';
      this.explorerService
        .updateShareLinkMode(this.shareTargetItem.id, this.shareLinkRole)
        .subscribe({
          next: (res: any) => {
            const data = res?.data ?? res;
            const code = data?.shareCode;
            if (code) {
              this.shareLink = `${window.location.origin}/share/${code}`;
            }
            this.shareLinkLoading = false;
          },
          error: () => {
            this.shareLinkLoading = false;
            this.shareLink = '';
            this.message.error('Cập nhật quyền thất bại!');
          },
        });
    }
  }

  selectSidebarItem(item: QuickAccessItem): void {
    this.activeSidebarItem = item.key;
    this.currentPath = [];
    this.currentPathIds = [];
    this.currentTagId = null;
    this.searchText = '';

    this.selectedItems = [];
    this.previewItem = null;

    this.pushHistory();
    this.syncUrlPath();
    this.loadItems();
  }

  loadPendingShares(): void {
    this.explorerService.getPendingShares().subscribe({
      next: (res: any) => {
        const rawData = res?.data ?? res;
        this.pendingShares = Array.isArray(rawData) ? rawData : [];

        const invitationItem = this.quickAccess.find(
          (i) => i.key === 'invitations',
        );
        if (invitationItem) {
          invitationItem.count =
            this.pendingShares.length > 0
              ? this.pendingShares.length
              : undefined;
        }

        // Nếu đang ở view invitations thì update allItems luôn
        if (this.activeSidebarItem === 'invitations') {
          this.allItems = this.pendingShares.map((s) =>
            this.mapInvitationToFileItem(s),
          );
          this.applyFilter();
        }
      },
      error: (err) => {
        console.error('Error loading pending shares:', err);
        this.pendingShares = [];
      },
    });
  }

  private mapInvitationToFileItem(share: any): FileItem {
    const item = share.item;
    return {
      id: share.id, // Dùng shareId để Accept/Reject
      name: item?.name || 'Không xác định',
      type: item?.isFolder ? 'folder' : item?.type || 'file',
      modifiedDate: item?.updateDate ?? new Date(),
      createdDate: item?.createDate ?? new Date(),
      owner: item?.ownerId || 'Hệ thống',
      shared: true,
      favorite: false,
      size: item?.sizeText || '0 B',
      // Metadata phụ để template nhận diện đây là invitation
      tag: 'invitation_meta',
      checked: false,
    };
  }

  acceptShare(shareId: string): void {
    this.explorerService.acceptShare(shareId).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.message.success('Đã chấp nhận chia sẻ');
          this.loadPendingShares();
          if (this.activeSidebarItem === 'shared') {
            this.loadItems();
          }
        } else {
          this.message.error('Chấp nhận chia sẻ thất bại');
        }
      },
      error: () => this.message.error('Lỗi khi chấp nhận chia sẻ'),
    });
  }

  rejectShare(shareId: string): void {
    this.explorerService.rejectShare(shareId).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.message.success('Đã từ chối chia sẻ');
          this.loadPendingShares();
        } else {
          this.message.error('Từ chối chia sẻ thất bại');
        }
      },
      error: () => this.message.error('Lỗi khi từ chối chia sẻ'),
    });
  }

  filterByTag(tag: ColorTag): void {
    if (this.selectedItems.length > 0) {
      this.assignTagToSelected(tag);
    } else {
      if (this.currentTagId === tag.id) {
        this.currentTagId = null;
        this.message.info('Đã bỏ lọc nhãn');
      } else {
        this.currentTagId = tag.id;
        this.message.info(
          `Đang lọc theo nhãn: ${tag.label} trong vùng hiển thị hiện tại`,
        );
      }
      this.applyFilter();
    }
  }

  assignTagToSelected(tag: ColorTag): void {
    const itemsToTag = [...this.selectedItems];
    const requests = itemsToTag.map((item) =>
      this.explorerService.toggleTag(item.id, tag.id),
    );

    this.loadingService.setLoading(true);
    forkJoin(requests)
      .pipe(finalize(() => this.loadingService.setLoading(false)))
      .subscribe({
        next: (responses: any[]) => {
          this.message.success(
            `Đã cập nhật nhãn "${tag.label}" cho ${itemsToTag.length} mục!`,
          );
          this.refresh();
        },
        error: () => {
          this.message.error('Cập nhật nhãn thất bại cho một số mục!');
        },
      });
  }

  removeTagFromSelected(): void {
    const itemsToUntag = [...this.selectedItems];

    const requests = itemsToUntag.map((item) =>
      this.explorerService.toggleTag(item.id, null as any),
    );

    this.loadingService.setLoading(true);
    forkJoin(requests)
      .pipe(finalize(() => this.loadingService.setLoading(false)))
      .subscribe({
        next: () => {
          this.message.success(`Đã bỏ nhãn cho ${itemsToUntag.length} mục!`);
          this.refresh();
        },
        error: () => {
          this.message.error('Bỏ gắn nhãn thất bại cho một số mục!');
        },
      });
  }

  hasValidTag(tagId?: string): boolean {
    if (!tagId || tagId === 'null' || tagId.trim() === '') {
      return false;
    }
    return this.colorTags.some((t) => t.id === tagId);
  }

  getTagColor(tagId?: string): string {
    const tag = this.colorTags.find((t) => t.id === tagId);
    return tag ? tag.color : 'transparent';
  }

  onTreeNodeClick(event: NzFormatEmitEvent): void {
    const node = event.node;
    if (!node) return;

    this.selectedKeys = [node.key];
    node.isExpanded = !node.isExpanded;

    if (node.key === 'root') {
      this.navigateToRoot();
      return;
    }

    const newPathNames: string[] = [];
    const newPathIds: (string | null)[] = [];

    let currentNode = node;
    while (currentNode && currentNode.key !== 'root') {
      newPathNames.unshift(currentNode.title);
      newPathIds.unshift(currentNode.key);
      currentNode = currentNode.parentNode!;
    }

    this.currentPath = newPathNames;
    this.currentPathIds = newPathIds;

    this.pushHistory();

    this.allItems = [];
    this.filteredItems = [];
    this.selectedItems = [];
    this.previewItem = null;

    this.activeSidebarItem = 'all';
    this.loadItems();
  }

  onTreeExpand(event: NzFormatEmitEvent): void {
    const node = event.node;
    if (node && node.isExpanded && node.children.length === 0 && !node.isLeaf) {
      this.explorerService.getItems(node.key).subscribe({
        next: (data: any) => {
          const items: any[] = Array.isArray(data) ? data : [];
          const childFolders = items
            .filter((i) => i.isFolder || i.type === 'folder')
            .map((f) => ({
              title: f.name,
              key: f.id,
              icon: 'folder',
              isLeaf: !f.hasChildFolder,
              children: [],
            }));
          node.addChildren(childFolders);
        },
      });
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      folder: 'Thư mục tệp',
      image: 'Hình ảnh',
      pdf: 'PDF Document',
      docx: 'Microsoft Word',
      xlsx: 'Microsoft Excel',
      pptx: 'Microsoft PowerPoint',
      zip: 'Tệp nén',
      txt: 'Tài liệu văn bản',
    };
    return labels[type] || type.toUpperCase();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  onContainerMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (
      target.closest('.grid-item') ||
      target.closest('.list-item') ||
      target.closest('button')
    ) {
      return;
    }

    this.isSelecting = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    if (!event.ctrlKey && !event.metaKey) {
      this.selectedItems = [];
      this.preSelection = [];
    } else {
      this.preSelection = [...this.selectedItems];
    }

    this.updateSelectionBox(event.clientX, event.clientY);
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isSelecting) return;

    this.updateSelectionBox(event.clientX, event.clientY);

    this.calculateIntersections();
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    if (this.isSelecting) {
      this.isSelecting = false;
      this.selectionBoxStyle = {
        left: '0px',
        top: '0px',
        width: '0px',
        height: '0px',
      };
      this.updateSelectAll();
    }
  }

  private updateSelectionBox(currentX: number, currentY: number): void {
    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    const left = Math.min(currentX, this.startX);
    const top = Math.min(currentY, this.startY);

    this.selectionBoxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  private calculateIntersections(): void {
    const boxLeft = parseInt(this.selectionBoxStyle.left, 10);
    const boxTop = parseInt(this.selectionBoxStyle.top, 10);
    const boxRight = boxLeft + parseInt(this.selectionBoxStyle.width, 10);
    const boxBottom = boxTop + parseInt(this.selectionBoxStyle.height, 10);

    const newlySelectedIds = new Set<string>();

    const fileElements = document.querySelectorAll('.file-item-element');

    fileElements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      const isIntersecting = !(
        rect.right < boxLeft ||
        rect.left > boxRight ||
        rect.bottom < boxTop ||
        rect.top > boxBottom
      );

      if (isIntersecting) {
        const id = el.getAttribute('data-id');
        if (id) newlySelectedIds.add(id);
      }
    });

    this.selectedItems = this.filteredItems.filter(
      (item) =>
        this.preSelection.some((pre) => pre.id === item.id) ||
        newlySelectedIds.has(item.id),
    );
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const activeTag = document.activeElement?.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isCtrlOrCmd && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.handleCopy();
    } else if (isCtrlOrCmd && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      this.handleCut();
    } else if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
      if (this.clipboardItems.length > 0) {
        event.preventDefault();
        this.handlePaste();
      }
    } else if (isCtrlOrCmd && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.toggleSelectAll(true);
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const activeTag = document.activeElement?.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') {
      return;
    }

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    if (clipboardData.files && clipboardData.files.length > 0) {
      event.preventDefault();

      const pastedFiles: File[] = [];
      for (let i = 0; i < clipboardData.files.length; i++) {
        pastedFiles.push(clipboardData.files[i]);
      }

      if (pastedFiles.length > 0) {
        this.uploadExternalFiles(pastedFiles, this.currentFolderId);
      }
    }
  }

  handleCopy(): void {
    if (this.selectedItems.length === 0) return;

    this.clipboardItems = [...this.selectedItems];
    this.clipboardAction = 'copy';
    this.message.success(`Đã sao chép ${this.clipboardItems.length} mục.`);
    this.deselectAll();
  }

  handleCut(): void {
    if (this.selectedItems.length === 0) return;

    this.clipboardItems = [...this.selectedItems];
    this.clipboardAction = 'cut';
    this.message.success(`Đã cắt ${this.clipboardItems.length} mục.`);
  }

  handlePaste(): void {
    if (this.clipboardItems.length === 0) {
      return;
    }

    const itemIds = this.clipboardItems.map((i) => i.id);
    const targetFolderId = this.currentFolderId;

    if (this.clipboardAction === 'copy') {
      this.explorerService.copyItems(itemIds, targetFolderId).subscribe({
        next: () => {
          this.message.success('Dán tệp thành công!');
          this.refresh();
        },
        error: () => {
          this.message.error('Dán tệp thất bại!');
        },
      });
    } else if (this.clipboardAction === 'cut') {
      this.explorerService.moveItems(itemIds, targetFolderId).subscribe({
        next: () => {
          this.message.success('Di chuyển tệp thành công!');
          this.clipboardItems = [];
          this.refresh();
        },
        error: () => {
          this.message.error('Di chuyển tệp thất bại!');
        },
      });
    }
  }

  onDragStart(event: DragEvent, item: FileItem): void {
    if (!this.isSelected(item)) {
      this.selectedItems = [item];
    }
    this.draggedItems = [...this.selectedItems];

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedItems = [];
    this.filteredItems.forEach((i) => (i.isDragOver = false));
  }

  onDragOver(event: DragEvent, item: FileItem): void {
    if (
      item.type === 'folder' &&
      !this.draggedItems.some((d) => d.id === item.id)
    ) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      item.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent, item: FileItem): void {
    item.isDragOver = false;
  }

  onDrop(event: DragEvent, targetFolder: FileItem): void {
    event.preventDefault();
    event.stopPropagation();
    targetFolder.isDragOver = false;

    if (
      this.draggedItems.length === 0 &&
      event.dataTransfer?.types.includes('Files') &&
      targetFolder.type === 'folder'
    ) {
      if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        this.processDataTransfer(event.dataTransfer, targetFolder.id);
      } else {
        const files = this.extractValidFiles(event.dataTransfer);
        if (files.length > 0) {
          this.uploadExternalFiles(files, targetFolder.id);
        } else {
          this.message.warning('Không tìm thấy tệp hợp lệ.');
        }
      }
      return;
    }

    if (this.draggedItems.length === 0 || targetFolder.type !== 'folder')
      return;
    if (this.draggedItems.some((d) => d.id === targetFolder.id)) return;

    const itemIds = this.draggedItems.map((i) => i.id);

    this.explorerService.moveItems(itemIds, targetFolder.id).subscribe({
      next: () => {
        this.message.success('Di chuyển tệp thành công!');
        this.draggedItems = [];
        this.selectedItems = [];
        this.refresh();
      },
      error: () => {
        this.message.error('Di chuyển tệp thất bại!');
      },
    });
  }

  onExternalDragEnter(event: DragEvent): void {
    if (this.draggedItems.length > 0) return;
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      this.dragCounter++;
      this.isDragOverlayVisible = true;
    }
  }

  onExternalDragOver(event: DragEvent): void {
    if (this.draggedItems.length > 0) return;
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      this.isDragOverlayVisible = true;
    }
  }

  onExternalDragLeave(event: DragEvent): void {
    if (this.draggedItems.length > 0) return;
    if (event.dataTransfer?.types.includes('Files')) {
      this.dragCounter--;
      if (this.dragCounter <= 0) {
        this.dragCounter = 0;
        this.isDragOverlayVisible = false;
      }
    }
  }

  onExternalDrop(event: DragEvent): void {
    if (this.draggedItems.length > 0) return;
    this.dragCounter = 0;
    this.isDragOverlayVisible = false;

    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        this.processDataTransfer(event.dataTransfer, this.currentFolderId);
      } else {
        const files = this.extractValidFiles(event.dataTransfer);
        if (files.length > 0) {
          this.uploadExternalFiles(files, this.currentFolderId);
        } else {
          this.message.warning('Không tìm thấy tệp hợp lệ.');
        }
      }
    }
  }

  private extractValidFiles(dataTransfer: DataTransfer): File[] {
    const validFiles: File[] = [];
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      const files = dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 0 || file.type !== '') {
          validFiles.push(file);
        }
      }
    }
    return validFiles;
  }

  uploadExternalFiles(
    files: File[],
    targetFolderId: string | null = this.currentFolderId,
  ): void {
    if (!files || files.length === 0) return;
    this.explorerService
      .uploadFiles(files, targetFolderId)
      .pipe(
        finalize(() => {
          this.loadingService.setLoading(false);
          this.loadingService.hide();
          this.loadingService.reset();
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res?.status === false) {
            return;
          }
          const items: ExplorerItem[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          const newFileItems = items.map((i) => this.mapToFileItem(i));

          if (newFileItems.length === 0) {
            this.message.warning('Tệp có thể bị trống hoặc không hợp lệ.');
            return;
          }

          if (targetFolderId === this.currentFolderId) {
            this.allItems = [...newFileItems, ...this.allItems];
            this.applyFilter();
          }
          this.updateFolderTree();
          this.message.success(`Đã tải lên ${newFileItems.length} tệp`);
        },
        error: () => {
          this.message.error('Tải lên thất bại!');
        },
      });
  }

  private async processDataTransfer(
    dataTransfer: DataTransfer,
    targetFolderId: string | null,
  ): Promise<void> {
    if (!dataTransfer.items || dataTransfer.items.length === 0) return;
    this.loadingService.setLoading(true);

    const rootFiles: File[] = [];
    const rootDirs: any[] = [];

    try {
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              const f = await this.getFileFromEntry(entry);
              if (f) rootFiles.push(f);
            } else if (entry.isDirectory) {
              rootDirs.push(entry);
            }
          }
        }
      }

      if (rootFiles.length > 0) {
        await this.uploadMultipleFilesAsync(rootFiles, targetFolderId);
      }

      for (const dir of rootDirs) {
        await this.processExternalEntry(dir, targetFolderId);
      }

      this.message.success('Đã hoàn tất tải lên tệp/thư mục');
      this.applyFilter();
      this.updateFolderTree();
    } catch (err) {
      console.error(err);
      this.message.error('Có lỗi xảy ra khi tải lên tệp/thư mục');
    } finally {
      this.loadingService.setLoading(false);
      this.loadingService.hide();
      this.loadingService.reset();
    }
  }

  private async processExternalEntry(
    entry: any,
    parentId: string | null,
  ): Promise<void> {
    if (entry.isFile) {
      const file = await this.getFileFromEntry(entry);
      if (file) {
        await this.uploadMultipleFilesAsync([file], parentId);
      }
    } else if (entry.isDirectory) {
      const newFolder = await this.createFolderAsync(entry.name, parentId);
      if (newFolder && newFolder.id) {
        const entries = await this.readDirectoryEntries(entry);

        const files: File[] = [];
        const dirEntries: any[] = [];

        for (const childEntry of entries) {
          if (childEntry.isFile) {
            const f = await this.getFileFromEntry(childEntry);
            if (f) files.push(f);
          } else if (childEntry.isDirectory) {
            dirEntries.push(childEntry);
          }
        }

        if (files.length > 0) {
          const chunkSize = 20;
          for (let i = 0; i < files.length; i += chunkSize) {
            const chunk = files.slice(i, i + chunkSize);
            await this.uploadMultipleFilesAsync(chunk, newFolder.id);
          }
        }

        for (const childDir of dirEntries) {
          await this.processExternalEntry(childDir, newFolder.id);
        }
      }
    }
  }

  private getFileFromEntry(entry: any): Promise<File> {
    return new Promise((resolve, reject) => {
      entry.file(
        (file: File) => resolve(file),
        (err: any) => reject(err),
      );
    });
  }

  private readDirectoryEntries(dirEntry: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const dirReader = dirEntry.createReader();
      let allEntries: any[] = [];

      const readEntries = () => {
        dirReader.readEntries(
          (entries: any[]) => {
            if (entries.length === 0) {
              resolve(allEntries);
            } else {
              allEntries = allEntries.concat(entries);
              readEntries();
            }
          },
          (err: any) => reject(err),
        );
      };

      readEntries();
    });
  }

  private createFolderAsync(
    name: string,
    parentId: string | null,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const dto = { name: name.trim(), parentId: parentId, color: '#ffc53d' };
      this.explorerService.createFolder(dto).subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          if (parentId === this.currentFolderId && data?.id) {
            const newFolder = this.mapToFileItem(data);
            this.allItems = [newFolder, ...this.allItems];
          }
          resolve(data);
        },
        error: (err) => reject(err),
      });
    });
  }

  private uploadMultipleFilesAsync(
    files: File[],
    parentId: string | null,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.explorerService.uploadFiles(files, parentId).subscribe({
        next: (res: any) => {
          if (res?.status === false) {
            resolve([]);
            return;
          }
          const items: any[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          if (parentId === this.currentFolderId) {
            const newFileItems = items.map((i) => this.mapToFileItem(i));
            this.allItems = [...newFileItems, ...this.allItems];
          }
          resolve(items);
        },
        error: (err) => reject(err),
      });
    });
  }

  onCustomColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newTagColor = input.value;
  }

  showAddTagModal(): void {
    this.newTagName = '';
    this.newTagColor = '#1890ff';
    this.isAddTagVisible = true;
  }

  confirmAddTag(): void {
    if (!this.newTagName.trim()) {
      this.message.warning('Vui lòng nhập tên nhãn');
      return;
    }
    const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};
    const currentUserName = accountInfo.userName || 'system';

    const dto = {
      name: this.newTagName.trim(),
      color: this.newTagColor,
      userId: currentUserName,
    };

    this.explorerService.createTag(dto).subscribe({
      next: (res: any) => {
        if (res?.status === false) {
          this.message.error(res?.message || 'Tạo nhãn thất bại!');
          return;
        }

        this.message.success('Đã tạo nhãn mới thành công');
        this.isAddTagVisible = false;

        this.loadTags();
      },
      error: (err) => {
        console.error(err);
        this.message.error('Có lỗi xảy ra khi tạo nhãn. Vui lòng thử lại!');
      },
    });
  }

  onKeydownAddTag(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.confirmAddTag();
    }
  }

  onDeleteTag(event: Event, tag: ColorTag): void {
    event.preventDefault();
    event.stopPropagation();

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa nhãn',
      nzContent: `Bạn có chắc chắn muốn xóa nhãn <b>${tag.label}</b> không? Các tệp đang gắn nhãn này sẽ tự động bị gỡ nhãn.`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.loadingService.setLoading(true);
        this.explorerService
          .deleteTag(tag.id)
          .pipe(finalize(() => this.loadingService.setLoading(false)))
          .subscribe({
            next: (res: any) => {
              if (res?.status === false) {
                this.message.error('Xóa nhãn thất bại!');
                return;
              }

              this.message.success(`Đã xóa nhãn "${tag.label}"`);

              this.colorTags = this.colorTags.filter((t) => t.id !== tag.id);

              if (this.currentTagId === tag.id) {
                this.currentTagId = null;
              }

              this.loadItems();
            },
            error: () => this.message.error('Có lỗi xảy ra khi xóa nhãn!'),
          });
      },
    });
  }

  getShareStatusLabel(status?: string): string {
    switch (status) {
      case 'Accepted':
        return 'Đã chấp nhận';
      case 'Rejected':
        return 'Đã từ chối';
      case 'Pending':
        return 'Chờ xác nhận';
      default:
        return 'Chờ xác nhận';
    }
  }

  getShareStatusColor(status?: string): string {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Pending':
        return 'processing';
      default:
        return 'processing';
    }
  }
}
