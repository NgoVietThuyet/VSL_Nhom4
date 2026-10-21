import { inject, Injectable, Injector, InjectionToken, Type } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, PRIMARY_OUTLET } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

// ─── Injection token for file viewer data ────────────────────────────────────
export interface FileViewerData {
  file: any;          // FileItem from explorer
  viewType: 'onlyoffice' | 'image' | 'video';
}
export const FILE_VIEWER_TOKEN = new InjectionToken<FileViewerData>('FILE_VIEWER_TOKEN');

// ─── AppWindow model ─────────────────────────────────────────────────────────
export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  icon: string;
  iconColor: string;
  componentRef: Type<any> | null;
  state: 'normal' | 'minimized' | 'maximized';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minWidth: number;
  minHeight: number;
  isLoading: boolean;
  /** Custom injector that provides mocked ActivatedRoute for route-based windows */
  injector?: Injector;
  /** The route URL this window represents (for deduplication) */
  routeUrl?: string;
}

// ─── App definition (for taskbar icon launcher) ───────────────────────────────
export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  componentLoader: () => Promise<Type<any>>;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton: boolean;
  description?: string;
  img?: string;
}

// ─── Route window definition (for router-based opening) ──────────────────────
interface RouteWindowDef {
  pattern: string; // e.g. 'task/board/:id'  – relative to app root, no leading /
  componentLoader: () => Promise<Type<any>>;
  title: string | ((params: Record<string, string>, query: Record<string, string>) => string);
  icon: string;
  iconColor: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton: boolean; // if true: deduplicate by routeUrl
}

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly appInjector = inject(Injector);

  private windowsSubject = new BehaviorSubject<AppWindow[]>([]);
  private maxZIndex = 100;
  private windowOffsetCount = 0;

  readonly windows$ = this.windowsSubject.asObservable();

  get windows(): AppWindow[] {
    return this.windowsSubject.value;
  }

  // ─── Taskbar app launcher registry ──────────────────────────────────────────
  readonly appRegistry: AppDefinition[] = [
    {
      id: 'home',
      title: 'Trang chủ',
      icon: 'bi bi-house-fill',
      iconColor: '#1890ff',
      componentLoader: () => import('../layouts/home/home').then(m => m.Home),
      defaultWidth: 1200, defaultHeight: 750,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Dashboard tổng quan',
      img: 'img/desktop/home.png',
    },
    {
      id: 'task',
      title: 'Công việc',
      icon: 'bi bi-kanban-fill',
      iconColor: '#52c41a',
      componentLoader: () => import('../../features/task/components/task-home/task-home').then(m => m.TaskHome),
      defaultWidth: 1100, defaultHeight: 700,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Quản lý công việc',
      img: 'img/desktop/task.png',
    },
    {
      id: 'meeting',
      title: 'Cuộc họp',
      icon: 'bi bi-camera-video-fill',
      iconColor: '#189AD6',
      componentLoader: () => import('../../features/meeting/components/home/home').then(m => m.Home),
      defaultWidth: 1100, defaultHeight: 700,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Họp trực tuyến',
      img: 'img/desktop/meeting.png',
    },
    {
      id: 'calendar',
      title: 'Lịch',
      icon: 'bi bi-calendar-event-fill',
      iconColor: '#fa8c16',
      componentLoader: () => import('../../features/calendar/components/calendar-home').then(m => m.CalendarHome),
      defaultWidth: 1000, defaultHeight: 700,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Lịch cá nhân',
      img: 'img/desktop/calendar.png',
    },
    {
      id: 'mail',
      title: 'Thư điện tử',
      icon: 'bi bi-envelope-fill',
      iconColor: '#eb2f96',
      componentLoader: () => import('../../features/mail/components/mail').then(m => m.MailComponent),
      defaultWidth: 1100, defaultHeight: 720,
      minWidth: 700, minHeight: 450,
      singleton: true,
      description: 'Thư điện tử',
      img: 'img/desktop/email.png',
    },
    {
      id: 'notes',
      title: 'Ghi chú',
      icon: 'bi bi-journal-text',
      iconColor: '#722ed1',
      componentLoader: () => import('../../features/notes/components/notes-home').then(m => m.NotesHome),
      defaultWidth: 900, defaultHeight: 650,
      minWidth: 500, minHeight: 350,
      singleton: true,
      description: 'Ghi chú cá nhân',
      img: 'img/desktop/notes.png',
    },
    {
      id: 'chat',
      title: 'Tin nhắn',
      icon: 'bi bi-chat-dots-fill',
      iconColor: '#13c2c2',
      componentLoader: () => import('../../features/chat/components/chat').then(m => m.Chat),
      defaultWidth: 1000, defaultHeight: 680,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Nhắn tin nội bộ',
      img: 'img/desktop/chat.png',
    },
    {
      id: 'documents',
      title: 'Tài liệu',
      icon: 'bi bi-file-earmark-text-fill',
      iconColor: '#1890ff',
      componentLoader: () => import('../../features/explorer/components/personal/personal').then(m => m.Personal),
      defaultWidth: 1100, defaultHeight: 700,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Quản lý tài liệu',
      img: 'img/desktop/folder.png',
    },
    {
      id: 'explorer',
      title: 'Kho lưu trữ',
      icon: 'bi bi-folder-fill',
      iconColor: '#fa541c',
      componentLoader: () => import('../../features/explorer/components/archive/archive').then(m => m.Archive),
      defaultWidth: 1100, defaultHeight: 720,
      minWidth: 700, minHeight: 450,
      singleton: false,
      description: 'Kho lưu trữ file',
      img: 'img/desktop/database.png',
    },
    {
      id: 'chat-bot',
      title: 'Trợ lý AI',
      icon: 'bi bi-robot',
      iconColor: '#f759ab',
      componentLoader: () => import('../../features/chat-bot/components/chat-bot').then(m => m.ChatBot),
      defaultWidth: 900, defaultHeight: 680,
      minWidth: 500, minHeight: 400,
      singleton: true,
      description: 'Trợ lý AI',
      img: 'img/desktop/robot.png',
    },
    {
      id: 'contact',
      title: 'Danh bạ',
      icon: 'bi bi-person-lines-fill',
      iconColor: '#13a63a',
      componentLoader: () => import('../../features/system-manager/components/contact/contact').then(m => m.Contact),
      defaultWidth: 1000, defaultHeight: 700,
      minWidth: 600, minHeight: 400,
      singleton: true,
      description: 'Quản lý danh bạ cá nhân',
      img: 'img/desktop/contacts.png',
    },
  ];

  // ─── Route registry – maps URL patterns to window definitions ──────────────
  private readonly routeRegistry: RouteWindowDef[] = [
    // ── Home ──────────────────────────────────────────────────────────────────
    {
      pattern: 'home',
      componentLoader: () => import('../layouts/home/home').then(m => m.Home),
      title: 'Trang chủ', icon: 'bi bi-house-fill', iconColor: '#1890ff',
      defaultWidth: 1200, defaultHeight: 750, minWidth: 600, minHeight: 400, singleton: true,
    },
    // ── Task ──────────────────────────────────────────────────────────────────
    {
      pattern: 'task',
      componentLoader: () => import('../../features/task/components/task-home/task-home').then(m => m.TaskHome),
      title: 'Công việc', icon: 'bi bi-kanban-fill', iconColor: '#52c41a',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'task/home',
      componentLoader: () => import('../../features/task/components/task-home/task-home').then(m => m.TaskHome),
      title: 'Công việc', icon: 'bi bi-kanban-fill', iconColor: '#52c41a',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'task/board/:id',
      componentLoader: () => import('../../features/task/components/board/board').then(m => m.Board),
      title: (params) => `Bảng công việc`,
      icon: 'bi bi-kanban', iconColor: '#52c41a',
      defaultWidth: 1200, defaultHeight: 750, minWidth: 700, minHeight: 500, singleton: false,
    },
    // ── Meeting ───────────────────────────────────────────────────────────────
    {
      pattern: 'meeting',
      componentLoader: () => import('../../features/meeting/components/home/home').then(m => m.Home),
      title: 'Cuộc họp', icon: 'bi bi-camera-video-fill', iconColor: '#189AD6',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'meeting/home',
      componentLoader: () => import('../../features/meeting/components/home/home').then(m => m.Home),
      title: 'Cuộc họp', icon: 'bi bi-camera-video-fill', iconColor: '#189AD6',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'meeting/detail/:meetingId',
      componentLoader: () => import('../../features/meeting/components/meeting/meeting').then(m => m.Meeting),
      title: 'Chi tiết cuộc họp', icon: 'bi bi-camera-video', iconColor: '#189AD6',
      defaultWidth: 1400, defaultHeight: 850, minWidth: 900, minHeight: 600, singleton: false,
    },
    // ── Calendar ──────────────────────────────────────────────────────────────
    {
      pattern: 'calendar',
      componentLoader: () => import('../../features/calendar/components/calendar-home').then(m => m.CalendarHome),
      title: 'Lịch', icon: 'bi bi-calendar-event-fill', iconColor: '#fa8c16',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    // ── Mail ──────────────────────────────────────────────────────────────────
    {
      pattern: 'mail',
      componentLoader: () => import('../../features/mail/components/mail').then(m => m.MailComponent),
      title: 'Thư điện tử', icon: 'bi bi-envelope-fill', iconColor: '#eb2f96',
      defaultWidth: 1100, defaultHeight: 720, minWidth: 700, minHeight: 450, singleton: true,
    },
    // ── Notes ─────────────────────────────────────────────────────────────────
    {
      pattern: 'notes',
      componentLoader: () => import('../../features/notes/components/notes-home').then(m => m.NotesHome),
      title: 'Ghi chú', icon: 'bi bi-journal-text', iconColor: '#722ed1',
      defaultWidth: 900, defaultHeight: 650, minWidth: 500, minHeight: 350, singleton: true,
    },
    // ── Chat ──────────────────────────────────────────────────────────────────
    {
      pattern: 'chat',
      componentLoader: () => import('../../features/chat/components/chat').then(m => m.Chat),
      title: 'Tin nhắn', icon: 'bi bi-chat-dots-fill', iconColor: '#13c2c2',
      defaultWidth: 1000, defaultHeight: 680, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'chat-bot',
      componentLoader: () => import('../../features/chat-bot/components/chat-bot').then(m => m.ChatBot),
      title: 'Trợ lý AI', icon: 'bi bi-robot', iconColor: '#f759ab',
      defaultWidth: 900, defaultHeight: 680, minWidth: 500, minHeight: 400, singleton: true,
    },
    // ── Documents ─────────────────────────────────────────────────────────────
    {
      pattern: 'documents',
      componentLoader: () => import('../../features/documents/components/documents').then(m => m.Documents),
      title: 'Tài liệu', icon: 'bi bi-file-earmark-text-fill', iconColor: '#1890ff',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    // ── Explorer ──────────────────────────────────────────────────────────────
    {
      pattern: 'explorer',
      componentLoader: () => import('../../features/explorer/components/personal/personal').then(m => m.Personal),
      title: 'Kho lưu trữ', icon: 'bi bi-folder-fill', iconColor: '#fa541c',
      defaultWidth: 1100, defaultHeight: 720, minWidth: 700, minHeight: 450, singleton: false,
    },
    {
      pattern: 'explorer/personal',
      componentLoader: () => import('../../features/explorer/components/personal/personal').then(m => m.Personal),
      title: 'Kho lưu trữ - Cá nhân', icon: 'bi bi-folder-fill', iconColor: '#fa541c',
      defaultWidth: 1100, defaultHeight: 720, minWidth: 700, minHeight: 450, singleton: false,
    },
    {
      pattern: 'explorer/archive',
      componentLoader: () => import('../../features/explorer/components/archive/archive').then(m => m.Archive),
      title: 'Kho lưu trữ - Lưu trữ', icon: 'bi bi-archive-fill', iconColor: '#fa541c',
      defaultWidth: 1100, defaultHeight: 720, minWidth: 700, minHeight: 450, singleton: true,
    },
    // ── System Manager ────────────────────────────────────────────────────────
    {
      pattern: 'system-manager/profile',
      componentLoader: () => import('../../features/system-manager/components/profile/profile').then(m => m.Profile),
      title: 'Thông tin cá nhân', icon: 'bi bi-person-fill', iconColor: '#595959',
      defaultWidth: 900, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/document-system',
      componentLoader: () => import('../../features/system-manager/components/document-system/document-system').then(m => m.DocumentSystem),
      title: 'Tài liệu hệ thống', icon: 'bi bi-book-fill', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/account',
      componentLoader: () => import('../../features/system-manager/components/account/account').then(m => m.Account),
      title: 'Tài khoản', icon: 'bi bi-people-fill', iconColor: '#595959',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/account-group',
      componentLoader: () => import('../../features/system-manager/components/account-group/account-group').then(m => m.AccountGroup),
      title: 'Nhóm tài khoản', icon: 'bi bi-diagram-3-fill', iconColor: '#595959',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/contact',
      componentLoader: () => import('../../features/system-manager/components/contact/contact').then(m => m.Contact),
      title: 'Danh bạ', icon: 'bi bi-person-lines-fill', iconColor: '#13a63a',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/menu',
      componentLoader: () => import('../../features/system-manager/components/menu/menu').then(m => m.Menu),
      title: 'Menu hệ thống', icon: 'bi bi-list-ul', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/right',
      componentLoader: () => import('../../features/system-manager/components/right/right').then(m => m.Right),
      title: 'Phân quyền', icon: 'bi bi-shield-fill', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/log-system',
      componentLoader: () => import('../../features/system-manager/components/log-system/log-system').then(m => m.LogSystem),
      title: 'Log hệ thống', icon: 'bi bi-journal-code', iconColor: '#595959',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/status-system',
      componentLoader: () => import('../../features/system-manager/components/status-system/status-system').then(m => m.StatusSystem),
      title: 'Trạng thái hệ thống', icon: 'bi bi-activity', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/background-jobs',
      componentLoader: () => import('../../features/system-manager/components/background-jobs/background-jobs').then(m => m.BackgroundJobs),
      title: 'Background Jobs', icon: 'bi bi-gear-wide-connected', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/history-login',
      componentLoader: () => import('../../features/system-manager/components/history-login/history-login').then(m => m.HistoryLogin),
      title: 'Lịch sử đăng nhập', icon: 'bi bi-clock-history', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/status-integration',
      componentLoader: () => import('../../features/system-manager/components/status-integration/status-integration').then(m => m.StatusIntegration),
      title: 'Tích hợp hệ thống', icon: 'bi bi-plug-fill', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/message-system',
      componentLoader: () => import('../../features/system-manager/components/message-system/message-system').then(m => m.MessageSystem),
      title: 'Tin nhắn hệ thống', icon: 'bi bi-bell-fill', iconColor: '#595959',
      defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: true,
    },
    {
      pattern: 'system-manager/sync-update',
      componentLoader: () => import('../../features/system-manager/components/sync-update/sync-update').then(m => m.SyncUpdate),
      title: 'Sync Update', icon: 'bi bi-arrow-repeat', iconColor: '#595959',
      defaultWidth: 1100, defaultHeight: 700, minWidth: 700, minHeight: 450, singleton: true,
    },
  ];

  // ─── Open app by ID (taskbar icon click) ─────────────────────────────────
  openApp(appId: string): void {
    const appDef = this.appRegistry.find(a => a.id === appId);
    if (!appDef) return;

    if (appDef.singleton) {
      const existing = this.windows.find(w => w.appId === appId);
      if (existing) {
        if (existing.state === 'minimized') {
          this.updateWindow(existing.id, { state: 'normal', zIndex: ++this.maxZIndex });
        } else {
          this.updateWindow(existing.id, { zIndex: ++this.maxZIndex });
        }
        return;
      }
    }

    const { x, y, w, h } = this.calcPosition(appDef.defaultWidth, appDef.defaultHeight);
    const id = this.makeId();
    const win: AppWindow = {
      id, appId,
      title: appDef.title,
      icon: appDef.icon,
      iconColor: appDef.iconColor,
      componentRef: null,
      state: 'normal',
      x, y, width: w, height: h,
      zIndex: ++this.maxZIndex,
      minWidth: appDef.minWidth,
      minHeight: appDef.minHeight,
      isLoading: true,
    };

    this.windowsSubject.next([...this.windows, win]);
    appDef.componentLoader().then(c => this.updateWindow(id, { componentRef: c, isLoading: false }))
      .catch(() => this.updateWindow(id, { isLoading: false }));
  }

  // ─── Open window by route URL (called by guard and internal navigation) ──
  openRoute(rawUrl: string): boolean {
    // Normalise: strip leading slash and query string from path
    const [pathPart, queryPart] = rawUrl.replace(/^\//, '').split('?');

    const queryParams: Record<string, string> = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      });
    }

    // Find matching route definition
    let matched: RouteWindowDef | null = null;
    let routeParams: Record<string, string> = {};

    for (const def of this.routeRegistry) {
      const params = this.matchPattern(pathPart, def.pattern);
      if (params !== null) {
        matched = def;
        routeParams = params;
        break;
      }
    }

    if (!matched) return false;

    // Deduplication for singleton routes
    const routeUrl = rawUrl;
    if (matched.singleton) {
      const existing = this.windows.find(
        w => w.appId === `route:${matched!.pattern}` ||
          (matched!.singleton && w.routeUrl && this.sameBasePath(w.routeUrl, routeUrl))
      );
      if (existing) {
        this.focusWindow(existing.id);
        return true;
      }
    }

    const title = typeof matched.title === 'function'
      ? matched.title(routeParams, queryParams)
      : matched.title;

    const { x, y, w, h } = this.calcPosition(matched.defaultWidth, matched.defaultHeight);
    const id = this.makeId();

    const win: AppWindow = {
      id,
      appId: `route:${matched.pattern}`,
      title,
      icon: matched.icon,
      iconColor: matched.iconColor,
      componentRef: null,
      state: 'normal',
      x, y, width: w, height: h,
      zIndex: ++this.maxZIndex,
      minWidth: matched.minWidth,
      minHeight: matched.minHeight,
      isLoading: true,
      routeUrl,
    };

    this.windowsSubject.next([...this.windows, win]);

    const def = matched;
    def.componentLoader().then(component => {
      const injector = this.createRouteInjector(routeParams, queryParams);
      this.updateWindow(id, { componentRef: component, injector, isLoading: false });
    }).catch(() => this.updateWindow(id, { isLoading: false }));

    return true;
  }

  // ─── Open file viewer window (from Explorer in window mode) ──────────────
  openFileViewer(file: any): void {
    const ext = (file.name as string).substring((file.name as string).lastIndexOf('.')).toLowerCase();
    const officeExt = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
    const imageExt = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    const videoExt = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];

    let viewType: 'onlyoffice' | 'image' | 'video' = 'onlyoffice';
    if (imageExt.includes(ext)) viewType = 'image';
    else if (videoExt.includes(ext)) viewType = 'video';
    else if (!officeExt.includes(ext)) return; // unsupported

    // Deduplicate by file id
    const existing = this.windows.find(w => w.routeUrl === `file:${file.id}`);
    if (existing) {
      this.focusWindow(existing.id);
      return;
    }

    const id = this.makeId();
    const win: AppWindow = {
      id,
      appId: 'file-viewer',
      title: file.name,
      icon: viewType === 'image' ? 'bi bi-image-fill' : viewType === 'video' ? 'bi bi-film' : 'bi bi-file-earmark-text-fill',
      iconColor: '#fa8c16',
      componentRef: null,
      state: 'normal',
      x: 0, y: 0, width: 0, height: 0,
      zIndex: ++this.maxZIndex,
      minWidth: 400, minHeight: 300,
      isLoading: true,
      routeUrl: `file:${file.id}`,
    };

    const fileData: FileViewerData = { file, viewType };
    const injector = this.createFileViewerInjector(fileData);

    const { x, y, w, h } = this.calcPosition(
      viewType === 'image' ? 900 : viewType === 'video' ? 900 : 1100,
      viewType === 'onlyoffice' ? 700 : 600,
    );
    Object.assign(win, { x, y, width: w, height: h });

    this.windowsSubject.next([...this.windows, win]);

    import('../layouts/file-viewer-window/file-viewer-window').then(m => {
      this.updateWindow(id, { componentRef: m.FileViewerWindow, injector, isLoading: false });
    }).catch(() => this.updateWindow(id, { isLoading: false }));
  }

  // ─── Window state management ─────────────────────────────────────────────
  closeWindow(id: string): void {
    this.windowsSubject.next(this.windows.filter(w => w.id !== id));
  }

  minimizeWindow(id: string): void {
    this.updateWindow(id, { state: 'minimized' });
  }

  toggleMaximize(id: string): void {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;
    if (win.state === 'maximized') {
      this.updateWindow(id, { state: 'normal' });
    } else {
      this.updateWindow(id, { state: 'maximized', zIndex: ++this.maxZIndex });
    }
  }

  focusWindow(id: string): void {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;
    this.updateWindow(id, {
      state: win.state === 'minimized' ? 'normal' : win.state,
      zIndex: ++this.maxZIndex,
    });
  }

  updateWindowPosition(id: string, x: number, y: number): void {
    this.updateWindow(id, { x, y });
  }

  updateWindowSize(id: string, width: number, height: number): void {
    this.updateWindow(id, { width, height });
  }

  updateWindowBounds(id: string, x: number, y: number, width: number, height: number): void {
    this.updateWindow(id, { x, y, width, height });
  }

  isActiveWindow(id: string): boolean {
    const visible = this.windows.filter(w => w.state !== 'minimized');
    if (!visible.length) return false;
    const top = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
    return top.id === id;
  }

  isAppRunning(appId: string): boolean {
    return this.windows.some(w => w.appId === appId);
  }

  getRunningCountByApp(appId: string): number {
    return this.windows.filter(w => w.appId === appId).length;
  }

  closeAll(): void {
    this.windowsSubject.next([]);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private updateWindow(id: string, changes: Partial<AppWindow>): void {
    this.windowsSubject.next(
      this.windows.map(w => (w.id === id ? { ...w, ...changes } : w))
    );
  }

  private makeId(): string {
    return `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private calcPosition(
    defaultWidth: number,
    defaultHeight: number,
  ): { x: number; y: number; w: number; h: number } {
    const offset = (this.windowOffsetCount % 10) * 28;
    this.windowOffsetCount++;
    const taskbarH = 48;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight - taskbarH;
    const w = Math.min(defaultWidth, screenW - 40);
    const h = Math.min(defaultHeight, screenH - 40);
    const x = Math.max(20, (screenW - w) / 2 + offset);
    const y = Math.max(20, (screenH - h) / 2 + offset);
    return { x, y, w, h };
  }

  /**
   * Match a URL path against a pattern like 'task/board/:id'.
   * Returns extracted params or null if not matched.
   */
  private matchPattern(
    path: string,
    pattern: string,
  ): Record<string, string> | null {
    const pathParts = path.split('/');
    const patternParts = pattern.split('/');
    if (pathParts.length !== patternParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  /** Compare two route URLs ignoring query strings */
  private sameBasePath(a: string, b: string): boolean {
    return a.split('?')[0] === b.split('?')[0];
  }

  /**
   * Create a custom Injector that provides a mock ActivatedRoute
   * with the given route params and query params.
   */
  private createRouteInjector(
    params: Record<string, string>,
    queryParams: Record<string, string>,
  ): Injector {
    const mockRoute = this.buildMockActivatedRoute(params, queryParams);
    return Injector.create({
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
      parent: this.appInjector,
    });
  }

  /**
   * Create a custom Injector that provides FILE_VIEWER_TOKEN data.
   */
  private createFileViewerInjector(data: FileViewerData): Injector {
    return Injector.create({
      providers: [{ provide: FILE_VIEWER_TOKEN, useValue: data }],
      parent: this.appInjector,
    });
  }

  /**
   * Build a minimal mock ActivatedRoute that satisfies common component usage
   * (params.subscribe, queryParams.subscribe, snapshot.params).
   */
  private buildMockActivatedRoute(
    params: Record<string, string>,
    queryParams: Record<string, string>,
  ): Partial<ActivatedRoute> {
    const paramMap = convertToParamMap(params);
    const queryParamMap = convertToParamMap(queryParams);

    const snapshot = {
      params,
      queryParams,
      data: {},
      url: [],
      fragment: null,
      outlet: PRIMARY_OUTLET,
      component: null,
      routeConfig: null,
      paramMap,
      queryParamMap,
      title: undefined,
      root: null,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
    } as unknown as ActivatedRouteSnapshot;

    return {
      params: new BehaviorSubject(params).asObservable(),
      queryParams: new BehaviorSubject(queryParams).asObservable(),
      paramMap: new BehaviorSubject(paramMap).asObservable(),
      queryParamMap: new BehaviorSubject(queryParamMap).asObservable(),
      data: of({}),
      url: of([]),
      fragment: of(null),
      title: of(undefined),
      snapshot,
      outlet: PRIMARY_OUTLET,
      component: null,
      routeConfig: null,
      root: null as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
    };
  }
}
