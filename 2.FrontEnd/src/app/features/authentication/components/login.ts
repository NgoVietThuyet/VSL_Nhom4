import { Component, inject, NgZone, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { LocalStorageUtils } from '../../../shared/utils';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { SignalRService } from '../../../shared/services/signalr.service';
import { TokenService } from '../../../core/services/token.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment.dev';

declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: any) => string;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string | undefined;
        };
        onTurnstileApiLoaded?: () => void;
    }
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [SharedModules],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class Login implements OnInit, AfterViewInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private isLoggingIn = false;

    // --- Cloudflare Turnstile state ---
    private turnstileWidgetId: string | null = null;
    private turnstileToken: string | null = null;
    private turnstileApiCheckTimer: any = null;
    private readonly turnstileSiteKey: string = (environment as any).turnstileSiteKey || '';

    meetingId: string = '';
    returnUrl: string = '';
    guestName: string = '';
    isPasswordVisible = false;
    isGuestLoggingIn = false;
    isForgotModalVisible = false;
    forgotStep = 1;
    forgotEmail = '';
    otpCode = '';
    newPassword = '';
    isForgotLoading = false;

    // --- Biến cho Device OTP ---
    isOtpModalVisible = false;
    challengeId = '';
    maskedEmail = '';
    loginOtpCode = '';
    isVerifyOtpLoading = false;

    // ===================== Landing UI state =====================
    /** Typewriter rotating phrases */
    private readonly typewriterPhrases: string[] = [
        'Nền tảng chuyển đổi số vận hành bằng AI',
        'AI · ERP · GIS · Workspace · Automation',
        'Tự động hoá quy trình doanh nghiệp',
        'Phân tích dữ liệu thông minh thời gian thực',
        'Một nền tảng — toàn bộ vận hành số'
    ];
    typedText: string = '';
    private typePhraseIndex = 0;
    private typeCharIndex = 0;
    private typeDeleting = false;
    private typeTimer: any = null;

    /** Stat counters (animated) */
    stats: Array<{ icon: string; label: string; target: number; current: number; suffix: string }> = [
        { icon: 'appstore', label: 'Phân hệ nghiệp vụ', target: 22, current: 0, suffix: '+' },
        { icon: 'thunderbolt', label: 'Tác vụ AI mỗi ngày', target: 18500, current: 0, suffix: '' },
        { icon: 'team', label: 'Người dùng đồng thời', target: 9800, current: 0, suffix: '+' },
        { icon: 'safety', label: 'Độ ổn định hệ thống', target: 99, current: 0, suffix: '.9%' }
    ];
    private statTimer: any = null;

    /** Feature carousel slides — reflects core modules of xWorkspace */
    readonly features = [
        {
            title: 'AI Copilot & Tự động hoá thông minh',
            subtitle: 'Chatbot doanh nghiệp, Workflow engine, gợi ý quyết định bằng AI.',
            icon: 'robot',
            img: 'img/chatbot.png',
            color: 'linear-gradient(135deg,#6366f1,#22d3ee)',
            items: [
                'Trợ lý AI hội thoại đa ngữ cảnh, hiểu dữ liệu nội bộ',
                'Workflow Automation kéo–thả, tích hợp đa hệ thống',
                'Sinh báo cáo, tóm tắt và đề xuất hành động tự động'
            ],
            tags: ['Chatbot AI', 'Workflow Engine', 'Auto Report', 'Smart Search']
        },
        {
            title: 'ERP — Quản trị doanh nghiệp',
            subtitle: 'HRM, CRM, Master Data, Tài sản — vận hành thống nhất.',
            icon: 'bank',
            img: 'img/erp.png',
            color: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
            items: [
                'HRM: Nhân sự, chấm công, hồ sơ, phân quyền chi tiết',
                'CRM: Khách hàng, cơ hội, chiến dịch, phễu doanh số',
                'Master Data: Tổ chức, phòng ban, danh mục chuẩn hoá'
            ],
            tags: ['HRM', 'CRM', 'Asset Mgmt', 'Master Data']
        },
        {
            title: 'Workspace cộng tác thời gian thực',
            subtitle: 'Meeting, Chat, Mail, Calendar, Notes, Task — tất cả trong một.',
            icon: 'team',
            img: 'img/workspace.png',
            color: 'linear-gradient(135deg,#22c55e,#06b6d4)',
            items: [
                'Họp trực tuyến tích hợp biểu quyết và biên bản tự động',
                'Chat nội bộ, email doanh nghiệp, lịch chia sẻ',
                'Ghi chú thông minh, công việc liên kết quy trình'
            ],
            tags: ['Meeting', 'Chat', 'Mail', 'Calendar', 'Notes', 'Tasks']
        },
        {
            title: 'GIS — Quản lý nhiều lớp dữ liệu trên bản đồ',
            subtitle: 'Hiển thị dữ liệu trên bản đồ, phân tích không gian.',
            icon: 'environment',
            img: 'img/pin.png',
            color: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            items: [
                'Quản lý vị trí, tài sản, phòng họp, điểm vận hành',
                'Trực quan hoá dữ liệu nghiệp vụ theo địa lý',
                'Tích hợp định vị thời gian thực cho thiết bị di động'
            ],
            tags: ['Map Layers', 'Location Intel', 'Real-time GPS', 'Spatial Data']
        },
        {
            title: 'Documents & Explorer — Kho dữ liệu số',
            subtitle: 'Quản lý tệp, phân quyền, chia sẻ liên kết, lịch sử phiên bản.',
            icon: 'folder-open',
            img: 'img/folder.png',
            color: 'linear-gradient(135deg,#a855f7,#ec4899)',
            items: [
                'Versioning, tag, share link, audit trail đầy đủ',
                'Đồng bộ ClientSync trên máy trạm Windows',
                'Tìm kiếm ngữ nghĩa bằng AI trên kho tài liệu'
            ],
            tags: ['Explorer', 'Versioning', 'ClientSync', 'AI Search']
        },
        {
            title: 'Báo cáo - Giám sát vận hành',
            subtitle: 'Dashboard, Reports, System Monitoring 24/7.',
            icon: 'line-chart',
            img: 'img/bar-chart.png',
            color: 'linear-gradient(135deg,#0284c7,#10b981)',
            items: [
                'KPI thời gian thực, dashboard tuỳ biến theo vai trò',
                'Giám sát hạ tầng, phiên đăng nhập, audit log',
                'Cảnh báo bất thường bằng AI, gửi qua đa kênh'
            ],
            tags: ['Dashboard', 'KPI Live', 'Audit Log', 'AI Alerting']
        }
    ];
    activeSlide = 0;
    slideProgress = 0;
    private slideTimer: any = null;
    private slideTickTimer: any = null;
    private readonly slideDurationMs = 6000;
    private slideElapsed = 0;

    /** Module tag cloud */
    readonly modules: string[] = [
        'AI Copilot', 'Workflow', 'HRM', 'CRM', 'Master Data',
        'Meeting', 'Chat', 'Mail', 'Calendar', 'Notes', 'Tasks',
        'Documents', 'Explorer', 'GIS', 'Reports', 'Monitoring',
        'License', 'ClientSync', 'Mobile', 'Notifications'
    ];

    /** Floating particles */
    particles: Array<{ x: number; y: number; size: number; delay: number; duration: number }> = [];

    /** Mouse parallax */
    parallaxX = 0;
    parallaxY = 0;

    /** Dynamic current year */
    readonly currentYear = new Date().getFullYear();

    /** Welcome message rotates on each login view */
    welcomeMessage: string = '';
    welcomeMessageIndex: number = 0;
    private messageTimer: any = null;
    private readonly welcomeMessages: string[] = [
        '"Ghi nhớ" để tiết kiệm thời gian đăng nhập lần tới.',
        'OTP để xác thực an toàn trên thiết bị mới.',
        'Hệ thống hỗ trợ 2FA qua email để bảo vệ tài khoản.',
        'Mật khẩu mạnh giúp bảo vệ dữ liệu bạn.',
        'Quên mật khẩu? Bạn có thể đặt lại qua email đã đăng ký.'
    ];

    private readonly fb = inject(NonNullableFormBuilder);
    validateForm = this.fb.group({
        username: this.fb.control('', [Validators.required]),
        password: this.fb.control('', [Validators.required])
    });

    constructor(
        private readonly service: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly signalR: SignalRService,
        private readonly message: NzMessageService,
        private readonly ngZone: NgZone,
        private readonly tokenService: TokenService,
    ) { }

    ngOnInit(): void {
        this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
        this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
        this.initGuestId();
        this.initParticles();
        this.startTypewriter();
        this.startCounters();
        this.startCarousel();
        this.startWelcomeMessageCycle();
    }

    private initGuestId(): void {
        if (!localStorage.getItem('xw_guest_id')) {
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('xw_guest_id', uuid);
        }

        const savedGuestName = localStorage.getItem('xw_guest_name');
        if (savedGuestName) {
            this.guestName = savedGuestName;
        }
    }

    ngAfterViewInit(): void {
        // Render Turnstile widget khi API đã sẵn sàng (script tải bất đồng bộ)
        this.tryRenderTurnstile();
        // NOTE: You may see the Chrome console warning:
        //   "Form submission canceled because the form is not connected"
        // This is produced by Cloudflare Turnstile's internal iframe — it programmatically
        // submits a detached <form> as part of its CAPTCHA verification flow before
        // connecting it to the DOM. This is Cloudflare's implementation behavior and is
        // not caused by our code. See: https://community.cloudflare.com/t/turnstile
    }

    private tryRenderTurnstile(): void {
        if (!this.turnstileSiteKey) {
            console.warn('[Turnstile] Missing turnstileSiteKey in environment');
            return;
        }
        // Đợi tới khi window.turnstile sẵn sàng (script tải xong)
        const tryRender = () => {
            if (window.turnstile && document.getElementById('turnstile-container')) {
                this.renderTurnstile();
                if (this.turnstileApiCheckTimer) {
                    clearInterval(this.turnstileApiCheckTimer);
                    this.turnstileApiCheckTimer = null;
                }
            }
        };
        tryRender();
        if (!this.turnstileWidgetId) {
            this.turnstileApiCheckTimer = setInterval(tryRender, 200);
        }
    }

    private renderTurnstile(): void {
        try {
            this.turnstileWidgetId = window.turnstile!.render('#turnstile-container', {
                sitekey: this.turnstileSiteKey,
                theme: 'light',
                size: 'normal',
                callback: (token: string) => {
                    this.ngZone.run(() => { this.turnstileToken = token; });
                },
                'expired-callback': () => {
                    this.ngZone.run(() => { this.turnstileToken = null; });
                },
                'error-callback': () => {
                    this.ngZone.run(() => { this.turnstileToken = null; });
                },
            });
        } catch (e) {
            console.error('[Turnstile] Render failed', e);
        }
    }

    private resetTurnstile(): void {
        this.turnstileToken = null;
        try {
            if (window.turnstile && this.turnstileWidgetId) {
                window.turnstile.reset(this.turnstileWidgetId);
            }
        } catch { /* no-op */ }
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    loginByAccount(): void {
        if (this.validateForm.invalid) {
            this.markFormAsDirty();
            return;
        }

        const isMobile = !!(window as any).Capacitor;
        
        // Bắt buộc xác thực Turnstile trước khi đăng nhập (chỉ áp dụng cho Web)
        if (!isMobile && !this.turnstileToken) {
            this.message.warning('Vui lòng xác thực bảo mật trước khi đăng nhập.');
            return;
        }

        if (this.isLoggingIn) return;

        this.isLoggingIn = true;
        // Gửi kèm DeviceToken và DeviceName (mô phỏng)
        const deviceToken = localStorage.getItem('xw_device_token') || '';
        const guestId = localStorage.getItem('xw_guest_id') || '';
        const userAgentMatch = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d]+/);
        const deviceName = `${userAgentMatch ? userAgentMatch[0] : 'Unknown Browser'} / ${navigator.platform}`;

        const payload = {
            ...this.validateForm.value,
            deviceToken: deviceToken,
            deviceName: deviceName,
            turnstileToken: this.turnstileToken,
            guestId: guestId
        };

        const apiCall = isMobile ? this.service.loginMobileAccount(payload) : this.service.loginAccount(payload);

        apiCall
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isLoggingIn = false;
                    if (res.status) {
                        if (res.data?.requiresOtp) {
                            // Phát hiện thiết bị lạ -> Hiện popup nhập OTP
                            this.challengeId = res.data.challengeId;
                            this.maskedEmail = res.data.maskedEmail;
                            this.loginOtpCode = '';
                            this.isOtpModalVisible = true;
                        } else {
                            // Đăng nhập bình thường
                            this.handleLoginSuccess(res.data);
                        }
                    } else {
                        // Đăng nhập thất bại -> Reset Turnstile để xác thực lại
                        this.resetTurnstile();
                    }
                },
                error: (err: any) => {
                    console.error('Lỗi đăng nhập:', err);
                    this.isLoggingIn = false;
                    if (err?.status === 429) {
                        this.message.warning('Đăng nhập quá nhiều lần. Vui lòng đợi khoảng 1 phút rồi thử lại.');
                    }
                    this.resetTurnstile();
                }
            });
    }

    get canLoginAsGuest(): boolean {
        return this.getMeetingIdFromReturnUrl() !== null;
    }

    loginAsGuest(): void {
        const meetingId = this.getMeetingIdFromReturnUrl();
        if (!meetingId) {
            this.message.warning('Liên kết cuộc họp không hợp lệ');
            return;
        }

        const fullName = this.guestName?.trim();
        if (!fullName) {
            this.message.warning('Vui lòng nhập tên khi vào với tư cách khách');
            return;
        }

        if (this.isGuestLoggingIn) return;

        this.isGuestLoggingIn = true;
        const guestId = localStorage.getItem('xw_guest_id') || '';
        this.service.loginGuest({ meetingId, fullName, guestId })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isGuestLoggingIn = false;
                    if (res?.status) {
                        // Lưu thông tin xác thực
                        LocalStorageUtils.clear();
                        this.tokenService.setAccessToken(res.data.accessToken);
                        LocalStorageUtils.setItem('accountInfo', res.data.accountInfo);

                        // Lưu tên khách cho lần sau
                        localStorage.setItem('xw_guest_name', fullName);

                        this.signalR.start();
                        // Khách tham gia trực tiếp vào màn chờ
                        this.router.navigate([`/meeting/waiting/${meetingId}`]);
                    }
                },
                error: () => {
                    this.isGuestLoggingIn = false;
                }
            });
    }

    private handleLoginSuccess(data: any): void {
        LocalStorageUtils.clear();
        this.tokenService.setAccessToken(data.accessToken);
        if (data.deviceToken) {
            localStorage.setItem('xw_device_token', data.deviceToken);
        }
        LocalStorageUtils.setItem('accountInfo', data.accountInfo);
        this.signalR.start();

        if (this.returnUrl && this.returnUrl !== '/login') {
            this.router.navigateByUrl(this.returnUrl);
            return;
        }

        this.router.navigate(['home']);
    }

    private getMeetingIdFromReturnUrl(): string | null {
        if (!this.returnUrl) return null;

        // Match both /meeting/detail/xxx and /meeting/waiting/xxx
        const matched = this.returnUrl.match(/\/meeting\/(?:detail|waiting)\/([^?&#/]+)/i);
        if (!matched || !matched[1]) return null;

        return decodeURIComponent(matched[1]);
    }

    private markFormAsDirty(): void {
        Object.values(this.validateForm.controls).forEach(control => {
            if (control.invalid) {
                control.markAsDirty();
                control.updateValueAndValidity({ onlySelf: true });
            }
        });
    }

    openForgotModal(): void {
        this.isForgotModalVisible = true;
        this.forgotStep = 1;
        this.forgotEmail = '';
        this.otpCode = '';
        this.newPassword = '';
    }

    closeForgotModal(): void {
        this.isForgotModalVisible = false;
    }

    requestOtp(): void {
        if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
            this.message.warning('Vui lòng nhập email hợp lệ');
            return;
        }

        this.isForgotLoading = true;
        this.service.requestOtp(this.forgotEmail)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isForgotLoading = false;
                    if (res.status) {
                        this.forgotStep = 2;
                    }
                },
                error: () => {
                    this.isForgotLoading = false;
                }
            });
    }

    resetPassword(): void {
        if (!this.otpCode || this.otpCode.length !== 6) {
            this.message.warning('Vui lòng nhập mã OTP 6 chữ số');
            return;
        }

        if (!this.newPassword || this.newPassword.length < 6) {
            this.message.warning('Mật khẩu mới phải có tối thiểu 6 ký tự');
            return;
        }

        this.isForgotLoading = true;
        const payload = {
            email: this.forgotEmail,
            otpCode: this.otpCode,
            newPassword: this.newPassword
        };

        this.service.resetPasswordWithOtp(payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isForgotLoading = false;
                    if (res.status) {
                        this.isForgotModalVisible = false;
                    }
                },
                error: () => {
                    this.isForgotLoading = false;
                }
            });
    }

    // --- Code xử lý OTP Thiết bị lạ ---
    closeOtpModal(): void {
        this.isOtpModalVisible = false;
    }

    verifyLoginOtp(): void {
        if (!this.loginOtpCode || this.loginOtpCode.length !== 6) {
            this.message.warning('Vui lòng nhập mã OTP 6 chữ số');
            return;
        }

        this.isVerifyOtpLoading = true;
        this.service.verifyLoginOtp(this.challengeId, this.loginOtpCode)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isVerifyOtpLoading = false;
                    if (res.status) {
                        this.isOtpModalVisible = false;
                        this.handleLoginSuccess(res.data);
                    }
                },
                error: () => {
                    this.isVerifyOtpLoading = false;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.turnstileApiCheckTimer) {
            clearInterval(this.turnstileApiCheckTimer);
            this.turnstileApiCheckTimer = null;
        }
        if (this.typeTimer) { clearTimeout(this.typeTimer); this.typeTimer = null; }
        if (this.statTimer) { clearInterval(this.statTimer); this.statTimer = null; }
        if (this.slideTimer) { clearInterval(this.slideTimer); this.slideTimer = null; }
        if (this.slideTickTimer) { clearInterval(this.slideTickTimer); this.slideTickTimer = null; }
        if (this.messageTimer) { clearInterval(this.messageTimer); this.messageTimer = null; }
        try {
            if (window.turnstile && this.turnstileWidgetId) {
                window.turnstile.remove(this.turnstileWidgetId);
            }
        } catch { /* no-op */ }
        this.turnstileWidgetId = null;
        this.turnstileToken = null;
    }

    // ===================== Landing animations =====================

    private initParticles(): void {
        const count = 28;
        this.particles = Array.from({ length: count }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 2 + Math.random() * 4,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 16
        }));
    }

    private startTypewriter(): void {
        const typeSpeed = 55;
        const deleteSpeed = 28;
        const holdMs = 1800;

        const tick = () => {
            const phrase = this.typewriterPhrases[this.typePhraseIndex];
            if (!this.typeDeleting) {
                this.typeCharIndex++;
                this.typedText = phrase.substring(0, this.typeCharIndex);
                if (this.typeCharIndex >= phrase.length) {
                    this.typeDeleting = true;
                    this.typeTimer = setTimeout(tick, holdMs);
                    return;
                }
                this.typeTimer = setTimeout(tick, typeSpeed);
            } else {
                this.typeCharIndex--;
                this.typedText = phrase.substring(0, Math.max(0, this.typeCharIndex));
                if (this.typeCharIndex <= 0) {
                    this.typeDeleting = false;
                    this.typePhraseIndex = (this.typePhraseIndex + 1) % this.typewriterPhrases.length;
                    this.typeTimer = setTimeout(tick, 400);
                    return;
                }
                this.typeTimer = setTimeout(tick, deleteSpeed);
            }
        };

        this.ngZone.runOutsideAngular(() => {
            this.typeTimer = setTimeout(() => this.ngZone.run(tick), 600);
        });
    }

    private startCounters(): void {
        const durationMs = 1800;
        const frameMs = 30;
        const steps = Math.max(1, Math.floor(durationMs / frameMs));
        let i = 0;
        this.statTimer = setInterval(() => {
            i++;
            const progress = Math.min(1, i / steps);
            // ease-out-cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            for (const s of this.stats) {
                s.current = Math.round(s.target * eased);
            }
            if (progress >= 1) {
                clearInterval(this.statTimer);
                this.statTimer = null;
            }
        }, frameMs);
    }

    private startCarousel(): void {
        // Progress bar tick (smooth)
        const tickMs = 60;
        this.ngZone.runOutsideAngular(() => {
            this.slideTickTimer = setInterval(() => {
                this.slideElapsed += tickMs;
                const pct = Math.min(100, (this.slideElapsed / this.slideDurationMs) * 100);
                this.ngZone.run(() => { this.slideProgress = pct; });
                if (this.slideElapsed >= this.slideDurationMs) {
                    this.ngZone.run(() => this.nextSlide());
                }
            }, tickMs);
        });
    }

    goToSlide(i: number): void {
        this.activeSlide = i;
        this.slideElapsed = 0;
        this.slideProgress = 0;
    }

    private nextSlide(): void {
        this.activeSlide = (this.activeSlide + 1) % this.features.length;
        this.slideElapsed = 0;
        this.slideProgress = 0;
    }

    onMouseMove(ev: MouseEvent): void {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        const nx = (ev.clientX / w) - 0.5;
        const ny = (ev.clientY / h) - 0.5;
        // Subtle parallax
        this.parallaxX = nx * -24;
        this.parallaxY = ny * -24;
    }

    private startWelcomeMessageCycle(): void {
        this.welcomeMessageIndex = 0;
        this.welcomeMessage = this.welcomeMessages[this.welcomeMessageIndex];
        this.messageTimer = setInterval(() => {
            this.welcomeMessageIndex = (this.welcomeMessageIndex + 1) % this.welcomeMessages.length;
            this.welcomeMessage = this.welcomeMessages[this.welcomeMessageIndex];
        }, 2000);
    }
}