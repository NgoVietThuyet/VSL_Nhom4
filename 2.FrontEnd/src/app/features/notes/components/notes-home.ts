import { Component, OnInit, OnDestroy, HostListener, signal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar';
import { SignalRService } from '../../../shared/services/signalr.service';
import { LocalStorageUtils } from '../../../shared/utils';
import { NoteService } from '../services';
import {
  NoteNotebookDto,
  NoteSectionDto,
  NotePageDto,
  NotePageBlockDto,
  NOTEBOOK_COLORS,
  BLOCK_TYPES,
} from '../models';

@Component({
  selector: 'app-notes-home',
  imports: [CommonModule, SharedModules, UserAvatarComponent],
  templateUrl: './notes-home.html',
  styleUrl: './notes-home.scss',
})
export class NotesHome implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly autoSave$ = new Subject<void>();
  private readonly currentUserName = LocalStorageUtils.getItem('accountInfo')?.userName || '';

  searchMenu = ''

  noteKey = ''
  notebooks: NoteNotebookDto[] = [];
  allNotebooks: NoteNotebookDto[] = []

  pageKey = ''
  allPages: NotePageDto[] = [];
  pages: NotePageDto[] = [];
  pageBlocks: NotePageBlockDto[] = [];

  selectedNotebook: NoteNotebookDto | null = null;
  selectedSection: NoteSectionDto | null = null;
  selectedPage: NotePageDto | null = null;

  private routeSectionId = '';
  private routePageId = '';

  saveStatus: 'saved' | 'saving' | 'unsaved' = 'saved';

  isNotebookModalVisible = false;
  isEditNotebook = false;
  notebookForm: NoteNotebookDto = new NoteNotebookDto();

  isSectionModalVisible = false;
  isEditSection = false;
  sectionForm: NoteSectionDto = new NoteSectionDto();

  isPageRenameVisible = false;
  pageRenameForm: NotePageDto = new NotePageDto();

  activeBlockMenu: number = -1;

  readonly NOTEBOOK_COLORS = NOTEBOOK_COLORS;
  readonly BLOCK_TYPES = BLOCK_TYPES;

  sidebarTab: 'personal' | 'shared' = 'personal';
  sharedNotebooks: NoteNotebookDto[] = [];
  pendingShares: any[] = [];

  isShareVisible = false;
  shareTargetItem: NoteNotebookDto | null = null; 
  
  shareEmail = '';
  sharedWith: any[] = []; 
  
  shareSearchResults: any[] = []; 
  isUserLoading = false;
  shareSearchVisible = false;
  private shareSearch$ = new Subject<string>();

  isInvitationsVisible = false;

  constructor(
    private noteService: NoteService,
    private signalR: SignalRService,
    private message: NzMessageService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.applyRouteStateFromQuery();
    this.loadNotebooks();
    this.loadSharedNotebooks();
    this.loadPendingShares();

    this.shareSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(keyword => {
          if (!keyword.trim()) return of([]);
          this.isUserLoading = true;
          return this.noteService.searchUsers(keyword).pipe(
            catchError(() => of([]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const currentUser = LocalStorageUtils.getItem('accountInfo')?.userName;
        
        const alreadyShared = this.sharedWith.map(p => (p.email || p.userId || '').toLowerCase());

        this.shareSearchResults = list.filter((u: any) =>
          u && u.userName &&
          u.userName !== currentUser &&
          !alreadyShared.includes(u.userName.toLowerCase())
        );

        this.shareSearchVisible = this.shareSearchResults.length > 0;
        this.isUserLoading = false;
      });

    this.autoSave$
      .pipe(debounceTime(1200), takeUntil(this.destroy$))
      .subscribe(() => this.performSave());

    this.bindNoteRealtime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindNoteRealtime(): void {
    this.signalR.noteEvent$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: any) => {
        if (!event || event.senderUserName === this.currentUserName) {
          return;
        }

        this.loadNotebooks();

        if (this.selectedNotebook?.id) {
          this.loadSections(this.selectedNotebook);
        }

        if (this.selectedSection?.id) {
          this.loadPages(this.selectedSection.id);
        }

        if (this.selectedPage && this.saveStatus !== 'unsaved') {
          this.loadPageDetail(this.selectedPage);
        }
      });
  }

  @HostListener('input', ['$event.target'])
  onInputAnywhere(el: EventTarget | null): void {
    if (!el) return;
    const target = el as HTMLElement;
    if (target.tagName === 'TEXTAREA' && target.closest('.notes-editor-panel')) {
      const ta = target as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = Math.max(ta.scrollHeight, 28) + 'px';
    }
  }
  loadNotebooks(): void {
    this.noteService.getNotebooks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.notebooks = data || [];
          this.allNotebooks = data || []

          if (this.routeSectionId) {
            for (const nb of this.notebooks) {
              const section = nb.sections?.find(s => s.id === this.routeSectionId);
              if (section) {
                this.selectedNotebook = nb;
                this.selectSection(section, false);
                return;
              }
            }
            this.loadSectionsAndFindRouteSection();
          }
        },
      });
  }

  private loadSectionsAndFindRouteSection(): void {
    if (!this.routeSectionId || this.notebooks.length === 0) return;
    for (const nb of this.notebooks) {
      this.noteService.getSections(nb.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            nb.sections = data || [];
            const section = nb.sections!.find(s => s.id === this.routeSectionId);
            if (section && this.selectedNotebook?.id !== nb.id) {
              this.selectedNotebook = nb;
              this.selectSection(section, false);
            }
          },
        });
    }
  }
  loadSections(nb: NoteNotebookDto): void {
    this.noteService.getSections(nb.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          nb.sections = data || [];
          if (this.selectedNotebook?.id === nb.id) {
            this.selectedNotebook = { ...nb };
          }
          const target = this.notebooks.find(n => n.id === nb.id);
          if (target) target.sections = nb.sections;

          if (this.routeSectionId) {
            const section = nb.sections!.find(s => s.id === this.routeSectionId);
            if (section && this.selectedNotebook?.id === nb.id) {
              this.selectSection(section, false);
            } else if (!section && this.routeSectionId) {
              this.updateSectionQueryParam(null);
            }
          }
        },
      });
  }

  loadPages(sectionId: string): void {
    this.noteService.getPages(sectionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.pages = data || [];
          this.allPages = data || []

          if (this.routePageId) {
            const page = this.pages.find(p => p.id === this.routePageId);
            if (page && this.selectedPage?.id !== page.id) {
              this.selectPage(page, false);
            } else if (!page) {
              this.updatePageQueryParam(null);
            }
          }
        },
      });
  }

  loadPageDetail(page: NotePageDto): void {
    this.noteService.getPageDetail(page.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const detail = res?.data || res;
          if (detail) {
            this.selectedPage = { ...page, ...detail };
            const blocks: NotePageBlockDto[] = detail.blocks || [];
            this.pageBlocks = blocks.length > 0 ? blocks.map(b => ({ ...b })) : [this.makeEmptyBlock()];
          }
          this.saveStatus = 'saved';
          this.triggerAutoResize();
        },
      });
  }

  selectNotebook(nb: NoteNotebookDto): void {
    if (this.selectedNotebook?.id === nb.id) {
      this.selectedNotebook = null;
      this.selectedSection = null;
      this.selectedPage = null;
      this.pages = [];
      this.pageBlocks = [];
      return;
    }
    this.selectedNotebook = nb;
    this.selectedSection = null;
    this.selectedPage = null;
    this.pages = [];
    this.pageBlocks = [];

    this.updateSizeAt(1, 0)

    if (!nb.sections || nb.sections.length === 0) {
      this.loadSections(nb);
    }
  }

  selectSection(section: NoteSectionDto, event?: Event | boolean): void {
    if (event instanceof Event) {
      event.stopPropagation();
    }
    const updateQuery = event !== false;
    if (this.saveStatus === 'unsaved') { this.performSave(); }
    this.selectedSection = section;
    this.selectedPage = null;
    this.pageBlocks = [];
    if (updateQuery) {
      this.updateSectionQueryParam(section.id);
    }
    this.loadPages(section.id);

    this.updateSizeAt(1, 20)
  }

  selectPage(page: NotePageDto, updateQuery: boolean = true): void {
    if (this.selectedPage?.id === page.id) return;
    if (this.saveStatus === 'unsaved') { this.performSave(); }
    this.selectedPage = page;
    this.pageBlocks = [];
    if (updateQuery) {
      this.updatePageQueryParam(page.id);
    }
    this.loadPageDetail(page);
  }

  openCreateNotebook(): void {
    this.isEditNotebook = false;
    this.notebookForm = new NoteNotebookDto();
    this.notebookForm.color = '#189AD6';
    this.isNotebookModalVisible = true;
  }

  openEditNotebook(nb: NoteNotebookDto, e?: Event): void {
    e?.stopPropagation();
    this.isEditNotebook = true;
    this.notebookForm = { ...nb };
    this.isNotebookModalVisible = true;
  }

  saveNotebook(): void {
    if (!this.notebookForm.name?.trim()) {
      this.message.warning('Vui lòng nhập tên notebook!');
      return;
    }
    const call = this.isEditNotebook
      ? this.noteService.updateNotebook(this.notebookForm.id, this.notebookForm)
      : this.noteService.createNotebook(this.notebookForm);

    call.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.isNotebookModalVisible = false;
          if (this.isEditNotebook) {
            const nb = this.notebooks.find(n => n.id === this.notebookForm.id);
            if (nb) {
              nb.name = this.notebookForm.name;
              nb.color = this.notebookForm.color;
              nb.icon = this.notebookForm.icon;
            }
            if (this.selectedNotebook?.id === this.notebookForm.id) {
              this.selectedNotebook = { ...this.selectedNotebook, ...this.notebookForm };
            }
          } else {
            this.loadNotebooks();
          }
          this.message.success(this.isEditNotebook ? 'Đã cập nhật notebook!' : 'Đã tạo notebook!');
        }
      },
    });
  }

  deleteNotebook(nb: NoteNotebookDto, e?: Event): void {
    e?.stopPropagation();
    this.noteService.deleteNotebook(nb.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notebooks = this.notebooks.filter(n => n.id !== nb.id);
          if (this.selectedNotebook?.id === nb.id) {
            this.selectedNotebook = null;
            this.selectedSection = null;
            this.selectedPage = null;
            this.pages = [];
            this.pageBlocks = [];
          }
          this.message.success('Đã xóa notebook!');
        },
      });
  }

  selectNotebookColor(color: string): void {
    this.notebookForm.color = color;
  }

  openCreateSection(e?: Event): void {
    e?.stopPropagation();
    this.isEditSection = false;
    this.sectionForm = new NoteSectionDto();
    this.sectionForm.notebookId = this.selectedNotebook?.id;
    this.sectionForm.color = '#189AD6';
    this.isSectionModalVisible = true;
  }

  openEditSection(section: NoteSectionDto, e?: Event): void {
    e?.stopPropagation();
    this.isEditSection = true;
    this.sectionForm = { ...section };
    this.isSectionModalVisible = true;
  }

  saveSection(): void {
    if (!this.sectionForm.name?.trim()) {
      this.message.warning('Vui lòng nhập tên mục!');
      return;
    }
    const call = this.isEditSection
      ? this.noteService.updateSection(this.sectionForm.id, this.sectionForm)
      : this.noteService.createSection(this.sectionForm);

    call.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.isSectionModalVisible = false;
          if (this.selectedNotebook) { this.loadSections(this.selectedNotebook); }
          this.message.success(this.isEditSection ? 'Đã cập nhật mục!' : 'Đã tạo mục!');
        }
      },
    });
  }

  deleteSection(section: NoteSectionDto, e?: Event): void {
    e?.stopPropagation();
    this.noteService.deleteSection(section.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.selectedNotebook) {
            const nb = this.notebooks.find(n => n.id === this.selectedNotebook!.id);
            if (nb) nb.sections = (nb.sections || []).filter(s => s.id !== section.id);
            this.selectedNotebook = { ...this.selectedNotebook, sections: nb?.sections || [] };
          }
          if (this.selectedSection?.id === section.id) {
            this.selectedSection = null;
            this.selectedPage = null;
            this.pages = [];
            this.pageBlocks = [];
            this.updateSectionQueryParam(null);
          }
          this.message.success('Đã xóa mục!');
        },
      });
  }

  selectSectionColor(color: string): void {
    this.sectionForm.color = color;
  }

  createPage(): void {
    if (!this.selectedSection) return;
    this.noteService.createPage({
      id: '',
      sectionId: this.selectedSection.id,
      title: 'Trang mới',
      isPinned: false,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          const newPage: NotePageDto = res?.data || res;
          if (newPage?.id) {
            this.pages = [...this.pages, newPage];
            this.selectPage(newPage);
          }
        }
      },
    });
  }

  openPageRename(page: NotePageDto, e?: Event): void {
    e?.stopPropagation();
    this.pageRenameForm = { ...page };
    this.isPageRenameVisible = true;
  }

  savePageRename(): void {
    if (!this.pageRenameForm.title?.trim()) return;
    this.noteService.updatePage(this.pageRenameForm.id, this.pageRenameForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const p = this.pages.find(pg => pg.id === this.pageRenameForm.id);
          if (p) p.title = this.pageRenameForm.title;
          if (this.selectedPage?.id === this.pageRenameForm.id) {
            this.selectedPage = { ...this.selectedPage, title: this.pageRenameForm.title };
          }
          this.isPageRenameVisible = false;
        },
      });
  }

  deletePage(page: NotePageDto, e?: Event): void {
    e?.stopPropagation();
    this.noteService.deletePage(page.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.pages = this.pages.filter(p => p.id !== page.id);
          if (this.selectedPage?.id === page.id) {
            this.selectedPage = null;
            this.pageBlocks = [];
            this.saveStatus = 'saved';
            this.updatePageQueryParam(null);
          }
          this.message.success('Đã xóa trang!');
        },
      });
  }

  togglePin(page: NotePageDto, e?: Event): void {
    e?.stopPropagation();
    this.noteService.updatePage(page.id, { ...page, isPinned: !page.isPinned })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          page.isPinned = !page.isPinned;
          if (this.selectedPage?.id === page.id) {
            this.selectedPage = { ...this.selectedPage, isPinned: page.isPinned };
          }
          this.pages = [
            ...this.pages.filter(p => p.isPinned),
            ...this.pages.filter(p => !p.isPinned),
          ];
        },
      });
  }

  onPageTitleChange(): void {
    if (!this.selectedPage) return;
    const p = this.pages.find(pg => pg.id === this.selectedPage!.id);
    if (p) p.title = this.selectedPage.title;
    this.markDirty();
  }

  makeEmptyBlock(): NotePageBlockDto {
    return { id: '', pageId: this.selectedPage?.id || '', type: 'paragraph', content: '', orderNumber: 0, depth: 0 };
  }

  addBlock(type = 'paragraph'): void {
    const nb = this.makeEmptyBlock();
    nb.type = type;
    this.pageBlocks = [...this.pageBlocks, nb];
    this.markDirty();
    this.focusBlockAt(this.pageBlocks.length - 1);
  }

  addBlockAfter(index: number): void {
    const nb = this.makeEmptyBlock();
    this.pageBlocks = [
      ...this.pageBlocks.slice(0, index + 1),
      nb,
      ...this.pageBlocks.slice(index + 1),
    ];
    this.markDirty();
    this.focusBlockAt(index + 1);
  }

  deleteBlockAt(index: number): void {
    if (this.pageBlocks.length <= 1) { this.pageBlocks = [this.makeEmptyBlock()]; return; }
    this.pageBlocks = this.pageBlocks.filter((_, i) => i !== index);
    this.markDirty();
    this.focusBlockAt(Math.max(0, index - 1));
  }

  changeBlockType(block: NotePageBlockDto, type: string): void {
    block.type = type;
    if (type === 'divider') block.content = '';
    this.markDirty();
    this.activeBlockMenu = -1;
  }

  onBlockContentChange(_block: NotePageBlockDto): void {
    this.markDirty();
  }

  onBlockKeydown(event: KeyboardEvent, index: number): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.addBlockAfter(index);
    }
    if (event.key === 'Backspace') {
      const block = this.pageBlocks[index];
      const isEmpty = !block.content || block.content.trim() === '' || block.content === '0:' || block.content === '1:';
      if (isEmpty && this.pageBlocks.length > 1) {
        event.preventDefault();
        this.deleteBlockAt(index);
      }
    }
  }

  getTodoText(content: string | undefined): string {
    if (!content) return '';
    if (content.length >= 2 && (content.startsWith('0:') || content.startsWith('1:'))) {
      return content.substring(2);
    }
    return content;
  }

  getTodoChecked(content: string | undefined): boolean {
    return !!content && content.startsWith('1:');
  }

  onTodoCheckedChange(block: NotePageBlockDto, checked: boolean): void {
    const text = this.getTodoText(block.content);
    block.content = `${checked ? '1' : '0'}:${text}`;
    this.markDirty();
  }

  onTodoTextChange(block: NotePageBlockDto, text: string): void {
    const checked = this.getTodoChecked(block.content);
    block.content = `${checked ? '1' : '0'}:${text}`;
    this.markDirty();
  }

  getBlockNumber(index: number): number {
    let num = 0;
    for (let i = 0; i <= index; i++) {
      if (this.pageBlocks[i]?.type === 'numberedList') { num++; } else { num = 0; }
    }
    return num;
  }

  getBlockIcon(type: string | undefined): string {
    return this.BLOCK_TYPES.find(b => b.value === type)?.icon || 'align-left';
  }

  getBlockPlaceholder(type: string | undefined): string {
    switch (type) {
      case 'heading1': return 'Tiêu đề 1';
      case 'heading2': return 'Tiêu đề 2';
      case 'heading3': return 'Tiêu đề 3';
      case 'quote': return 'Trích dẫn...';
      case 'code': return '// Nhập code...';
      case 'bulletList': return 'Danh sách...';
      case 'numberedList': return 'Danh sách số...';
      case 'todo': return 'Công việc...';
      default: return 'Nhập nội dung...';
    }
  }

  isTextBlock(type: string | undefined): boolean {
    return type !== 'todo' && type !== 'divider';
  }

  trackBlock(index: number, block: NotePageBlockDto): string {
    return block.id || index.toString();
  }

  markDirty(): void {
    this.saveStatus = 'unsaved';
    this.autoSave$.next();
  }

  performSave(): void {
    if (!this.selectedPage || this.saveStatus === 'saved') return;
    this.saveStatus = 'saving';

    this.noteService.updatePage(this.selectedPage.id, this.selectedPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.noteService.saveBlocks(this.selectedPage.id, this.pageBlocks)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.saveStatus = res?.status !== false ? 'saved' : 'unsaved';
        },
        error: () => { this.saveStatus = 'unsaved'; },
      });
  }

  manualSave(): void {
    if (this.selectedPage && this.saveStatus !== 'saved') { this.performSave(); }
  }

  focusBlockAt(index: number): void {
    setTimeout(() => {
      const blocks = document.querySelectorAll<HTMLElement>('[data-block-index]');
      const block = Array.from(blocks).find(el => el.dataset['blockIndex'] === String(index));
      if (!block) return;
      const focusable = block.querySelector<HTMLElement>('textarea, [contenteditable="true"]');
      if (focusable) focusable.focus();
    }, 60);
  }

  triggerAutoResize(): void {
    setTimeout(() => {
      document.querySelectorAll<HTMLTextAreaElement>('.block-textarea').forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = Math.max(ta.scrollHeight, 28) + 'px';
      });
    }, 60);
  }

  onEditorAreaClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('editor-blocks') || target.classList.contains('editor-content')) {
      if (!this.pageBlocks.length || this.pageBlocks[this.pageBlocks.length - 1].content?.trim()) {
        this.addBlock();
      } else {
        this.focusBlockAt(this.pageBlocks.length - 1);
      }
    }
  }

  get pinnedPages(): NotePageDto[] { return this.pages.filter(p => p.isPinned); }
  get unpinnedPages(): NotePageDto[] { return this.pages.filter(p => !p.isPinned); }
  get selectedSections(): NoteSectionDto[] { return this.selectedNotebook?.sections || []; }

  resizable = model(true);
  sizes = signal<Array<number | string>>(['20%', '0%', '60%']);

  setSizes(sizes: Array<number | string>): void {
    this.sizes.set(sizes);
  }

  trackByIndex(index: number, item: any) {
    return item.id ?? index;
  }

  searchNoteBook() {
    if (this.noteKey) {
      this.notebooks = this.notebooks.filter(x => x.name?.toLowerCase().includes(this.noteKey.toLowerCase()))
      return
    }
    this.notebooks = this.allNotebooks
  }

  searchPage() {
    if (this.pageKey) {
      this.pages = this.pages.filter(x => x.title?.toLowerCase().includes(this.pageKey.toLowerCase()))
      return
    }
    this.pages = this.allPages
  }

  updateSizeAt(index: number, value: number | string) {
    this.sizes.update(prev => {
      const clone = [...prev]; // copy tránh mutate
      clone[index] = typeof value === 'string' ? value : `${value}%`;
      return clone;
    });
  }

  private applyRouteStateFromQuery(): void {
    const queryMap = this.route.snapshot.queryParamMap;
    this.routeSectionId = queryMap.get('sectionId') || '';
    this.routePageId = queryMap.get('pageId') || '';
  }

  private updateSectionQueryParam(sectionId: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sectionId, pageId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.routeSectionId = sectionId || '';
  }

  private updatePageQueryParam(pageId: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.routePageId = pageId || '';
  }

  get displayNotebooks(): NoteNotebookDto[] {
    return this.sidebarTab === 'personal' ? this.notebooks : this.sharedNotebooks;
  }

  onTabChange(): void {
    if (this.sidebarTab === 'shared') {
      this.loadSharedNotebooks();
    } else {
      this.loadNotebooks();
    }
  }

  loadSharedNotebooks(): void {
    this.noteService.getSharedNotebooks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.sharedNotebooks = data || [];
          if (this.sidebarTab === 'shared') {
            this.allNotebooks = [...this.sharedNotebooks];
          }
        }
      });
  }

  loadPendingShares(): void {
    this.noteService.getPendingShares()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.pendingShares = data || [];
        }
      });
  }

  openShareModal(nb: NoteNotebookDto, e?: Event): void {
    e?.stopPropagation();
    this.shareTargetItem = nb; 
    this.shareEmail = '';
    this.sharedWith = [];     
    this.isShareVisible = true;
    this.loadShares(nb.id);
  }

  loadShares(notebookId: string): void {
    this.noteService.getShares(notebookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const shares = Array.isArray(data) ? data : [];
          this.sharedWith = shares.map(s => ({ 
            id: s.id,
            name: (s.userId as string)?.split('@')[0] || s.userId || '',
            email: s.userId || '',
            userName: s.userId || '',
            role: s.role || 'view',
            status: s.status || 'Pending'
          }));
        }
      });
  }

  onShareEmailInput(value: string): void {
    this.shareSearch$.next(value);
  }

  hideShareSearchWithDelay(): void {
    setTimeout(() => {
      this.shareSearchVisible = false;
    }, 200);
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
      notebookId: this.shareTargetItem.id, 
      userId: this.shareEmail.trim(),
      role: 'view'
    };

    this.noteService.shareNotebook(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status !== false) {
            this.message.success('Đã thêm người dùng!');
            const share = res?.data ?? res;
            const selectedUser = this.shareSearchResults.find(u => u.userName === this.shareEmail) || null;
            this.sharedWith = [...this.sharedWith, {
              id: share?.id, 
              name: selectedUser?.fullName || this.shareEmail.split('@')[0],
              email: this.shareEmail.trim(),
              userName: this.shareEmail.trim(),
              avatarFileId: selectedUser?.avatarFileId ?? null,
              role: share?.role || 'view',
              status: share?.status || 'Pending'
            }];

            this.shareEmail = '';
            this.shareSearchVisible = false;
            this.shareSearchResults = []; 
          }
        },
        error: () => this.message.error('Chia sẻ thất bại!')
      });
  }

  removeShare(person: any): void {
    if (!person.id) return;
    this.noteService.removeShare(person.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('Đã gỡ bỏ chia sẻ');
          this.sharedWith = this.sharedWith.filter(p => p.id !== person.id);
        },
        error: () => this.message.error('Gỡ chia sẻ thất bại!')
      });
  }

  confirmShare(): void {
    this.isShareVisible = false;
    this.message.success('Đã cập nhật quyền chia sẻ');
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getShareStatusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Chờ xác nhận';
      case 'Accepted': return 'Đã chấp nhận';
      case 'Rejected': return 'Đã từ chối';
      default: return 'Chờ xác nhận';
    }
  }

  getShareStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'processing';
      case 'Accepted': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  }

  openInvitations(): void {
    this.isInvitationsVisible = true;
    this.loadPendingShares();
  }

  acceptShare(share: any): void {
    this.noteService.acceptShare(share.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status !== false) {
            this.message.success('Đã chấp nhận lời mời!');
            this.loadPendingShares();
            this.loadSharedNotebooks();
          }
        }
      });
  }

  rejectShare(share: any): void {
    this.noteService.rejectShare(share.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.info('Đã từ chối lời mời');
          this.loadPendingShares();
        }
      });
  }
}
