import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { ChatBotService, StreamChatBotEvent } from '../services';
import { ChatBotConversationDto, ChatBotMessageDto, ChatBotAttachmentDto } from '../models';
import { CommandResult, MenuContext, COMMAND_CONFIDENCE } from '../models/command.model';
import { VoiceAssistantService } from '../services/command/voice-assistant.service';
import { WorkspaceUiService } from '../services/command/workspace-ui.service';
import { MainLayoutService } from '../../../shared/services';
import { LocalStorageUtils, StringUtils } from '../../../shared/utils';
import { UPLOAD_MAX_BYTES, validateClientFile } from '../../../shared/utils/file-upload-guard';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

import { MarkdownPipe } from '../pipes';
import { NewsService, NewsArticleSummary, NewsTopic } from '../../../shared/services/news.service';
export type VoiceState = 'idle' | 'initializing' | 'ready' | 'listening' | 'processing' | 'streaming' | 'error';

@Component({
  selector: 'app-chat-bot',
  imports: [SharedModules, MarkdownPipe],
  templateUrl: './chat-bot.html',
  styleUrl: './chat-bot.scss',
})
export class ChatBot implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('inputArea') inputArea!: ElementRef;

  @Input() popupMode = false;
  @Output() maximize = new EventEmitter<string | null>();
  @Output() closePopup = new EventEmitter<void>();

   conversations: ChatBotConversationDto[] = [];
   currentConversation: ChatBotConversationDto | null = null;
   messages: ChatBotMessageDto[] = [];
   inputMessage = '';
   isLoading = false;
   accountInfo: any;
   searchConversation = '';
   editingConversationId = '';
   editingTitle = '';
  isSidebarOpen = false;
   private routeConversationId = '';

  voiceState: VoiceState = 'idle';
  private recognition: any = null;
  private silenceTimer: any = null;
  private readyTimeout: any = null;
  private finalTranscript = '';

  // ===== Attachments state =====
  attachments: ChatBotAttachmentDto[] = [];
  isDragOver = false;
  private attachmentPollers = new Map<string, any>();
  readonly acceptedExtensions = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.bmp,.tif,.tiff,.webp,.gif';
  readonly maxFileSizeBytes = 50 * 1024 * 1024; // 50 MB per file

  /** Flat list of user-permitted menus, used by the command interpreter. */
  private menuContext: MenuContext[] = [];

  // ===== News state =====
  latestNews: NewsArticleSummary[] = [];
  newsTopics: NewsTopic[] = [];
  activeTopicCode: string | null = null;
  newsLoading = false;
  activeSlideIndex = 0;
  private slideTimer: ReturnType<typeof setInterval> | null = null;
  private newsLoadTrigger$ = new Subject<string | undefined>();

  get carouselCount(): number { return Math.min(3, this.latestNews.length); }

  // ===== Typewriter greeting animation =====
  greetingText: string = '';
  private readonly greetingPhrase: string = 'Xin chào! Tôi có thể giúp gì cho bạn?';
  private greetingCharIndex = 0;
  private greetingTimer: any = null;

  private readonly destroy$ = new Subject<void>();

  get hasUploadingAttachments(): boolean {
    return this.attachments.some(a => a.status === 'uploading' || a.status === 'ocr');
  }

  get hasReadyAttachments(): boolean {
    return this.attachments.some(a => a.status === 'ready');
  }

  get isVoiceActive(): boolean {
    return this.voiceState !== 'idle' && this.voiceState !== 'error';
  }

  get isVoiceReady(): boolean {
    return this.voiceState === 'ready' || this.voiceState === 'listening';
  }

  get isVoiceProcessing(): boolean {
    return this.voiceState === 'initializing' || this.voiceState === 'processing';
  }

  get micTooltip(): string {
    switch (this.voiceState) {
      case 'initializing': return 'Đang khởi tạo microphone...';
      case 'ready': return 'Microphone sẵn sàng - Dừng ghi âm';
      case 'listening': return 'Đang nghe - Dừng ghi âm';
      case 'processing': return 'Đang xử lý...';
      case 'streaming': return 'Đang nhận phản hồi...';
      case 'error': return 'Có lỗi xảy ra';
      default: return 'Ghi âm giọng nói';
    }
  }

  constructor(
    private chatBotService: ChatBotService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private voiceAssistant: VoiceAssistantService,
    private workspaceUi: WorkspaceUiService,
    private mainLayoutService: MainLayoutService,
    private newsService: NewsService,
    private nzMessage: NzMessageService,
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    if (!this.popupMode) {
      this.applyRouteStateFromQuery();
    }
    this.loadConversations();
    this.loadMenuContext();
    this.subscribeWorkspaceUi();
    this.setupNewsStream();
    this.loadNewsTopics();
    this.loadLatestNews();
    this.startGreetingTypewriter();
  }

  ngOnDestroy(): void {
    this.stopVoiceInput();
    this.stopSlideShow();
    if (this.greetingTimer) { clearTimeout(this.greetingTimer); this.greetingTimer = null; }
    clearTimeout(this.readyTimeout);
    for (const t of this.attachmentPollers.values()) { clearInterval(t); }
    this.attachmentPollers.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(page: number = 1, pageSize: number = 50): void {
    const filter: any = {
      currentPage: page,
      pageSize: pageSize,
    };
    this.chatBotService.searchConversations(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.conversations = (res && res.data) ? res.data : [];

        if (this.routeConversationId) {
          const conversation = this.conversations.find(c => c.id === this.routeConversationId) || null;
          if (conversation && this.currentConversation?.id !== conversation.id) {
            this.selectConversation(conversation, false);
          } else if (!conversation && !this.currentConversation) {
            this.updateConversationQueryParam(null);
          }
        }
      });
  }

  /** Fetch user-permitted menus once and flatten to a MenuContext list. */
  private loadMenuContext(): void {
    const userName = this.accountInfo?.userName;
    if (!userName) return;
    this.mainLayoutService.getMenuByUser(userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
          this.menuContext = list
            .filter(m => m && m.url)
            .map(m => ({
              id: String(m.id ?? m.url),
              name: String(m.name ?? '').trim(),
              url: String(m.url).trim(),
              aliases: []
            }));
        },
        error: () => { this.menuContext = []; }
      });
  }

  private setupNewsStream(): void {
    this.newsLoadTrigger$.pipe(
      switchMap(code => {
        this.newsLoading = true;
        this.latestNews = [];
        this.activeSlideIndex = 0;
        this.stopSlideShow();
        this.cdr.markForCheck();
        return this.newsService.getLatest(11, code);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (items) => {
        this.latestNews = this.dedupNews(items ?? []);
        this.newsLoading = false;
        this.activeSlideIndex = 0;
        this.startSlideShow();
        this.cdr.markForCheck();
      },
      error: () => { this.newsLoading = false; this.cdr.markForCheck(); },
    });
  }

  /** Defensive de-duplication: drop articles with identical id or identical normalized title. */
  private dedupNews(items: NewsArticleSummary[]): NewsArticleSummary[] {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const result: NewsArticleSummary[] = [];
    for (const a of items) {
      if (!a) continue;
      const id = (a.id || '').trim();
      const titleKey = (a.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (id && seenIds.has(id)) continue;
      if (titleKey && seenTitles.has(titleKey)) continue;
      if (id) seenIds.add(id);
      if (titleKey) seenTitles.add(titleKey);
      result.push(a);
    }
    return result;
  }

  private loadLatestNews(): void {
    this.newsLoadTrigger$.next(this.activeTopicCode ?? undefined);
  }

  private loadNewsTopics(): void {
    this.newsService.getTopics().subscribe({
      next: (topics) => {
        // Only show topics that are not "khac", sorted by sortOrder
        this.newsTopics = (topics ?? [])
          .filter(t => t.code !== 'khac')
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 12);
        this.cdr.markForCheck();
      },
      error: () => { this.newsTopics = []; }
    });
  }

  selectNewsTopic(code: string | null): void {
    if (this.activeTopicCode === code) return;
    this.activeTopicCode = code;
    this.loadLatestNews();
  }

  prevSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.carouselCount) return;
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.carouselCount) % this.carouselCount;
    this.restartSlide();
  }

  nextSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.carouselCount) return;
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.carouselCount;
    this.restartSlide();
  }

  goToSlide(index: number): void {
    this.activeSlideIndex = index;
    this.restartSlide();
  }

  private restartSlide(): void {
    this.stopSlideShow();
    this.startSlideShow();
    this.cdr.markForCheck();
  }

  private startSlideShow(): void {
    if (this.carouselCount <= 1) return;
    this.slideTimer = setInterval(() => {
      this.activeSlideIndex = (this.activeSlideIndex + 1) % this.carouselCount;
      this.cdr.markForCheck();
    }, 2000);
  }

  private stopSlideShow(): void {
    if (this.slideTimer !== null) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  private startGreetingTypewriter(): void {
    const typeSpeed = 55;

    const tick = () => {
      if (this.greetingCharIndex < this.greetingPhrase.length) {
        this.greetingCharIndex++;
        this.greetingText = this.greetingPhrase.substring(0, this.greetingCharIndex);
        this.greetingTimer = setTimeout(tick, typeSpeed);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      this.greetingTimer = setTimeout(() => this.ngZone.run(tick), 300);
    });
  }

  formatNewsTime(input?: string): string {
    if (!input) return '';
    const d = new Date(input);
    if (isNaN(d.getTime())) return '';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return mins + ' phút trước';
    const h = Math.floor(mins / 60);
    if (h < 24) return h + ' giờ trước';
    const days = Math.floor(h / 24);
    if (days < 7) return days + ' ngày trước';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Listen for UI actions targeted at this chatbot (e.g. clear_chat). */
  private subscribeWorkspaceUi(): void {
    this.workspaceUi.stream$
      .pipe(takeUntil(this.destroy$))
      .subscribe(evt => {
        if (evt.action === 'clear_chat') {
          this.newConversation();
          this.cdr.markForCheck();
        }
      });
  }

  get filteredConversations(): ChatBotConversationDto[] {
    if (!this.searchConversation.trim()) return this.conversations;
    const kw = this.searchConversation.toLowerCase();
    return this.conversations.filter(c => c.title?.toLowerCase().includes(kw));
  }

  newConversation(): void {
    this.currentConversation = null;
    this.messages = [];
    this.inputMessage = '';
    this.clearAttachments();
    this.closeSidebar();
    this.updateConversationQueryParam(null);
  }

  selectConversation(conv: ChatBotConversationDto, updateQuery: boolean = true): void {
    this.currentConversation = conv;
    this.clearAttachments();
    this.loadConversationAttachments(conv.id);
    this.closeSidebar();
    if (updateQuery) {
      this.updateConversationQueryParam(conv.id);
    }

    this.isLoading = true;
    this.chatBotService.getMessages(conv.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.messages = data || [];
        this.isLoading = false;
        this.scrollToBottom();
      });
  }

  sendMessage(): void {
    const content = this.inputMessage.trim();
    if (this.isLoading) return;
    if (!content && !this.hasReadyAttachments) return;
    if (this.hasUploadingAttachments) return;
    this.inputMessage = '';
    this.resetTextareaHeight();
    this.submitMessage(content);
  }

  /** Fill input with a suggestion and immediately send */
  quickSend(message: string): void {
    this.inputMessage = message;
    this.sendMessage();
  }

  private async submitMessage(content: string): Promise<void> {
    const isFromVoice = this.voiceState === 'processing';

    // 1) Try to interpret as a command first (rules + LLM fallback).
    // try {
    //   const detection = await this.voiceAssistant.process(content, this.menuContext);
    //   if (detection?.isCommand && detection.confidence >= COMMAND_CONFIDENCE.threshold) {
    //     this.handleCommand(content, detection, isFromVoice);
    //     return;
    //   }
    // } catch (e) {
    //   console.warn('[ChatBot] Command interpretation failed, falling back to chat:', e);
    // }

    this.streamChatMessage(content, isFromVoice);
  }

  /** Execute a detected command and push a confirmation bubble. */
  private handleCommand(userText: string, cmd: CommandResult, isFromVoice: boolean): void {
    // Try execute first — if the executor refuses (unknown type), fall back to chat.
    const executed = this.voiceAssistant.execute(cmd);
    if (!executed) {
      this.streamChatMessage(userText, isFromVoice);
      return;
    }

    // User bubble
    const userMsg: ChatBotMessageDto = Object.assign(new ChatBotMessageDto(), {
      id: StringUtils.generateUUID(),
      role: 'user',
      content: userText,
      createDate: new Date().toISOString()
    });
    this.messages.push(userMsg);

    // Assistant ack bubble
    const ackText = cmd.message || this.buildCommandAck(cmd);
    const assistantMsg: ChatBotMessageDto = Object.assign(new ChatBotMessageDto(), {
      id: StringUtils.generateUUID(),
      role: 'assistant',
      content: ackText,
      createDate: new Date().toISOString()
    });
    this.messages.push(assistantMsg);
    this.scrollToBottom();

    if (isFromVoice) {
      this.voiceState = 'idle';
    }

    // If we're a popup and the user navigated, close the popup so they can see the page.
    if (cmd.type === 'navigation' && this.popupMode) {
      setTimeout(() => this.closePopup.emit(), 200);
    }

    this.cdr.markForCheck();
  }

  private buildCommandAck(cmd: CommandResult): string {
    if (cmd.type === 'navigation' && cmd.target) {
      return `Đang mở ${cmd.target}...`;
    }
    if (cmd.type === 'ui' && cmd.target) {
      return `Đã thực hiện: ${cmd.target}`;
    }
    return 'Đã thực hiện yêu cầu.';
  }

  private streamChatMessage(content: string, isFromVoice: boolean): void {
    // Snapshot ready attachments for display in the message bubble, then clear input strip
    const snappedAttachments = this.attachments.filter(a => a.status === 'ready');
    const userMsg: ChatBotMessageDto = Object.assign(new ChatBotMessageDto(), {
      id: StringUtils.generateUUID(),
      role: 'user',
      content,
      createDate: new Date().toISOString(),
      attachments: snappedAttachments.length > 0 ? [...snappedAttachments] : undefined
    });
    this.clearAttachments();
    this.messages.push(userMsg);
    this.isLoading = true;
    this.scrollToBottom();

    const conversationId = this.currentConversation?.id || '';

    const assistantMsg: ChatBotMessageDto = Object.assign(new ChatBotMessageDto(), {
      id: StringUtils.generateUUID(),
      role: 'assistant',
      content: '',
      createDate: new Date().toISOString()
    });

    let assistantBubbleAdded = false;

    const readyAttachmentIds = (snappedAttachments ?? []).map(a => a.id);

    this.chatBotService.sendMessage(conversationId, content, readyAttachmentIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: StreamChatBotEvent) => {
          if (event.type === 'meta') {
            if (event.isNewConversation && event.conversationId) {
              this.currentConversation = Object.assign(new ChatBotConversationDto(), {
                id: event.conversationId,
                title: content.length > 50 ? content.substring(0, 50) + '...' : content,
                createDate: new Date().toISOString()
              });
              this.updateConversationQueryParam(event.conversationId);
              this.loadConversations();
            }
          } else if (event.type === 'chunk' && event.content) {
            if (!assistantBubbleAdded) {
              this.messages.push(assistantMsg);
              assistantBubbleAdded = true;
              if (isFromVoice) {
                this.voiceState = 'streaming';
              }
            }
            assistantMsg.content = (assistantMsg.content ?? '') + event.content;
            this.scrollToBottom();
          } else if (event.type === 'done') {
            assistantMsg.content = this.deduplicateSources(assistantMsg.content ?? '');
            this.isLoading = false;
            if (isFromVoice) {
              this.voiceState = 'idle';
            }
            this.scrollToBottom();
          } else if (event.type === 'error') {
            this.isLoading = false;
            if (isFromVoice) {
              this.voiceState = 'idle';
            }
            if (!assistantBubbleAdded) {
              this.messages.push(Object.assign(new ChatBotMessageDto(), {
                id: StringUtils.generateUUID(),
                role: 'assistant',
                content: event.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.',
                createDate: new Date().toISOString()
              }));
            } else {
              assistantMsg.content = event.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
            }
          }
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.isLoading = false;
          if (isFromVoice) {
            this.voiceState = 'idle';
          }
          if (!assistantBubbleAdded) {
            this.messages.push(Object.assign(new ChatBotMessageDto(), {
              id: StringUtils.generateUUID(),
              role: 'assistant',
              content: 'Có lỗi xảy ra. Vui lòng thử lại.',
              createDate: new Date().toISOString()
            }));
          }
        }
      });
  }

  private deduplicateSources(content: string): string {
    const marker = 'Nguồn dữ liệu';
    const idx = content.indexOf(marker);
    if (idx === -1) return content;

    const beforeSources = content.substring(0, idx + marker.length);
    const sourcesSection = content.substring(idx + marker.length);

    // Extract all markdown links [text](url) and deduplicate by URL
    const seenUrls = new Set<string>();
    const deduped = sourcesSection.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, _text, url) => {
        const normalizedUrl = url.trim();
        if (seenUrls.has(normalizedUrl)) return '';
        seenUrls.add(normalizedUrl);
        return match;
      }
    );

    // Remove empty list items left after deduplication (e.g. "1. " or "- " with nothing)
    const cleaned = deduped.replace(/^\s*(\d+\.|-|\*)\s*$\n?/gm, '');

    return beforeSources + cleaned;
  }

  deleteConversation(conv: ChatBotConversationDto): void {
    this.chatBotService.deleteConversation(conv.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.conversations = this.conversations.filter(c => c.id !== conv.id);
        if (this.currentConversation?.id === conv.id) {
          this.newConversation();
          return;
        }

        if (this.routeConversationId === conv.id) {
          this.updateConversationQueryParam(null);
        }
      });
  }

  startRename(conv: ChatBotConversationDto, event: Event): void {
    event.stopPropagation();
    this.editingConversationId = conv.id;
    this.editingTitle = conv.title;
  }

  saveRename(conv: ChatBotConversationDto): void {
    if (!this.editingTitle.trim()) return;
    this.chatBotService.renameConversation(conv.id, this.editingTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        conv.title = this.editingTitle;
        this.editingConversationId = '';
      });
  }

  onKeydownSaveRename(event: KeyboardEvent, conv: ChatBotConversationDto): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.saveRename(conv);
    }
    if (event.key === 'Escape') this.cancelRename();
  }

  cancelRename(): void {
    this.editingConversationId = '';
    this.editingTitle = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.sendMessage();
    }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  private resetTextareaHeight(): void {
    setTimeout(() => {
      if (this.inputArea?.nativeElement) {
        this.inputArea.nativeElement.style.height = 'auto';
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  getAvatarText(): string {
    return this.accountInfo?.fullName?.charAt(0)?.toUpperCase() || 'U';
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  toggleVoiceInput(): void {
    if (this.voiceState === 'idle' || this.voiceState === 'error') {
      this.startVoiceInput();
    } else if (this.isVoiceReady) {
      this.stopVoiceInputAndSend();
    }
    // For 'initializing', 'processing', 'streaming' — do nothing
  }

  startVoiceInput(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Clean up any previous instance
    this.clearSilenceTimer();
    clearTimeout(this.readyTimeout);
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }

    this.voiceState = 'initializing';
    this.finalTranscript = '';
    this.inputMessage = '';
    this.cdr.markForCheck();

    const rec = new SpeechRecognition();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    this.recognition = rec;

    // If mic never actually activates within 6s → return to idle silently
    this.readyTimeout = setTimeout(() => {
      if (this.voiceState === 'initializing') {
        this.ngZone.run(() => {
          this.stopVoiceInput();
        });
      }
    }, 6000);

    this.ngZone.runOutsideAngular(() => {
      // Mic is truly open and capturing audio
      rec.onaudiostart = () => {
        clearTimeout(this.readyTimeout);
        this.ngZone.run(() => {
          this.voiceState = 'ready';
          this.cdr.markForCheck();
        });
      };

      // STT detected the start of speech — go to 'listening' immediately
      rec.onspeechstart = () => {
        this.ngZone.run(() => {
          this.voiceState = 'listening';
          this.cdr.markForCheck();
        });
      };

      // Called with every interim OR final result — always update text
      rec.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            this.finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const current = this.finalTranscript + interimTranscript;

        this.ngZone.run(() => {
          this.voiceState = 'listening';
          this.inputMessage = current;
          this.cdr.markForCheck();
        });

        // Reset silence timer on EVERY result (interim or final)
        // so we only send after a true pause in speech
        this.clearSilenceTimer();
        this.silenceTimer = setTimeout(() => {
          const text = (this.finalTranscript + interimTranscript).trim();
          if (text) {
            this.ngZone.run(() => this.stopVoiceInputAndSend());
          }
        }, 1500);
      };

      // Speech paused — send sooner (onspeechend fires before onresult silence)
      rec.onspeechend = () => {
        this.clearSilenceTimer();
        this.silenceTimer = setTimeout(() => {
          this.ngZone.run(() => {
            const text = this.inputMessage.trim();
            if (text && !this.isLoading) {
              this.stopVoiceInputAndSend();
            }
          });
        }, 700);
      };

      rec.onerror = (event: any) => {
        this.clearSilenceTimer();
        clearTimeout(this.readyTimeout);
        const error: string = event?.error ?? '';
        this.ngZone.run(() => {
          if (error === 'aborted') {
            // Intentional stop triggered by stopVoiceInputAndSend — ignore
            return;
          }
          if (error === 'no-speech' || error === 'audio-capture') {
            // No speech or mic not available — go idle quietly, no red state
            this.voiceState = 'idle';
            this.recognition = null;
          } else if (error === 'network') {
            // STT cloud unreachable — go idle quietly
            this.voiceState = 'idle';
            this.recognition = null;
          } else {
            // Other unexpected errors — brief error indicator
            this.voiceState = 'error';
            this.recognition = null;
            setTimeout(() => {
              if (this.voiceState === 'error') {
                this.voiceState = 'idle';
                this.cdr.markForCheck();
              }
            }, 1500);
          }
          this.cdr.markForCheck();
        });
      };

      // Fires when recognition fully stops (after onerror or .stop()/.abort())
      rec.onend = () => {
        this.clearSilenceTimer();
        clearTimeout(this.readyTimeout);
        this.ngZone.run(() => {
          // Only act if we weren't already handling it via stopVoiceInputAndSend
          if (this.voiceState === 'listening' || this.voiceState === 'ready') {
            const text = this.inputMessage.trim();
            this.recognition = null;
            if (text && !this.isLoading) {
              this.voiceState = 'processing';
              this.submitMessage(text);
              this.inputMessage = '';
            } else {
              this.voiceState = 'idle';
              this.inputMessage = '';
            }
            this.cdr.markForCheck();
          } else if (this.voiceState === 'initializing') {
            this.voiceState = 'idle';
            this.recognition = null;
            this.cdr.markForCheck();
          }
        });
      };

      try {
        rec.start();
      } catch (_err) {
        this.ngZone.run(() => {
          this.voiceState = 'idle';
          this.recognition = null;
          this.cdr.markForCheck();
        });
      }
    });
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer != null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private stopVoiceInputAndSend(): void {
    this.clearSilenceTimer();
    clearTimeout(this.readyTimeout);
    const text = this.inputMessage.trim();
    if (this.recognition) {
      // Null out callbacks BEFORE stop() to prevent onend re-entering
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onspeechend = null;
      this.recognition.onresult = null;
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
    if (text && !this.isLoading) {
      this.voiceState = 'processing';
      this.inputMessage = '';
      this.cdr.markForCheck();
      this.submitMessage(text);
    } else {
      this.voiceState = 'idle';
      this.inputMessage = '';
      this.cdr.markForCheck();
    }
  }

  stopVoiceInput(): void {
    this.clearSilenceTimer();
    clearTimeout(this.readyTimeout);
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onspeechend = null;
      this.recognition.onresult = null;
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
    this.voiceState = 'idle';
    this.cdr.markForCheck();
  }

  private applyRouteStateFromQuery(): void {
    const queryMap = this.route.snapshot.queryParamMap;
    this.routeConversationId = queryMap.get('conversationId') || '';
  }

  private updateConversationQueryParam(conversationId: string | null): void {
    this.routeConversationId = conversationId || '';
    if (this.popupMode) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { conversationId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // ========================================================================
  // Attachments (document upload for Q&A)
  // ========================================================================
  @ViewChild('fileInput', { static: false }) fileInputRef?: ElementRef<HTMLInputElement>;

  triggerFilePicker(): void {
    if (this.isLoading) return;
    this.fileInputRef?.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    this.uploadFiles(files);
    input.value = '';
  }

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent): void {
    if (!e.dataTransfer) return;
    const types = e.dataTransfer.types;
    if (!types || !Array.from(types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
    e.dataTransfer.dropEffect = 'copy';
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(e: DragEvent): void {
    if ((e.target as HTMLElement)?.closest('.drag-overlay')) return;
    this.isDragOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent): void {
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    this.uploadFiles(Array.from(e.dataTransfer.files));
  }

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent): void {
    if (!e.clipboardData?.files || e.clipboardData.files.length === 0) return;
    const files = Array.from(e.clipboardData.files);
    if (files.length === 0) return;
    e.preventDefault();
    this.uploadFiles(files);
  }

  private isAllowedExtension(name: string): boolean {
    const idx = name.lastIndexOf('.');
    if (idx < 0) return false;
    const ext = name.substring(idx).toLowerCase();
    return this.acceptedExtensions.split(',').includes(ext);
  }

  uploadFiles(files: File[]): void {
    if (!files || files.length === 0) return;
    const allowed = this.acceptedExtensions.split(',');
    const accepted: File[] = [];
    for (const f of files) {
      const err = validateClientFile(f, UPLOAD_MAX_BYTES.chatBot, allowed);
      if (err) {
        this.nzMessage.warning(`${f.name}: ${err}`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length === 0) return;

    const conversationId = this.currentConversation?.id || '';
    this.chatBotService.uploadAttachments(accepted, conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res) return;
          const data = res.data ?? res;
          if (data?.conversationId && data?.isNewConversation && !this.currentConversation) {
            this.currentConversation = { id: data.conversationId, title: '' } as ChatBotConversationDto;
            this.updateConversationQueryParam(data.conversationId);
            // refresh sidebar list
            this.loadConversations();
          }
          const items: ChatBotAttachmentDto[] = (data?.attachments ?? []) as ChatBotAttachmentDto[];
          for (const item of items) {
            this.attachments = [...this.attachments, item];
            if (item.status !== 'ready' && item.status !== 'error') {
              this.startPollingAttachment(item.id);
            }
          }
          this.cdr.markForCheck();
        },
        error: () => {
          // silently ignore; per-file errors surfaced via status polling
        }
      });
  }

  private startPollingAttachment(id: string): void {
    if (this.attachmentPollers.has(id)) return;
    const started = Date.now();
    const intervalId = setInterval(() => {
      // give up after 90 seconds
      if (Date.now() - started > 90_000) {
        this.stopPollingAttachment(id);
        return;
      }
      this.chatBotService.getAttachmentStatus(id).subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          if (!data) return;
          this.ngZone.run(() => {
            const idx = this.attachments.findIndex(a => a.id === id);
            if (idx < 0) return;
            this.attachments[idx] = { ...this.attachments[idx], ...data } as ChatBotAttachmentDto;
            this.attachments = [...this.attachments];
            this.cdr.markForCheck();
            if (data.status === 'ready' || data.status === 'error') {
              this.stopPollingAttachment(id);
            }
          });
        },
        error: () => { /* keep polling */ }
      });
    }, 1500);
    this.attachmentPollers.set(id, intervalId);
  }

  private stopPollingAttachment(id: string): void {
    const t = this.attachmentPollers.get(id);
    if (t) { clearInterval(t); this.attachmentPollers.delete(id); }
  }

  removeAttachment(att: ChatBotAttachmentDto): void {
    this.stopPollingAttachment(att.id);
    this.chatBotService.deleteAttachment(att.id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.id !== att.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.attachments = this.attachments.filter(a => a.id !== att.id);
        this.cdr.markForCheck();
      }
    });
  }

  clearAttachments(): void {
    for (const id of Array.from(this.attachmentPollers.keys())) {
      this.stopPollingAttachment(id);
    }
    this.attachments = [];
  }

  private loadConversationAttachments(conversationId: string): void {
    if (!conversationId) return;
    this.chatBotService.getConversationAttachments(conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          if (!Array.isArray(data)) return;
          this.attachments = data as ChatBotAttachmentDto[];
          for (const a of this.attachments) {
            if (a.status !== 'ready' && a.status !== 'error') {
              this.startPollingAttachment(a.id);
            }
          }
          this.cdr.markForCheck();
        },
        error: () => { /* ignore */ }
      });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  attachmentStatusLabel(a: ChatBotAttachmentDto): string {
    switch (a.status) {
      case 'uploading': return 'Đang tải lên…';
      case 'ocr': return 'Đang trích xuất nội dung…';
      case 'ready': return 'Sẵn sàng';
      case 'error': return a.error || 'Lỗi xử lý';
      default: return '';
    }
  }
}
