import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { SharedModules } from '../../../ng-zorro.module';

type GestureType = 'none' | 'point' | 'pinch' | 'scroll' | 'fist' | 'palm' | 'three_fingers' | 'double_click';

interface GestureInfo {
  key: GestureType;
  emoji: string;
  label: string;
  desc: string;
  color: string;
}

const GESTURES: GestureInfo[] = [
  { key: 'point',         emoji: '☝️',  label: 'Di chuyển',    desc: 'Chỉ giơ ngón trỏ (xa camera OK)', color: '#1890ff' },
  { key: 'pinch',         emoji: '🤏',  label: 'Click trái',   desc: 'Chụm ngón cái + trỏ lại',       color: '#52c41a' },
  { key: 'double_click',  emoji: '👆👆', label: 'Double click', desc: 'Chụm ngón cái+trỏ 2 lần nhanh', color: '#13c2c2' },
  { key: 'scroll',        emoji: '✌️',  label: 'Cuộn trang',   desc: 'Trỏ + giữa, di lên/xuống',      color: '#faad14' },
  { key: 'three_fingers', emoji: '🤘',  label: 'Click phải',   desc: 'Giơ 3 ngón: trỏ+giữa+nhẫn',    color: '#722ed1' },
  { key: 'fist',          emoji: '✊',  label: 'Giữ & kéo',    desc: 'Nắm tay, di chuyển để kéo',     color: '#fa541c' },
  { key: 'palm',          emoji: '🖐️', label: 'Tạm dừng',     desc: 'Xòe cả 5 ngón tay',             color: '#8c8c8c' },
];

@Component({
  selector: 'app-hand-control',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './hand-control.html',
  styleUrl: './hand-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandControl implements AfterViewInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorEl') cursorRef!: ElementRef<HTMLElement>;
  @ViewChild('panelEl') panelRef!: ElementRef<HTMLElement>;

  isLoading = true;
  isMpReady = false;
  isTracking = false;
  isMinimized = false;
  isShowGuide = true;
  error: string | null = null;

  gestures = GESTURES;
  currentGesture: GestureType = 'none';

  private hands: any = null;
  private stream: MediaStream | null = null;
  private mpAnimId: number | null = null;
  private previewAnimId: number | null = null;
  private interactionAnimId: number | null = null;
  private isBusy = false;
  private lastHandResults: any = null;
  private latestLm: any[] | null = null;
  private latestGesture: GestureType = 'none';
  private handVisible = false;
  private targetX = 0;
  private targetY = 0;
  private previewFrame = 0;
  private cursorRaiseTick = 0;
  private lastCursorGesture: GestureType = 'none';
  private lastExecuteAt = 0;
  private scrollTargetCache: HTMLElement | null = null;
  private scrollHandY = 0;
  private smoothScrollY = 0;
  private mpFeedCanvas: HTMLCanvasElement | null = null;
  private mpFeedCtx: CanvasRenderingContext2D | null = null;
  private mpInitialized = false;
  private mpSimdFallbackTried = false;
  private readonly MP_MAX_W = 480;
  private readonly MP_MAX_H = 360;
  private mpFramesSent = 0;
  private mpReadyWatchdog: ReturnType<typeof setTimeout> | null = null;
  private cameraReadyResolve: (() => void) | null = null;
  private readonly cameraReady = new Promise<void>(resolve => {
    this.cameraReadyResolve = resolve;
  });

  private sx = 0;
  private sy = 0;
  private readonly SMOOTH = 0.68;
  /** Độ nhạy con trỏ: >1 = di chuyển xa hơn với ít cử động tay (đứng xa camera) */
  private readonly CURSOR_SENSITIVITY = 2.2;
  /** Vùng tay trong khung camera được ánh xạ full màn hình (0.1 = bỏ 10% mép) */
  private readonly CURSOR_FRAME_PAD = 0.08;

  private pinchActive = false;
  private pinchAt = 0;
  private readonly PINCH_THR = 0.07;
  private readonly PINCH_MS = 120;
  private readonly DOUBLE_CLICK_MS = 280;
  private lastClick = 0;
  private lastPinchClickAt = 0;
  private pendingClickTimer: ReturnType<typeof setTimeout> | null = null;

  private scrolling = false;
  private lastScrollY = 0;

  private fistDragging = false;
  private dragTarget: Element | null = null;

  private lastRightClick = 0;
  private lastHoverTarget: Element | null = null;
  private lastUiGesture: GestureType = 'none';

  private panelDragging = false;
  private dragDx = 0;
  private dragDy = 0;
  private panelLeft = Math.max(280, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 340);
  private panelTop = 80;

  private readonly onMouseMove = (e: MouseEvent) => {
    if (!this.panelDragging) return;
    const left = Math.max(0, Math.min(window.innerWidth - 310, e.clientX - this.dragDx));
    const top = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - this.dragDy));
    const panel = this.panelRef?.nativeElement;
    if (panel) {
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }
    this.panelLeft = left;
    this.panelTop = top;
  };

  private readonly onMouseUp = () => {
    this.panelDragging = false;
  };

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  get currentGestureInfo(): GestureInfo | undefined {
    return this.currentGesture !== 'none'
      ? GESTURES.find(g => g.key === this.currentGesture)
      : undefined;
  }

  ngAfterViewInit() {
    const panel = this.panelRef.nativeElement;
    panel.style.left = `${this.panelLeft}px`;
    panel.style.top = `${this.panelTop}px`;

    // Đưa con trỏ ra body để luôn nổi trên modal/drawer (tránh stacking context)
    const cursor = this.cursorRef.nativeElement;
    cursor.style.zIndex = '2147483647';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    this.targetX = window.innerWidth / 2;
    this.targetY = window.innerHeight / 2;
    this.sx = this.targetX;
    this.sy = this.targetY;

    this.ngZone.runOutsideAngular(() => {
      void this.startCamera();
      void this.initMediaPipe();
      this.startInteractionLoop();
    });
  }

  ngOnDestroy() {
    this.cleanup();
    this.cursorRef?.nativeElement?.remove();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  close() {
    this.cleanup();
    this.closed.emit();
  }

  toggleGuide() { this.isShowGuide = !this.isShowGuide; }
  toggleMinimize() { this.isMinimized = !this.isMinimized; }

  onHeaderMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.panel-btns')) return;
    this.panelDragging = true;
    this.dragDx = e.clientX - this.panelLeft;
    this.dragDy = e.clientY - this.panelTop;
    e.preventDefault();
  }

  private mpDisabled = false;
  private static handsScriptLoad: Promise<void> | null = null;
  /** SIMD wasm hay gây RuntimeError OOB trên PC/Android — mặc định dùng wasm thường */
  private static forceNonSimdWasm = true;
  private static readonly MP_SIMD_PROBE = new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11,
  ]);

  /** Đường dẫn tương đối — MediaPipe locateFile BẮT BUỘC dùng relative (không dùng full URL) */
  private locateFileForMp(file: string): string {
    const base = document.querySelector('base')?.getAttribute('href') ?? '/';
    let root = base;
    if (!root.startsWith('/') && !root.startsWith('http')) {
      root = `/${root}`;
    }
    if (!root.endsWith('/')) {
      root += '/';
    }
    return `${root}assets/mediapipe/${file}`;
  }

  /** URL đầy đủ chỉ để fetch kiểm tra / load script */
  private resolveMediaPipeUrl(file: string): string {
    const path = this.locateFileForMp(file);
    if (path.startsWith('http')) {
      return path;
    }
    return new URL(path, window.location.origin).href;
  }

  private async verifyMediaPipeAssets(): Promise<void> {
    for (const file of ['hands.js', 'hands_solution_packed_assets.data']) {
      const url = this.resolveMediaPipeUrl(file);
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(
          `Không tìm thấy ${file} (${res.status}). Build: "npm run build" (có verify:mediapipe), deploy cả thư mục dist/PROJECT.CLI/browser/ lên server, gồm assets/mediapipe/.`
        );
      }
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('text/html')) {
        throw new Error(
          `File ${file} trả về HTML (404). Chạy "npm run sync:mediapipe" rồi khởi động lại "ng serve".`
        );
      }
    }
  }

  private async initMediaPipe() {
    if (this.mpDisabled) return;

    try {
      await this.cameraReady;
      await this.verifyMediaPipeAssets();
      HandControl.patchMediaPipeSimdProbe(HandControl.forceNonSimdWasm);

      await this.createHandsInstance();
      await this.initializeHandsBlocking();
      this.mpInitialized = true;

      this.hands.onResults((results: any) => this.onResults(results));
      this.startMediaPipeLoop();

      this.mpReadyWatchdog = setTimeout(() => this.checkMpReadyWatchdog(), 8000);
    } catch (err: any) {
      this.mpDisabled = true;
      this.ngZone.run(() => {
        this.error = err?.message ?? String(err);
        this.cdr.markForCheck();
      });
    }
  }

  private async createHandsInstance() {
    const HandsClass = await this.loadHandsConstructor();
    this.hands?.close?.();
    this.hands = new HandsClass({
      locateFile: (file: string) => this.locateFileForMp(file),
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.4,
      ...(this.preferCpuInference() ? { useCpuInference: true } : {}),
    });
  }

  /** Android: CPU ổn định hơn; PC dùng WASM nhanh hơn */
  private preferCpuInference(): boolean {
    return /android/i.test(navigator.userAgent);
  }

  private async initializeHandsBlocking() {
    if (typeof this.hands?.initialize !== 'function') {
      return;
    }
    await Promise.race([
      this.hands.initialize(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('initialize timeout')), 20000)
      ),
    ]);
  }

  /** Chặn probe SIMD của MediaPipe → luôn load hands_solution_wasm_bin (không SIMD) */
  private static patchMediaPipeSimdProbe(disableSimd: boolean) {
    if (!disableSimd) return;
    const w = window as any;
    if (w.__handControlSimdProbePatched) return;
    w.__handControlSimdProbePatched = true;
    const probe = HandControl.MP_SIMD_PROBE;
    const orig = WebAssembly.instantiate.bind(WebAssembly);
    WebAssembly.instantiate = ((buffer: BufferSource, imports?: WebAssembly.Imports) => {
      if (buffer instanceof Uint8Array && buffer.length === probe.length) {
        let match = true;
        for (let i = 0; i < probe.length; i++) {
          if (buffer[i] !== probe[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          return Promise.reject(new WebAssembly.CompileError('hand-control: non-SIMD wasm'));
        }
      }
      return orig(buffer, imports);
    }) as typeof WebAssembly.instantiate;
  }

  private async recoverFromWasmCrash(err: unknown): Promise<boolean> {
    const msg = err instanceof Error ? err.message : String(err);
    if (this.mpSimdFallbackTried || !/out of bounds|RuntimeError|abort/i.test(msg)) {
      return false;
    }
    this.mpSimdFallbackTried = true;
    this.mpInitialized = false;
    this.isBusy = false;
    HandControl.forceNonSimdWasm = true;
    HandControl.patchMediaPipeSimdProbe(true);
    try {
      await this.createHandsInstance();
      await this.initializeHandsBlocking();
      this.mpInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private checkMpReadyWatchdog() {
    if (this.isMpReady || this.mpDisabled || this.error) return;
    if (this.mpFramesSent > 5) {
      this.ngZone.run(() => {
        this.error =
          'Nhận diện tay chưa phản hồi. Thử tải lại trang hoặc dùng Chrome Android bản mới.';
        this.cdr.markForCheck();
      });
    }
  }

  private setMpReady() {
    if (this.isMpReady) return;
    this.isMpReady = true;
    if (this.mpReadyWatchdog) {
      clearTimeout(this.mpReadyWatchdog);
      this.mpReadyWatchdog = null;
    }
    this.ngZone.run(() => this.cdr.markForCheck());
  }

  /** Crop center giống object-fit:cover (dùng chung preview + MP) */
  private videoCoverCrop(vw: number, vh: number, cw: number, ch: number) {
    const scale = Math.max(cw / vw, ch / vh);
    const cropW = cw / scale;
    const cropH = ch / scale;
    return {
      sX: (vw - cropW) / 2,
      sY: (vh - cropH) / 2,
      cropW,
      cropH,
    };
  }

  /** Landmark 0–1 (frame gốc) → pixel canvas preview (đã mirror selfie + cover) */
  private landmarkToCanvas(
    nx: number,
    ny: number,
    vw: number,
    vh: number,
    cw: number,
    ch: number,
  ): { x: number; y: number } {
    const { sX, sY, cropW, cropH } = this.videoCoverCrop(vw, vh, cw, ch);
    const scale = Math.max(cw / vw, ch / vh);
    const mirX = 1 - nx;
    return {
      x: (mirX * vw - sX) * scale,
      y: (ny * vh - sY) * scale,
    };
  }

  /** Gửi frame thô (không mirror) — tránh đảo ngược tọa độ với mapFingerToScreen */
  private getMpImageSource(): HTMLCanvasElement | null {
    const video = this.videoRef.nativeElement;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw < 64 || vh < 64) return null;

    if (!this.mpFeedCanvas) {
      this.mpFeedCanvas = document.createElement('canvas');
      this.mpFeedCtx = this.mpFeedCanvas.getContext('2d');
    }
    if (!this.mpFeedCtx) return null;

    const tw = Math.max(64, Math.min(this.MP_MAX_W, vw));
    const th = Math.max(64, Math.min(this.MP_MAX_H, Math.round((vh / vw) * tw)));
    if (this.mpFeedCanvas.width !== tw) this.mpFeedCanvas.width = tw;
    if (this.mpFeedCanvas.height !== th) this.mpFeedCanvas.height = th;

    const { sX, sY, cropW, cropH } = this.videoCoverCrop(vw, vh, tw, th);
    this.mpFeedCtx.drawImage(video, sX, sY, cropW, cropH, 0, 0, tw, th);
    return this.mpFeedCanvas;
  }

  /**
   * Chỉ load hands.js qua thẻ script → window.Hands.
   * Không import('@mediapipe/hands') — tránh 2 bản Module冲突 và lỗi packed_assets.
   */
  private async loadHandsConstructor(): Promise<new (config: { locateFile: (f: string) => string }) => any> {
    await this.ensureHandsScript();

    const HandsClass = this.getHandsFromWindow();
    if (!HandsClass) {
      throw new Error(
        'Không tải được MediaPipe Hands. Chạy "npm run sync:mediapipe" và tải lại trang.'
      );
    }
    return HandsClass;
  }

  private getHandsFromWindow(): (new (config: { locateFile: (f: string) => string }) => any) | null {
    const w = window as any;
    return typeof w.Hands === 'function' ? w.Hands : null;
  }

  private ensureHandsScript(): Promise<void> {
    if (this.getHandsFromWindow()) {
      return Promise.resolve();
    }
    if (!HandControl.handsScriptLoad) {
      HandControl.handsScriptLoad = this.injectHandsScript();
    }
    return HandControl.handsScriptLoad;
  }

  private injectHandsScript(): Promise<void> {
    HandControl.patchMediaPipeSimdProbe(HandControl.forceNonSimdWasm);
    const src = this.resolveMediaPipeUrl('hands.js');
    const existing = document.querySelector('script[data-mp-hands="1"]');
    if (existing) {
      return this.waitForHandsGlobal(15000);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-mp-hands', '1');
      script.onload = () => {
        this.waitForHandsGlobal(15000).then(resolve).catch(reject);
      };
      script.onerror = () => {
        HandControl.handsScriptLoad = null;
        reject(new Error('Không tải được assets/mediapipe/hands.js'));
      };
      document.head.appendChild(script);
    });
  }

  private waitForHandsGlobal(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const check = () => {
        if (this.getHandsFromWindow()) {
          resolve();
          return;
        }
        if (performance.now() - start > timeoutMs) {
          reject(new Error('MediaPipe Hands script đã tải nhưng constructor chưa sẵn sàng.'));
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  private async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
      });

      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      video.muted = true;
      video.playsInline = true;

      let previewStarted = false;
      const onReady = async () => {
        if (previewStarted) return;
        previewStarted = true;
        try {
          await video.play();
        } catch {
          /* autoplay policy */
        }
        this.cameraReadyResolve?.();
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
        this.startPreviewLoop();
      };

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        await onReady();
      } else {
        video.addEventListener('canplay', () => void onReady(), { once: true });
      }
    } catch (err: any) {
      this.cameraReadyResolve?.();
      this.ngZone.run(() => {
        this.error = 'Không thể truy cập camera: ' + (err?.message ?? String(err));
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  private startPreviewLoop() {
    const tick = () => {
      if (!this.stream) return;
      this.previewFrame++;
      this.drawPreview();
      this.previewAnimId = requestAnimationFrame(tick);
    };
    if (this.previewAnimId !== null) cancelAnimationFrame(this.previewAnimId);
    this.previewAnimId = requestAnimationFrame(tick);
  }

  /** 60fps: con trỏ mượt + cuộn/kéo liên tục, tách khỏi tốc độ MediaPipe */
  private startInteractionLoop() {
    const tick = () => {
      if (this.handVisible && this.latestLm) {
        this.sx += (this.targetX - this.sx) * this.SMOOTH;
        this.sy += (this.targetY - this.sy) * this.SMOOTH;
        this.updateCursorDom(this.sx, this.sy, this.latestGesture);
        if (this.latestGesture === 'scroll') {
          this.smoothScrollY += (this.scrollHandY - this.smoothScrollY) * 0.45;
          this.processScrollFrame();
        } else {
          this.runGestureActions(this.latestGesture, this.latestLm);
        }
      } else if (!this.handVisible) {
        this.updateCursorDom(-200, -200, 'none');
      }
      this.interactionAnimId = requestAnimationFrame(tick);
    };
    if (this.interactionAnimId !== null) cancelAnimationFrame(this.interactionAnimId);
    this.interactionAnimId = requestAnimationFrame(tick);
  }

  private startMediaPipeLoop() {
    const tick = async () => {
      if (!this.stream || !this.hands || this.mpDisabled || !this.mpInitialized) return;
      const video = this.videoRef?.nativeElement;
      if (!this.isBusy && video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const image = this.getMpImageSource();
        if (!image) {
          this.mpAnimId = requestAnimationFrame(tick);
          return;
        }
        this.isBusy = true;
        try {
          await this.hands.send({ image });
          this.mpFramesSent++;
        } catch (err: unknown) {
          if (await this.recoverFromWasmCrash(err)) {
            this.isBusy = false;
            this.mpAnimId = requestAnimationFrame(tick);
            return;
          }
          this.mpDisabled = true;
          const msg = err instanceof Error ? err.message : String(err);
          this.ngZone.run(() => {
            this.error = 'MediaPipe lỗi: ' + msg;
            this.cdr.markForCheck();
          });
          return;
        } finally {
          this.isBusy = false;
        }
      }
      this.mpAnimId = requestAnimationFrame(tick);
    };
    if (this.mpAnimId !== null) cancelAnimationFrame(this.mpAnimId);
    this.mpAnimId = requestAnimationFrame(tick);
  }

  private onResults(results: any) {
    this.lastHandResults = results;
    this.setMpReady();

    if (!results.multiHandLandmarks?.length) {
      this.handVisible = false;
      this.latestLm = null;
      this.latestGesture = 'none';
      if (this.lastUiGesture !== 'none') {
        this.syncGestureUi('none');
      }
      this.resetActions();
      return;
    }

    if (!this.isTracking) {
      this.isTracking = true;
      this.ngZone.run(() => this.cdr.markForCheck());
    }

    this.handVisible = true;
    const lm = results.multiHandLandmarks[0];
    this.latestLm = lm;

    let gesture = this.classify(lm);
    if (this.fistDragging) {
      gesture = 'fist';
    } else if (gesture === 'fist') {
      this.cancelPendingClick();
    }

    const prevGesture = this.latestGesture;
    if (prevGesture === 'scroll' && gesture !== 'scroll') {
      this.scrolling = false;
      this.scrollTargetCache = null;
    }
    if (gesture !== prevGesture) {
      this.syncGestureUi(gesture);
    }
    this.latestGesture = gesture;

    const tip = lm[8];
    const pos = this.mapFingerToScreen(tip);
    this.targetX = pos.x;
    this.targetY = pos.y;
    this.scrollHandY = pos.y;
  }

  /** Landmark MP (0–1 trên frame đã crop) → tọa độ 0–1 trên frame video gốc */
  private landmarkInVideoFrame(lm: { x: number; y: number }): { x: number; y: number } {
    const video = this.videoRef.nativeElement;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const tw = this.mpFeedCanvas?.width ?? vw;
    const th = this.mpFeedCanvas?.height ?? vh;
    const { sX, sY, cropW, cropH } = this.videoCoverCrop(vw, vh, tw, th);
    return {
      x: sX / vw + lm.x * (cropW / vw),
      y: sY / vh + lm.y * (cropH / vh),
    };
  }

  /**
   * Frame gốc từ camera → mirror ngang (1-x) cho giống gương / di chuyển tự nhiên.
   */
  private mapFingerToScreen(tip: { x: number; y: number }): { x: number; y: number } {
    const v = this.landmarkInVideoFrame(tip);
    const pad = this.CURSOR_FRAME_PAD;
    const span = 1 - 2 * pad;

    let nx = ((1 - v.x) - pad) / span;
    let ny = (v.y - pad) / span;
    nx = Math.max(0, Math.min(1, nx));
    ny = Math.max(0, Math.min(1, ny));

    const cx = 0.5;
    const cy = 0.5;
    const sx = Math.max(0, Math.min(1, cx + (nx - cx) * this.CURSOR_SENSITIVITY));
    const sy = Math.max(0, Math.min(1, cy + (ny - cy) * this.CURSOR_SENSITIVITY));

    return {
      x: sx * window.innerWidth,
      y: sy * window.innerHeight,
    };
  }

  private processScrollFrame() {
    this.cancelPendingClick();
    this.pinchActive = false;
    const ty = this.smoothScrollY;
    if (!this.scrolling) {
      this.scrolling = true;
      this.lastScrollY = ty;
      this.smoothScrollY = this.scrollHandY;
      this.scrollTargetCache = this.resolveScrollTarget(this.sx, this.sy);
      return;
    }
    const delta = ty - this.lastScrollY;
    if (Math.abs(delta) > 0.1) {
      this.applyScroll(delta);
      this.lastScrollY = ty;
    }
  }

  /** Chạy tại 60fps — chỉ thao tác cần liên tục hoặc được throttle */
  private runGestureActions(gesture: GestureType, lm: any[]) {
    const now = performance.now();
    const continuous = gesture === 'fist' || gesture === 'point' || gesture === 'pinch';
    if (!continuous && now - this.lastExecuteAt < 40) return;
    this.lastExecuteAt = now;
    this.executeGesture(gesture, lm);
  }

  private syncGestureUi(gesture: GestureType) {
    if (gesture === this.lastUiGesture) return;
    this.lastUiGesture = gesture;
    this.ngZone.run(() => {
      this.currentGesture = gesture;
      this.cdr.markForCheck();
    });
  }

  private updateCursorDom(x: number, y: number, gesture: GestureType) {
    const el = this.cursorRef?.nativeElement;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    if (gesture !== this.lastCursorGesture) {
      el.className = `hc-cursor cursor-${gesture}`;
      this.lastCursorGesture = gesture;
    }
    this.cursorRaiseTick++;
    if (this.cursorRaiseTick >= 90) {
      this.cursorRaiseTick = 0;
      if (el.parentElement !== document.body) {
        document.body.appendChild(el);
      } else if (el !== document.body.lastElementChild) {
        document.body.appendChild(el);
      }
    }
  }

  /**
   * Thứ tự ưu tiên: cử chỉ đa ngón → trỏ → nắm tay → pinch.
   * Nắm tay phải trước pinch vì khi nắm tay ngón cái+trỏ thường chạm nhau.
   */
  private classify(lm: any[]): GestureType {
    const ext = this.extendedFingers(lm);
    const fingerCount = [ext[1], ext[2], ext[3], ext[4]].filter(Boolean).length;

    if (fingerCount >= 4 && ext[0]) return 'palm';
    if (this.isThreeFingerPose(lm)) return 'three_fingers';
    if (this.isScrollPose(lm)) return 'scroll';
    if (ext[1] && fingerCount === 1 && this.pinchDist(lm) >= this.PINCH_THR) return 'point';
    if (fingerCount === 0) return 'fist';
    if (this.pinchDist(lm) < this.PINCH_THR) return 'pinch';

    return 'none';
  }

  private cancelPendingClick() {
    if (this.pendingClickTimer) {
      clearTimeout(this.pendingClickTimer);
      this.pendingClickTimer = null;
    }
    this.pinchActive = false;
    this.lastPinchClickAt = 0;
  }

  /** Ngón duỗi: đầu ngón cao hơn khớp giữa (hệ tọa độ ảnh, y nhỏ = lên) */
  private isFingerUp(lm: any[], tip: number, pip: number): boolean {
    return lm[tip].y < lm[pip].y - 0.015;
  }

  /** ✌️ Trỏ + giữa duỗi, nhẫn + út co */
  private isScrollPose(lm: any[]): boolean {
    return this.isFingerUp(lm, 8, 6)
      && this.isFingerUp(lm, 12, 10)
      && !this.isFingerUp(lm, 16, 14)
      && !this.isFingerUp(lm, 20, 18);
  }

  /** 🤘 Trỏ + giữa + nhẫn duỗi, út co */
  private isThreeFingerPose(lm: any[]): boolean {
    return this.isFingerUp(lm, 8, 6)
      && this.isFingerUp(lm, 12, 10)
      && this.isFingerUp(lm, 16, 14)
      && !this.isFingerUp(lm, 20, 18);
  }

  private extendedFingers(lm: any[]): boolean[] {
    const palm = lm[9];
    return [
      this.dist(lm[4], palm) > this.dist(lm[2], palm) * 1.05,
      this.fingerExtended(lm, 8, 6, 5),
      this.fingerExtended(lm, 12, 10, 9),
      this.fingerExtended(lm, 16, 14, 13),
      this.fingerExtended(lm, 20, 18, 17),
    ];
  }

  private fingerExtended(lm: any[], tip: number, pip: number, mcp: number): boolean {
    return this.dist(lm[tip], lm[0]) > this.dist(lm[pip], lm[0]) * 1.02
      && this.dist(lm[tip], lm[mcp]) > this.dist(lm[pip], lm[mcp]) * 1.02;
  }

  private dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private pinchDist(lm: any[]): number {
    return this.dist(lm[4], lm[8]);
  }

  private executeGesture(gesture: GestureType, lm: any[]) {
    if (gesture === 'palm' || gesture === 'none') {
      this.resetActions();
      return;
    }

    const x = this.sx;
    const y = this.sy;
    const now = Date.now();

    switch (gesture) {
      case 'point':
        this.resetActions();
        this.dispatchHover(x, y);
        break;

      case 'pinch':
        if (this.fistDragging) break;
        this.dispatchHover(x, y);
        if (!this.pinchActive) {
          this.pinchActive = true;
          this.pinchAt = now;
        } else if (now - this.pinchAt > this.PINCH_MS && now - this.lastClick > 300) {
          this.onPinchComplete(x, y);
          this.lastClick = now;
          this.pinchAt = now + 300;
        }
        break;

      case 'scroll':
        break;

      case 'three_fingers':
        if (now - this.lastRightClick > 800) {
          this.fireRightClick(x, y);
          this.lastRightClick = now;
        }
        this.pinchActive = false;
        break;

      case 'fist':
        if (!this.fistDragging) {
          this.fistDragging = true;
          this.dragTarget = this.targetAt(x, y);
          this.dispatchPointer(this.dragTarget, 'pointerdown', x, y, 0);
          this.dispatchMouse(this.dragTarget, 'mousedown', x, y, 0);
        } else {
          this.dispatchPointer(this.dragTarget, 'pointermove', x, y, 0);
          this.dispatchMouse(this.dragTarget, 'mousemove', x, y, 0);
        }
        this.pinchActive = false;
        this.scrolling = false;
        break;
    }
  }

  private resetActions() {
    if (this.fistDragging) {
      const x = this.sx;
      const y = this.sy;
      this.dispatchPointer(this.dragTarget, 'pointerup', x, y, 0);
      this.dispatchMouse(this.dragTarget, 'mouseup', x, y, 0);
      this.fistDragging = false;
      this.dragTarget = null;
    }
    this.pinchActive = false;
    this.scrolling = false;
    this.scrollTargetCache = null;
  }

  /** Bỏ qua overlay hand-control để click đúng phần tử trang */
  private targetAt(x: number, y: number): Element | null {
    for (const el of document.elementsFromPoint(x, y)) {
      if (!el.closest('app-hand-control')) return el;
    }
    return null;
  }

  private lastHoverDispatch = 0;
  private lastHoverPosX = 0;
  private lastHoverPosY = 0;

  private dispatchHover(x: number, y: number) {
    const now = performance.now();
    const moved = Math.hypot(x - this.lastHoverPosX, y - this.lastHoverPosY);
    if (now - this.lastHoverDispatch < 50 && moved < 6) return;
    this.lastHoverDispatch = now;
    this.lastHoverPosX = x;
    this.lastHoverPosY = y;

    const target = this.targetAt(x, y);
    if (target === this.lastHoverTarget) {
      this.dispatchMouse(target, 'mousemove', x, y, 0);
      return;
    }
    if (this.lastHoverTarget) {
      this.dispatchMouse(this.lastHoverTarget, 'mouseout', x, y, 0);
      this.dispatchMouse(this.lastHoverTarget, 'mouseleave', x, y, 0);
    }
    if (target) {
      this.dispatchMouse(target, 'mouseover', x, y, 0);
      this.dispatchMouse(target, 'mouseenter', x, y, 0);
      this.dispatchMouse(target, 'mousemove', x, y, 0);
    }
    this.lastHoverTarget = target;
  }

  private onPinchComplete(x: number, y: number) {
    const now = Date.now();
    if (now - this.lastPinchClickAt < this.DOUBLE_CLICK_MS) {
      if (this.pendingClickTimer) {
        clearTimeout(this.pendingClickTimer);
        this.pendingClickTimer = null;
      }
      this.lastPinchClickAt = 0;
      this.fireDoubleClick(x, y);
      this.syncGestureUi('double_click');
    } else {
      this.lastPinchClickAt = now;
      this.pendingClickTimer = setTimeout(() => {
        this.fireClick(x, y);
        this.pendingClickTimer = null;
      }, this.DOUBLE_CLICK_MS);
    }
  }

  private fireClick(x: number, y: number) {
    const target = this.targetAt(x, y);
    if (!target) return;
    this.dispatchPointer(target, 'pointerdown', x, y, 0);
    this.dispatchMouse(target, 'mousedown', x, y, 0);
    this.dispatchPointer(target, 'pointerup', x, y, 0);
    this.dispatchMouse(target, 'mouseup', x, y, 0);
    this.dispatchMouse(target, 'click', x, y, 0);
  }

  private fireDoubleClick(x: number, y: number) {
    const target = this.targetAt(x, y);
    if (!target) return;
    this.dispatchPointer(target, 'pointerdown', x, y, 0);
    this.dispatchMouse(target, 'mousedown', x, y, 0);
    this.dispatchPointer(target, 'pointerup', x, y, 0);
    this.dispatchMouse(target, 'mouseup', x, y, 0);
    this.dispatchMouse(target, 'click', x, y, 0);
    this.dispatchPointer(target, 'pointerdown', x, y, 0);
    this.dispatchMouse(target, 'mousedown', x, y, 0);
    this.dispatchPointer(target, 'pointerup', x, y, 0);
    this.dispatchMouse(target, 'mouseup', x, y, 0);
    this.dispatchMouse(target, 'click', x, y, 0);
    this.dispatchMouse(target, 'dblclick', x, y, 0);
  }

  private fireRightClick(x: number, y: number) {
    const target = this.targetAt(x, y);
    if (!target) return;
    this.dispatchPointer(target, 'pointerdown', x, y, 2);
    this.dispatchMouse(target, 'mousedown', x, y, 2);
    this.dispatchPointer(target, 'pointerup', x, y, 2);
    this.dispatchMouse(target, 'mouseup', x, y, 2);
    this.dispatchMouse(target, 'contextmenu', x, y, 2);
  }

  /** Cuộn trực tiếp — không dispatch wheel (nhẹ hơn, mượt hơn ở 60fps) */
  private applyScroll(deltaY: number) {
    if (Math.abs(deltaY) < 0.5) return;
    const target = this.scrollTargetCache;
    if (!target || target === document.documentElement || target === document.body) {
      window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
      return;
    }
    target.scrollTop += deltaY;
  }

  private resolveScrollTarget(x: number, y: number): HTMLElement {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.closest('app-hand-control')) continue;
      if (!(el instanceof HTMLElement)) continue;
      const scrollable = this.nearestScrollable(el);
      if (scrollable) return scrollable;
    }
    const root = document.scrollingElement;
    return root instanceof HTMLElement ? root : document.documentElement;
  }

  private nearestScrollable(el: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el;
    while (node) {
      if (this.canScrollY(node)) return node;
      node = node.parentElement;
    }
    const root = document.scrollingElement;
    return root instanceof HTMLElement ? root : null;
  }

  private canScrollY(el: HTMLElement): boolean {
    const { overflowY } = getComputedStyle(el);
    if (!['auto', 'scroll', 'overlay'].includes(overflowY)) return false;
    return el.scrollHeight > el.clientHeight + 2;
  }

  private dispatchMouse(target: Element | null, type: string, x: number, y: number, button: number) {
    const detail = type === 'dblclick' ? 2 : type === 'click' ? 1 : 0;
    let buttons = 0;
    if (type === 'mousedown') {
      buttons = 1;
    } else if (type === 'mousemove' && this.fistDragging) {
      buttons = 1;
    }
    target?.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button,
      buttons,
      detail,
      view: window,
    }));
  }

  private dispatchPointer(target: Element | null, type: string, x: number, y: number, button: number) {
    let buttons = 0;
    if (type === 'pointerdown') {
      buttons = 1;
    } else if (type === 'pointermove' && this.fistDragging) {
      buttons = 1;
    }
    target?.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button,
      buttons,
      pointerId: 1,
      pointerType: 'mouse',
      view: window,
    }));
  }

  private drawPreview() {
    const canvas = this.canvasRef?.nativeElement;
    const video = this.videoRef?.nativeElement;
    if (!canvas || !video) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const cw = Math.max(1, Math.round(canvas.clientWidth) || 308);
    const ch = Math.max(1, Math.round(canvas.clientHeight) || 231);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { sX, sY, cropW, cropH } = this.videoCoverCrop(vw, vh, cw, ch);
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sX, sY, cropW, cropH, 0, 0, cw, ch);
    ctx.restore();

    const lm = this.latestLm;
    if (lm?.length) {
      this.drawHand(ctx, lm, vw, vh, cw, ch);
    }
  }

  private drawHand(
    ctx: CanvasRenderingContext2D,
    lm: any[],
    vw: number,
    vh: number,
    cw: number,
    ch: number,
  ) {
    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    const pt = (i: number) => {
      const v = this.landmarkInVideoFrame(lm[i]);
      return this.landmarkToCanvas(v.x, v.y, vw, vh, cw, ch);
    };

    ctx.strokeStyle = 'rgba(0,230,120,0.75)';
    ctx.lineWidth = 1.8;
    for (const [a, b] of CONNECTIONS) {
      const pa = pt(a);
      const pb = pt(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    const tips = [4, 8, 12, 16, 20];
    for (let i = 0; i < lm.length; i++) {
      const p = pt(i);
      const isTip = tips.includes(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, isTip ? 5 : 3, 0, 2 * Math.PI);
      ctx.fillStyle = i === 8 ? '#ff4081' : isTip ? '#00e878' : 'rgba(255,255,255,0.65)';
      ctx.fill();
    }
  }

  private cleanup() {
    if (this.mpReadyWatchdog) {
      clearTimeout(this.mpReadyWatchdog);
      this.mpReadyWatchdog = null;
    }
    if (this.pendingClickTimer) {
      clearTimeout(this.pendingClickTimer);
      this.pendingClickTimer = null;
    }
    if (this.previewAnimId !== null) {
      cancelAnimationFrame(this.previewAnimId);
      this.previewAnimId = null;
    }
    if (this.mpAnimId !== null) {
      cancelAnimationFrame(this.mpAnimId);
      this.mpAnimId = null;
    }
    if (this.interactionAnimId !== null) {
      cancelAnimationFrame(this.interactionAnimId);
      this.interactionAnimId = null;
    }
    this.handVisible = false;
    this.latestLm = null;
    this.scrollTargetCache = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.hands?.close?.();
    this.hands = null;
    this.mpInitialized = false;
    this.lastHandResults = null;
    this.resetActions();
    this.updateCursorDom(-200, -200, 'none');
    this.currentGesture = 'none';
    this.isTracking = false;
    this.isMpReady = false;
  }
}
