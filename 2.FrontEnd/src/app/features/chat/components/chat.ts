import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { EnvironmentService, GlobalService } from '../../../core';
import { LocalStorageUtils } from '../../../shared/utils';
import { UPLOAD_MAX_BYTES, validateClientFile } from '../../../shared/utils/file-upload-guard';
import { SignalRService } from '../../../shared/services/signalr.service';
import { ChatConversationDto, ChatMessageDto, ChatReactionDto, CreateConversationDto, ForwardMessageDto, SendMessageDto, ChatParticipantDto } from '../models';
import { ChatService } from '../services/chat.service';
import { AccountService } from '../../system-manager/services/account.service';
import { LinkifyPipe } from '../pipes/linkify.pipe';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CallStateService, IncomingCallPayload, OnlinePresenceService } from '../../../shared/services';
import { FluentEmojiPipe } from '../pipes/fluent-emoji.pipe';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar';
import { FileService } from '../../../shared/services/file.service';

@Component({
  selector: 'app-chat',
  imports: [SharedModules, LinkifyPipe, FluentEmojiPipe, UserAvatarComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  private destroy$ = new Subject<void>();

  conversations: ChatConversationDto[] = [];
  selectedConversation: ChatConversationDto | null = null;
  messages: ChatMessageDto[] = [];
  searchConversation: string = '';

  currentUser: string = '';
  currentFullName: string = '';

  visibleCreateGroup: boolean = false;
  groupName: string = '';
  searchedUsers: any[] = [];
  selectedUsers: any[] = [];
  userSearchKeyword: string = '';

  visibleAddMember: boolean = false;

  visibleCreatePrivate: boolean = false;

  onlineUsers: Set<string> = new Set();

  page: number = 1;
  private isFetchingMessages: boolean = false;
  private isFetchingOlderMessages: boolean = false;
  hasMoreMessages: boolean = true;

  convPage: number = 1;
  convPageSize: number = 20;
  private isFetchingConversations: boolean = false;
  hasMoreConversations: boolean = true;

  selectedFile: File | null = null;
  filePreviewUrl: SafeUrl | null = null;
  isDraggingFile: boolean = false;
  previewImage: string = '';

  @ViewChild('messageInputRef') messageInputRef!: ElementRef;
  showEmojiPicker: boolean = false;
  isMessageEmpty: boolean = true;
  allFluentEmojis: string[] = [];
  displayedIcons: string[] = [];
  emojiSearchKeyword: string = '';
  private iconPage: number = 1;
  private iconPageSize: number = 80;

  emojis: string[] = [
    'grinning-face', 'smiling-face-with-heart-eyes', 'star-struck', 'face-blowing-a-kiss', 'smiling-face-with-sunglasses',
    'face-savoring-food', 'grinning-face-with-sweat', 'hugging-face', 'thinking-face', 'neutral-face',
    'relieved-face', 'sleeping-face', 'partying-face', 'exploding-head', 'smiling-face-with-horns',
    'skull', 'ghost', 'robot', 'pile-of-poo', 'red-heart', 'heart-on-fire', 'sparkling-heart',
    'thumbs-up', 'thumbs-down', 'clapping-hands', 'raising-hands', 'folded-hands', 'flexed-biceps',
    'fire', 'sparkles', 'collision', 'hundred-points', 'check-mark-button', 'rocket', 'party-popper',
    'crown', 'trophy', 'military-medal', 'wrapped-gift', 'star', 'sun', 'crescent-moon', 'high-voltage', 'cloud', 'umbrella',
    'file-folder', 'paperclip', 'camera', 'video-camera', 'telephone', 'laptop', 'desktop-computer'
  ];

  replyToMessage: ChatMessageDto | null = null;
  typingUsers: Map<string, string> = new Map();
  private typingTimers: Map<string, any> = new Map();
  private typingThrottle: any = null;

  contextMenuMessage: ChatMessageDto | null = null;
  contextMenuVisible: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;

  showReactionPicker: boolean = false;
  reactionPickerMessage: ChatMessageDto | null = null;
  quickReactions: string[] = ['thumbs-up', 'red-heart', 'face-with-tears-of-joy', 'face-with-open-mouth', 'crying-face', 'pouting-face'];

  pinnedMessages: ChatMessageDto[] = [];
  showPinnedPanel: boolean = false;

  searchMessageKeyword: string = '';
  searchResults: ChatMessageDto[] = [];
  showSearchPanel: boolean = false;
  searchPage: number = 1;

  visibleForward: boolean = false;
  forwardMessage_: ChatMessageDto | null = null;
  selectedForwardConversations: string[] = [];

  externalPlatforms = [
    { name: 'Telegram', url: 'https://web.telegram.org', color: '#0088cc' },
    { name: 'Zalo', url: 'https://chat.zalo.me', color: '#0068ff' },
    { name: 'Whatsapp', url: 'https://web.whatsapp.com', color: '#25d366' }
  ];
  selectedExternalPlatform: any = null;
  externalPlatformUrl: any = null;

  convContextMenu: ChatConversationDto | null = null;
  convContextMenuVisible: boolean = false;
  convContextMenuX: number = 0;
  convContextMenuY: number = 0;

  showInfoPanel: boolean = true;
  infoPanelUser: any = null;

  conversationImages: ChatMessageDto[] = [];
  conversationFiles: ChatMessageDto[] = [];
  conversationLinks: ChatMessageDto[] = [];
  isLoadingMediaFiles: boolean = false;

  mediaPages: Record<string, number> = { images: 1, files: 1, links: 1 };
  mediaHasMore: Record<string, boolean> = { images: false, files: false, links: false };
  isLoadingMoreMedia: Record<string, boolean> = { images: false, files: false, links: false };
  mediaExpanded: Record<string, boolean> = { images: false, files: false, links: false };

  // Jitsi Call
  isCallActive: boolean = false;
  isVideoCall: boolean = false;
  isCallInitiator: boolean = false;
  private callWindow: Window | null = null;
  private callStartTime: Date | null = null;
  private callWindowPollInterval: any = null;
  private callMessageListener?: (event: MessageEvent) => void;

  // Ticket Cache
  fileTickets: Map<string, string> = new Map();

  // Incoming call
  private pendingAcceptedCall: IncomingCallPayload | null = null;

  constructor(
    private global: GlobalService,
    private chatService: ChatService,
    private modal: NzModalService,
    private signalR: SignalRService,
    private accountService: AccountService,
    private sanitizer: DomSanitizer,
    private env: EnvironmentService,
    private route: ActivatedRoute,
    private router: Router,
    private nzMessage: NzMessageService,
    private callStateService: CallStateService,
    private onlinePresence: OnlinePresenceService,
    private fileService: FileService,
  ) {
    const accountInfo = LocalStorageUtils.getItem('accountInfo');
    this.currentUser = accountInfo?.userName || '';
    this.currentFullName = accountInfo?.fullName || '';

    this.global.setBreadcrumb([{ name: 'Trao đổi, trò chuyện', path: 'chat' }]);
  }

  ngOnInit(): void {
    this.loadConversations();
    this.loadOnlineUsers();
    this.onlinePresence.onlineUsers$.pipe(takeUntil(this.destroy$)).subscribe((users) => {
      this.onlineUsers = new Set(users);
    });
    this.signalR.messageReceived$.pipe(takeUntil(this.destroy$)).subscribe((msg: ChatMessageDto) => {
      if (this.selectedConversation && msg.conversationId === this.selectedConversation.id) {
        this.messages.push(msg);
        this.scrollToBottom();
        this.chatService.markAsRead(this.selectedConversation.id).pipe(takeUntil(this.destroy$)).subscribe();
        if (msg.fileUrl) this.ensureTickets([msg.fileUrl]);
      } else {
        const conv = this.conversations.find(c => c.id === msg.conversationId);
        if (conv) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        this.nzMessage.info(`${msg.senderFullName || msg.senderUserName}: ${msg.content || 'Đã gửi tệp'}`);
      }
      this.updateConversationLastMessage(msg);
    });
    this.signalR.typingReceived$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (this.selectedConversation && data.conversationId === this.selectedConversation.id) {
        this.typingUsers.set(data.userName, data.userName);
        const existingTimer = this.typingTimers.get(data.userName);
        if (existingTimer) clearTimeout(existingTimer);
        this.typingTimers.set(data.userName, setTimeout(() => {
          this.typingUsers.delete(data.userName);
          this.typingTimers.delete(data.userName);
        }, 3000));
      }
    });
    this.signalR.messageRecalled$.pipe(takeUntil(this.destroy$)).subscribe((msg: ChatMessageDto) => {
      const idx = this.messages.findIndex(m => m.id === msg.id);
      if (idx >= 0) {
        this.messages[idx].isRecalled = true;
        this.messages[idx].content = '';
      }

      // Cập nhật preview ở danh sách hội thoại
      const conv = this.conversations.find(c => c.id === msg.conversationId);
      if (conv && conv.lastMessage?.id === msg.id) {
        conv.lastMessage.isRecalled = true;
        conv.lastMessage.content = '';
      }
    });
    this.signalR.messagePinned$.pipe(takeUntil(this.destroy$)).subscribe((msg: ChatMessageDto) => {
      const idx = this.messages.findIndex(m => m.id === msg.id);
      if (idx >= 0) {
        this.messages[idx].isPinned = msg.isPinned;
      }
      if (this.showPinnedPanel) this.loadPinnedMessages();
    });
    this.signalR.allReactionsRemoved$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      const idx = this.messages.findIndex(m => m.id === data.messageId);
      if (idx >= 0) {
        this.messages[idx].reactions = (this.messages[idx].reactions || []).filter(
          (r: ChatReactionDto) => r.userName !== data.userName
        );
      }
    });
    this.signalR.reactionUpdated$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      const idx = this.messages.findIndex(m => m.id === data.messageId);
      if (idx >= 0) {
        if (data.removed) {
          this.messages[idx].reactions = (this.messages[idx].reactions || []).filter(
            (r: ChatReactionDto) => !(r.userName === data.userName && r.emoji === data.reaction?.emoji)
          );
        } else if (data.reaction) {
          if (!this.messages[idx].reactions) this.messages[idx].reactions = [];
          const exists = this.messages[idx].reactions.some((r: ChatReactionDto) =>
            r.id === data.reaction.id
          );
          if (!exists) {
            this.messages[idx].reactions.push(data.reaction);
          }
        }
      }
    });
    this.signalR.conversationRead$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (this.selectedConversation && this.selectedConversation.id === data.conversationId) {
        const participant = this.selectedConversation.participants?.find(p => p.userName === data.userName);
        if (participant) {
          participant.lastReadAt = data.lastReadAt;
        }
      }
      const conv = this.conversations.find(c => c.id === data.conversationId);
      if (conv) {
        const participant = conv.participants?.find(p => p.userName === data.userName);
        if (participant) {
          participant.lastReadAt = data.lastReadAt;
        }
      }
    });
    this.signalR.callSignal$.pipe(takeUntil(this.destroy$)).subscribe(({ signalType, payload }) => {
      this.handleCallSignal(signalType, payload);
    });
    this.callStateService.acceptedCall$.pipe(takeUntil(this.destroy$)).subscribe(call => {
      if (!call) return;
      this.openJitsiForAcceptedCall(call);
    });

    this.initFluentEmojis();
  }

  private initFluentEmojis() {
    this.allFluentEmojis = [
      'grinning-face', 'grinning-face-with-big-eyes', 'grinning-face-with-smiling-eyes', 'beaming-face-with-smiling-eyes',
      'grinning-squinting-face', 'grinning-face-with-sweat', 'rolling-on-the-floor-laughing', 'face-with-tears-of-joy',
      'slightly-smiling-face', 'upside-down-face', 'winking-face', 'smiling-face-with-smiling-eyes',
      'smiling-face-with-halo', 'smiling-face-with-hearts', 'smiling-face-with-heart-eyes', 'star-struck',
      'face-blowing-a-kiss', 'kissing-face', 'smiling-face', 'kissing-face-with-smiling-eyes', 'kissing-face-with-closed-eyes',
      'face-savoring-food', 'face-with-tongue', 'winking-face-with-tongue', 'squinting-face-with-tongue', 'money-mouth-face',
      'hugging-face', 'face-with-hand-over-mouth', 'shushing-face', 'thinking-face', 'zipper-mouth-face',
      'face-with-raised-eyebrow', 'neutral-face', 'expressionless-face', 'face-without-mouth', 'face-in-clouds',
      'smirking-face', 'unamused-face', 'face-with-rolling-eyes', 'grimacing-face', 'lying-face', 'relieved-face',
      'pensive-face', 'sleepy-face', 'drooling-face', 'sleeping-face', 'face-with-medical-mask', 'face-with-thermometer',
      'face-with-head-bandage', 'nauseated-face', 'face-vomiting', 'sneezing-face', 'hot-face', 'cold-face',
      'woozy-face', 'face-with-spiral-eyes', 'exploding-head', 'cowboy-hat-face', 'partying-face', 'disguised-face',
      'smiling-face-with-sunglasses', 'nerd-face', 'face-with-monocle', 'confused-face', 'worried-face',
      'slightly-frowning-face', 'frowning-face', 'face-with-open-mouth', 'hushed-face', 'astonished-face',
      'flushed-face', 'pleading-face', 'frowning-face-with-open-mouth', 'anguished-face', 'fearful-face',
      'sad-but-relieved-face', 'crying-face', 'loudly-crying-face', 'face-screaming-in-fear',
      'confounded-face', 'persevering-face', 'disappointed-face', 'face-with-steam-from-nose', 'pouting-face',
      'angry-face', 'face-with-symbols-on-mouth', 'smiling-face-with-horns', 'angry-face-with-horns', 'skull',
      'skull-and-crossbones', 'pile-of-poo', 'clown-face', 'ogre', 'goblin', 'ghost', 'alien', 'alien-monster',
      'robot', 'grinning-cat', 'grinning-cat-with-smiling-eyes', 'cat-with-tears-of-joy', 'smiling-cat-with-heart-eyes',
      'cat-with-wry-smile', 'kissing-cat', 'weary-cat', 'crying-cat', 'pouting-cat', 'see-no-evil-monkey',
      'hear-no-evil-monkey', 'speak-no-evil-monkey', 'red-heart', 'orange-heart', 'yellow-heart', 'green-heart',
      'blue-heart', 'purple-heart', 'brown-heart', 'black-heart', 'white-heart', 'broken-heart', 'heart-on-fire',
      'mending-heart', 'two-hearts', 'revolving-hearts', 'beating-heart', 'growing-heart', 'sparkling-heart',
      'heart-with-arrow', 'heart-with-ribbon', 'heart-decoration', 'peace-symbol', 'latin-cross', 'star-and-crescent',
      'om', 'wheel-of-dharma', 'star-of-david', 'dotted-six-pointed-star', 'menorah', 'yin-yang', 'orthodox-cross',
      'place-of-worship', 'atom-symbol', 'shinto-shrine', 'hindu-temple', 'mosque', 'synagogue', 'kaaba',
      'thumbs-up', 'thumbs-down', 'clapping-hands', 'raising-hands', 'folded-hands', 'hand-with-fingers-splayed',
      'victory-hand', 'love-you-gesture', 'sign-of-the-horns', 'call-me-hand', 'backhand-index-pointing-left',
      'backhand-index-pointing-right', 'backhand-index-pointing-up', 'backhand-index-pointing-down',
      'index-pointing-up', 'middle-finger', 'writing-hand', 'selfie', 'flexed-biceps', 'mechanical-arm', 'mechanical-leg',
      'leg', 'foot', 'ear', 'ear-with-hearing-aid', 'nose', 'brain', 'anatomical-heart', 'lungs', 'tooth', 'bone',
      'eyes', 'eye', 'tongue', 'mouth', 'fire', 'sparkles', 'collision', 'hundred-points', 'check-mark-button',
      'rocket', 'party-popper', 'crown', 'trophy', 'military-medal', 'wrapped-gift', 'star', 'sun', 'crescent-moon', 'high-voltage', 'cloud',
      'umbrella', 'file-folder', 'paperclip', 'camera', 'video-camera', 'telephone', 'laptop', 'desktop-computer'
    ];
    this.loadMoreIcons();
  }

  getEmojiUrl(name: string): string {
    return `https://api.iconify.design/fluent-emoji:${name}.svg`;
  }

  insertEmoji(name: string) {
    const url = this.getEmojiUrl(name);

    // Build the emoji <img> node using DOM APIs — avoids innerHTML to comply
    // with the Trusted Types 'require-trusted-types-for script' CSP directive.
    const img = document.createElement('img');
    img.src = url;
    img.alt = name;
    img.className = 'emoji-inline';
    img.dataset['emoji'] = name;
    img.style.width = '24px';
    img.style.height = '24px';
    img.style.verticalAlign = 'middle';
    img.style.margin = '0 2px';

    const input = this.messageInputRef.nativeElement;
    input.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (input.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        input.appendChild(img);
      }
    } else {
      input.appendChild(img);
    }

    this.showEmojiPicker = false;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.sendMessage();
    } else {
      this.onInputTyping();
    }
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          event.preventDefault();
          const file = items[i].getAsFile();
          if (file) this.selectFile(file);
          return;
        }
      }
    }

    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      selection.getRangeAt(0).deleteContents();
      selection.getRangeAt(0).insertNode(document.createTextNode(text));
      selection.collapseToEnd();
      this.onInputChange();
    }
  }

  onInputChange() {
    this.isMessageEmpty = !this.messageInputRef.nativeElement.innerText.trim();
  }

  private getMessageContent(): string {
    if (!this.messageInputRef) return '';
    const input = this.messageInputRef.nativeElement;
    const clone = input.cloneNode(true) as HTMLElement;

    const imgs = clone.querySelectorAll('img');
    imgs.forEach(img => {
      const emojiName = img.getAttribute('alt');
      img.replaceWith(`:${emojiName}:`);
    });

    return clone.innerText.trim();
  }

  loadMoreIcons(reset: boolean = false) {
    if (reset) {
      this.iconPage = 1;
      this.displayedIcons = [];
    }

    let sourceList = this.allFluentEmojis;
    if (this.emojiSearchKeyword.trim()) {
      const kw = this.emojiSearchKeyword.toLowerCase();
      sourceList = this.allFluentEmojis.filter(name => name.includes(kw));
    }

    const start = (this.iconPage - 1) * this.iconPageSize;
    const end = start + this.iconPageSize;
    const nextBatch = sourceList.slice(start, end);

    if (nextBatch.length > 0) {
      this.displayedIcons = [...this.displayedIcons, ...nextBatch];
      this.iconPage++;
    }
  }

  onEmojiScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      this.loadMoreIcons();
    }
  }

  onEmojiSearch() {
    this.loadMoreIcons(true);
  }

  loadOnlineUsers() {
    this.onlinePresence.init();
    this.onlineUsers = this.onlinePresence.getSnapshot();
  }

  loadConversations() {
    this.convPage = 1;
    this.hasMoreConversations = true;
    this.chatService.getConversations(this.convPage, this.convPageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.conversations = res || [];
        if (this.conversations.length < this.convPageSize) {
          this.hasMoreConversations = false;
        }
        const queryId = this.route.snapshot.queryParamMap.get('id');
        if (queryId && !this.selectedConversation) {
          const conv = this.conversations.find(c => c.id === queryId);
          if (conv) {
            this.selectConversation(conv);
          }
        }
        // Resume a pending accepted call that arrived before conversations were loaded
        if (this.pendingAcceptedCall) {
          const call = this.pendingAcceptedCall;
          this.pendingAcceptedCall = null;
          this.openJitsiForAcceptedCall(call);
        }
      }
    });
  }

  get filteredConversations(): ChatConversationDto[] {
    if (!this.searchConversation?.trim()) return this.conversations;
    const kw = this.searchConversation.toLowerCase();
    return this.conversations.filter(c => c.name?.toLowerCase().includes(kw));
  }

  selectConversation(conv: ChatConversationDto) {
    this.selectedExternalPlatform = null;
    this.externalPlatformUrl = null;
    this.selectedConversation = conv;
    this.page = 1;
    this.messages = [];
    this.hasMoreMessages = true;
    this.replyToMessage = null;
    this.showPinnedPanel = false;
    this.showSearchPanel = false;
    this.infoPanelUser = null;
    if (this.showInfoPanel && !conv.isGroup) {
      const other = conv.participants?.find(p => p.userName !== this.currentUser);
      if (other) {
        this.accountService.detail(other.userName).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => { this.infoPanelUser = res; }
        });
      }
    }
    this.conversationImages = [];
    this.conversationFiles = [];
    this.conversationLinks = [];
    if (this.showInfoPanel) {
      this.loadMediaFilesLinks();
    }
    this.router.navigate([], { queryParams: { id: conv.id }, queryParamsHandling: 'merge', replaceUrl: true });
    this.loadMessages(true);
    if (conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.chatService.markAsRead(conv.id).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  loadMessages(initial: boolean = false) {
    if (!this.selectedConversation) return;
    if (initial) {
      this.isFetchingMessages = true;
    } else {
      this.isFetchingOlderMessages = true;
    }
    this.chatService.getMessages(this.selectedConversation.id, this.page, 50).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data: ChatMessageDto[] = res || [];
        if (data.length < 50) {
          this.hasMoreMessages = false;
        }
        if (initial) {
          this.messages = data;
          this.isFetchingMessages = false;
          this.scrollToBottom();
        } else {
          const container = this.messageContainer?.nativeElement;
          const prevHeight = container?.scrollHeight || 0;
          this.messages = [...data, ...this.messages];
          this.isFetchingOlderMessages = false;
          setTimeout(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevHeight;
            }
          }, 20);
        }
        
        const fileIds = data.filter(m => m.fileUrl).map(m => m.fileUrl!);
        this.ensureTickets(fileIds);
      }
    });
  }

  onMessagesScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollTop <= 50 && !this.isFetchingOlderMessages && this.hasMoreMessages) {
      this.page++;
      this.loadMessages(false);
    }
  }

  onConversationsScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && !this.isFetchingConversations && this.hasMoreConversations) {
      this.convPage++;
      this.loadMoreConversations();
    }
  }

  loadMoreConversations() {
    this.isFetchingConversations = true;
    this.chatService.getConversations(this.convPage, this.convPageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res || [];
        if (data.length < this.convPageSize) {
          this.hasMoreConversations = false;
        }
        this.conversations = [...this.conversations, ...data];
        this.isFetchingConversations = false;
      }
    });
  }

  sendMessage() {
    const content = this.getMessageContent();
    if (!content && !this.selectedFile) return;
    if (!this.selectedConversation) return;

    const dto = new SendMessageDto();
    dto.conversationId = this.selectedConversation.id;
    dto.content = content;
    if (this.replyToMessage) {
      dto.replyToMessageId = this.replyToMessage.id;
    }
    const file = this.selectedFile || undefined;
    this.chatService.sendMessage(dto, file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          if (this.messageInputRef) {
            // replaceChildren() with no args clears all children without innerHTML.
            this.messageInputRef.nativeElement.replaceChildren();
          }
          this.replyToMessage = null;
          this.clearFile();
          this.scrollToBottom();
          this.onInputChange();
        }
      }
    });
  }

  onKeydownSearchMessages(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.searchMessages();
    }
  }

  openCreatePrivate() {
    this.visibleCreatePrivate = true;
    this.selectedUsers = [];
    this.userSearchKeyword = '';
    this.searchUsers();
  }

  createPrivateChat() {
    if (this.selectedUsers.length === 0) return;
    this.chatService.getPrivateConversation(this.selectedUsers[0].userName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res) {
          const exists = this.conversations.find(c => c.id === res.id);
          if (!exists) this.conversations.unshift(res);
          this.selectConversation(res);
          this.visibleCreatePrivate = false;
        }
      }
    });
  }

  searchUsers() {
    const params: any = { keyWord: this.userSearchKeyword || '', pageSize: 50, currentPage: 1, isActive: true };
    this.accountService.search(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];
        this.searchedUsers = data.filter((u: any) => u.userName !== this.currentUser);
      }
    });
  }

  toggleUserSelection(user: any, mode: 'single' | 'multi') {
    if (mode === 'single') {
      this.selectedUsers = [user];
    } else {
      const idx = this.selectedUsers.findIndex((u: any) => u.userName === user.userName);
      if (idx >= 0) {
        this.selectedUsers.splice(idx, 1);
      } else {
        this.selectedUsers = [...this.selectedUsers, user];
      }
    }
  }

  isUserSelected(userName: string): boolean {
    return this.selectedUsers.some((u: any) => u.userName === userName);
  }

  getUserAvatarText(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
  }

  openCreateGroup() {
    this.visibleCreateGroup = true;
    this.groupName = '';
    this.selectedUsers = [];
    this.userSearchKeyword = '';
    this.searchUsers();
  }

  createGroup() {
    if (!this.groupName?.trim() || this.selectedUsers.length === 0) return;
    const dto = new CreateConversationDto();
    dto.name = this.groupName.trim();
    dto.isGroup = true;
    dto.userNames = this.selectedUsers.map((u: any) => u.userName);
    this.chatService.createConversation(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.conversations.unshift(res.data || res);
          this.selectConversation(res.data || res);
          this.visibleCreateGroup = false;
        }
      }
    });
  }

  openAddMember() {
    this.visibleAddMember = true;
    this.selectedUsers = [];
    this.userSearchKeyword = '';
    this.searchUsers();
  }

  addMembers() {
    if (!this.selectedConversation || this.selectedUsers.length === 0) return;
    const userNames = this.selectedUsers.map((u: any) => u.userName);
    this.chatService.addParticipants(this.selectedConversation.id, userNames).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.visibleAddMember = false;
        this.loadConversations();
      }
    });
  }

  isMe(msg: ChatMessageDto): boolean {
    return msg.senderUserName === this.currentUser;
  }

  getConversationAvatar(conv: ChatConversationDto): string {
    return conv.isGroup ? 'team' : 'user';
  }

  getAvatarText(conv: ChatConversationDto): string {
    const name = this.getConversationDisplayName(conv);
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getOtherParticipant(conv: ChatConversationDto): ChatParticipantDto | undefined {
    if (conv.isGroup) return undefined;
    return conv.participants?.find(p => p.userName !== this.currentUser);
  }

  getConversationDisplayName(conv: ChatConversationDto): string {
    if (conv.isGroup) return conv.name || '';
    const other = conv.participants?.find(p => p.userName !== this.currentUser);
    return other?.fullName || other?.userName || conv.name || '';
  }

  isConversationOnline(conv: ChatConversationDto): boolean {
    if (conv.isGroup) return conv.participants?.some(p => p.userName !== this.currentUser && this.isUserOnline(p.userName)) || false;
    const other = conv.participants?.find(p => p.userName !== this.currentUser);
    return other ? this.isUserOnline(other.userName) : false;
  }

  getConversationStatusText(conv: ChatConversationDto): string {
    if (conv.isGroup) {
      const onlineCount = conv.participants?.filter(p => p.userName !== this.currentUser && this.isUserOnline(p.userName)).length || 0;
      return onlineCount > 0 ? `${onlineCount} đang trực tuyến` : 'Không có ai trực tuyến';
    }
    return this.isConversationOnline(conv) ? 'Trực tuyến' : 'Ngoại tuyến';
  }

  private isUserOnline(userName: string): boolean {
    const normalized = (userName || '').toString().trim().toLowerCase();
    return !!normalized && this.onlineUsers.has(normalized);
  }

  private updateConversationLastMessage(msg: ChatMessageDto) {
    const conv = this.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg;
      this.conversations = [conv, ...this.conversations.filter(c => c.id !== msg.conversationId)];
    } else {
      this.loadConversations();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  trackById(index: number, item: any): any {
    return item.id;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0]);
    }
    input.value = '';
  }

  clearFile() {
    this.selectedFile = null;
    this.filePreviewUrl = null;
  }

  selectFile(file: File) {
    const err = validateClientFile(file, UPLOAD_MAX_BYTES.chat);
    if (err) {
      this.nzMessage.error(err);
      return;
    }
    this.selectedFile = file;
    if (file.type.startsWith('image/')) {
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
    } else {
      this.filePreviewUrl = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
    if (!this.selectedConversation) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  private ensureTickets(fileIds: string[]) {
    const missing = fileIds.filter(id => id && !this.fileTickets.has(id));
    const uniqueMissing = [...new Set(missing)];
    
    uniqueMissing.forEach(fileId => {
      this.fileTickets.set(fileId, ''); // mark as loading
      this.fileService.requestDownloadTicket(fileId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
           if (res?.data?.ticket) {
               this.fileTickets.set(fileId, res.data.ticket);
           } else if (res?.ticket) {
               this.fileTickets.set(fileId, res.ticket);
           }
        },
        error: (err) => console.error(`[ensureTickets] error for ${fileId}:`, err)
      });
    });
  }

  getFileDownloadUrl(msg: ChatMessageDto): string {
    const ticket = this.fileTickets.get(msg.fileUrl) || undefined;
    return this.fileService.getDownloadUrl(msg.fileUrl, ticket);
  }

  getImageUrl(msg: ChatMessageDto): string {
    const ticket = this.fileTickets.get(msg.fileUrl) || undefined;
    return this.fileService.getDownloadUrl(msg.fileUrl, ticket);
  }

  isImage(msg: ChatMessageDto): boolean {
    return msg.messageType === 'Image';
  }

  isVideo(msg: ChatMessageDto): boolean {
    if (msg.messageType === 'Video') return true;
    if (msg.messageType === 'File' && msg.fileName && 
        (msg.fileName.toLowerCase().endsWith('.mp4') || 
         msg.fileName.toLowerCase().endsWith('.webm') || 
         msg.fileName.toLowerCase().endsWith('.ogg'))) {
      return true;
    }
    return false;
  }

  getVideoUrl(msg: ChatMessageDto): string {
    const ticket = this.fileTickets.get(msg.fileUrl) || undefined;
    return this.fileService.getDownloadUrl(msg.fileUrl, ticket);
  }

  isFile(msg: ChatMessageDto): boolean {
    return msg.messageType === 'File' && !this.isVideo(msg);
  }

  isCall(msg: ChatMessageDto): boolean {
    return msg.messageType === 'Call' || msg.messageType === 'VideoCall';
  }

  isText(msg: ChatMessageDto): boolean {
    return msg.messageType === 'Text' || (!msg.messageType);
  }

  getLastMessagePreview(msg: ChatMessageDto): string {
    if (!msg) return '';
    if (msg.isRecalled) return 'Tin nhắn đã thu hồi';
    if (this.isImage(msg)) return '[Hình ảnh]';
    if (this.isFile(msg)) return '[Tệp đính kèm]';
    if (this.isCall(msg)) return `[${msg.messageType === 'VideoCall' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}]`;
    return msg.content || '';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  hasLink(text: string): boolean {
    return /https?:\/\/[^\s]+/.test(text || '');
  }

  onInputTyping() {
    if (!this.selectedConversation || this.typingThrottle) return;
    const participants = this.selectedConversation.participants?.map(p => p.userName) || [];
    this.signalR.sendTyping(this.selectedConversation.id, participants);
    this.typingThrottle = setTimeout(() => { this.typingThrottle = null; }, 2000);
  }

  get typingText(): string {
    const names = Array.from(this.typingUsers.keys());
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} đang nhập...`;
    return `${names.length} người đang nhập...`;
  }

  onMessageContextMenu(event: MouseEvent, msg: ChatMessageDto) {
    event.preventDefault();
    this.contextMenuMessage = msg;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  closeContextMenu() {
    this.contextMenuVisible = false;
    this.contextMenuMessage = null;
  }

  replyTo(msg: ChatMessageDto) {
    this.replyToMessage = msg;
    this.closeContextMenu();
  }

  cancelReply() {
    this.replyToMessage = null;
  }

  recallMessage(msg: ChatMessageDto) {
    this.chatService.recallMessage(msg.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          const idx = this.messages.findIndex(m => m.id === msg.id);
          if (idx >= 0) {
            this.messages[idx].isRecalled = true;
            this.messages[idx].content = '';
          }

          // Cập nhật preview ở sidebar cho chính mình
          const conv = this.conversations.find(c => c.id === msg.conversationId);
          if (conv && conv.lastMessage?.id === msg.id) {
            conv.lastMessage.isRecalled = true;
            conv.lastMessage.content = '';
          }
          this.nzMessage.success('Đã thu hồi tin nhắn');
        }
      }
    });
    this.closeContextMenu();
  }

  togglePin(msg: ChatMessageDto) {
    this.chatService.togglePin(msg.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const idx = this.messages.findIndex(m => m.id === msg.id);
          if (idx >= 0) {
            this.messages[idx].isPinned = res.data.isPinned;
          }
        }
      }
    });
    this.closeContextMenu();
  }

  loadPinnedMessages() {
    if (!this.selectedConversation) return;
    this.chatService.getPinnedMessages(this.selectedConversation.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.pinnedMessages = res || []; }
    });
  }

  togglePinnedPanel() {
    this.showPinnedPanel = !this.showPinnedPanel;
    if (this.showPinnedPanel) this.loadPinnedMessages();
  }

  toggleInfoPanel() {
    this.showInfoPanel = !this.showInfoPanel;
    if (this.showInfoPanel && this.selectedConversation) {
      this.loadMediaFilesLinks();
      if (!this.selectedConversation.isGroup) {
        const other = this.selectedConversation.participants?.find(p => p.userName !== this.currentUser);
        if (other) {
          this.accountService.detail(other.userName).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => { this.infoPanelUser = res; }
          });
        }
      }
    }
  }

  loadMediaFilesLinks() {
    if (!this.selectedConversation) return;
    this.isLoadingMediaFiles = true;
    this.mediaPages = { images: 1, files: 1, links: 1 };
    this.mediaHasMore = { images: false, files: false, links: false };
    this.mediaExpanded = { images: false, files: false, links: false };
    this.chatService.getMediaFilesLinks(this.selectedConversation.id, 20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        this.conversationImages = data.images || [];
        this.conversationFiles = data.files || [];
        this.conversationLinks = data.links || [];

        this.mediaHasMore['images'] = this.conversationImages.length === 20;
        this.mediaHasMore['files'] = this.conversationFiles.length === 20;
        this.mediaHasMore['links'] = this.conversationLinks.length === 20;

        const allMediaIds = [...this.conversationImages, ...this.conversationFiles].filter(m => m.fileUrl).map(m => m.fileUrl!);
        this.ensureTickets(allMediaIds);

        this.isLoadingMediaFiles = false;
      },
      error: () => {
        this.isLoadingMediaFiles = false;
      }
    });
  }

  loadMoreMedia(type: 'images' | 'files' | 'links') {
    if (!this.selectedConversation || this.isLoadingMoreMedia[type] || !this.mediaHasMore[type]) return;

    this.isLoadingMoreMedia[type] = true;
    this.mediaPages[type]++;

    const apiType = type === 'images' ? 'Images' : (type === 'files' ? 'Files' : 'Links');

    this.chatService.getMediaByType(this.selectedConversation.id, apiType, this.mediaPages[type], 20)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          const newItems = res?.data || res || [];
          if (type === 'images') {
            this.conversationImages = [...this.conversationImages, ...newItems];
          } else if (type === 'files') {
            this.conversationFiles = [...this.conversationFiles, ...newItems];
          } else if (type === 'links') {
            this.conversationLinks = [...this.conversationLinks, ...newItems];
          }
          
          if (type === 'images' || type === 'files') {
            const newIds = newItems.filter((m: any) => m.fileUrl).map((m: any) => m.fileUrl!);
            this.ensureTickets(newIds);
          }
          
          this.mediaHasMore[type] = newItems.length === 20;
          this.isLoadingMoreMedia[type] = false;
        },
        error: () => {
          this.mediaPages[type]--;
          this.isLoadingMoreMedia[type] = false;
        }
      });
  }

  openLink(msg: ChatMessageDto) {
    if (!msg.content) return;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = msg.content.match(urlRegex);
    if (match && match.length > 0) {
      window.open(match[0], '_blank');
    }
  }

  openReactionPicker(msg: ChatMessageDto) {
    this.reactionPickerMessage = msg;
    this.showReactionPicker = true;
    this.closeContextMenu();
  }

  addReaction(msg: ChatMessageDto, emoji: string) {
    if (!this.selectedConversation) return;
    this.chatService.toggleReaction(msg.id, this.selectedConversation.id, emoji).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const idx = this.messages.findIndex(m => m.id === msg.id);
          if (idx >= 0) {
            if (res.data.removed) {
              this.messages[idx].reactions = (this.messages[idx].reactions || []).filter(
                (r: ChatReactionDto) => !(r.userName === this.currentUser && r.emoji === emoji)
              );
            } else if (res.data.reaction) {
              if (!this.messages[idx].reactions) this.messages[idx].reactions = [];
              const exists = this.messages[idx].reactions.some((r: ChatReactionDto) =>
                r.id === res.data.reaction.id
              );
              if (!exists) {
                this.messages[idx].reactions.push(res.data.reaction);
              }
            }
          }
        }
      }
    });
  }

  removeAllReactions(msg: ChatMessageDto) {
    if (!this.selectedConversation) return;
    this.chatService.removeAllReactions(msg.id, this.selectedConversation.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const idx = this.messages.findIndex(m => m.id === msg.id);
        if (idx >= 0) {
          this.messages[idx].reactions = (this.messages[idx].reactions || []).filter(
            (r: ChatReactionDto) => r.userName !== this.currentUser
          );
        }
      }
    });
  }

  getGroupedReactions(msg: ChatMessageDto): { emoji: string; count: number; users: string[]; myReaction: boolean }[] {
    if (!msg.reactions?.length) return [];
    const map = new Map<string, { count: number; users: string[]; myReaction: boolean }>();
    for (const r of msg.reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(r.fullName || r.userName);
        if (r.userName === this.currentUser) existing.myReaction = true;
      } else {
        map.set(r.emoji, { count: 1, users: [r.fullName || r.userName], myReaction: r.userName === this.currentUser });
      }
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: Array.from(new Set(data.users)),
      myReaction: data.myReaction
    }));
  }

  getUsersSeenMessage(msg: ChatMessageDto): ChatParticipantDto[] {
    if (!this.selectedConversation || !this.selectedConversation.participants) return [];
    if (!msg.createDate) return [];
    const msgDate = new Date(msg.createDate).getTime();

    // Get participants who have read this message
    const readers = this.selectedConversation.participants.filter(p =>
      p.userName !== msg.senderUserName && // Don't show sender as reader
      p.userName !== this.currentUser && // Don't show current user as reader (optional, but cleaner)
      p.lastReadAt && new Date(p.lastReadAt).getTime() >= msgDate
    );

    // Filter to only show them at the FURTHEST message they've read
    const msgIdx = this.messages.findIndex(m => m.id === msg.id);
    if (msgIdx === -1) return [];

    return readers.filter(r => {
      const lastReadTime = new Date(r.lastReadAt!).getTime();
      // Check if there are any newer messages that this user has also read
      for (let i = msgIdx + 1; i < this.messages.length; i++) {
        const nextMsg = this.messages[i];
        if (nextMsg.createDate && new Date(nextMsg.createDate).getTime() <= lastReadTime) {
          return false; // They've read a newer message, so don't show them here
        }
      }
      return true;
    });
  }

  getInitials(name?: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
    if (!this.showSearchPanel) {
      this.searchResults = [];
      this.searchMessageKeyword = '';
    }
  }

  searchMessages() {
    if (!this.selectedConversation || !this.searchMessageKeyword?.trim()) return;
    this.searchPage = 1;
    this.chatService.searchMessages(this.selectedConversation.id, this.searchMessageKeyword.trim(), this.searchPage).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.searchResults = res || []; }
    });
  }

  scrollToMessage(messageId: string) {
    const element = document.getElementById('msg-' + messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 3000);
    } else {
      this.nzMessage.warning('Tin nhắn cũ chưa được tải lên, hãy cuộn lên để tìm.');
    }
  }

  openForwardModal(msg: ChatMessageDto) {
    this.forwardMessage_ = msg;
    this.visibleForward = true;
    this.selectedForwardConversations = [];
    this.closeContextMenu();
  }

  forwardToConversations() {
    if (!this.forwardMessage_ || this.selectedForwardConversations.length === 0) return;
    const dto = new ForwardMessageDto();
    dto.messageId = this.forwardMessage_.id;
    dto.conversationIds = this.selectedForwardConversations;
    this.chatService.forwardMessage(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.visibleForward = false;
          this.forwardMessage_ = null;
          this.nzMessage.success('Đã chuyển tiếp tin nhắn');
        }
      }
    });
  }

  leaveGroup() {
    if (!this.selectedConversation) return;
    this.chatService.leaveGroup(this.selectedConversation.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.conversations = this.conversations.filter(c => c.id !== this.selectedConversation?.id);
        this.selectedConversation = null;
        this.messages = [];
      }
    });
  }

  removeParticipant(userName: string) {
    if (!this.selectedConversation) return;
    this.chatService.removeParticipant(this.selectedConversation.id, userName).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.loadConversations(); }
    });
  }

  onConvContextMenu(event: MouseEvent, conv: ChatConversationDto) {
    event.preventDefault();
    event.stopPropagation();
    this.convContextMenu = conv;
    this.convContextMenuX = event.clientX;
    this.convContextMenuY = event.clientY;
    this.convContextMenuVisible = true;
  }

  closeConvContextMenu() {
    this.convContextMenuVisible = false;
    this.convContextMenu = null;
  }

  toggleReadStatus(conv: ChatConversationDto) {
    if (conv.unreadCount > 0) {
      this.chatService.markAsRead(conv.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { conv.unreadCount = 0; }
      });
    } else {
      this.chatService.markAsUnread(conv.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { conv.unreadCount = -1; }
      });
    }
    this.closeConvContextMenu();
  }

  confirmDeleteConversation(conv: ChatConversationDto) {
    this.modal.confirm({
      nzTitle: 'Xóa đoạn chat',
      nzContent: 'Bạn không thể hoàn tác sau khi xóa bản sao của cuộc trò chuyện này.',
      nzOkText: 'Xóa đoạn chat',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzCentered: true,
      nzOnOk: () => this.deleteConversation(conv)
    });
    this.closeConvContextMenu();
  }

  deleteConversation(conv: ChatConversationDto) {
    this.chatService.deleteConversation(conv.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status !== false) {
          this.nzMessage.success('Xóa cuộc trò chuyện thành công');
          this.conversations = this.conversations.filter(c => c.id !== conv.id);
          if (this.selectedConversation?.id === conv.id) {
            this.selectedConversation = null;
            this.messages = [];
          }
        } else {
          this.nzMessage.error(res?.messageObject?.message || 'Có lỗi xảy ra khi xóa');
        }
      }
    });
    this.closeConvContextMenu();
  }

  startCall(isVideo: boolean) {
    if (!this.selectedConversation) return;
    if (this.callWindow && !this.callWindow.closed) {
      this.callWindow.focus();
      return;
    }
    const conv = this.selectedConversation;
    this.isVideoCall = isVideo;
    this.isCallActive = true;
    this.isCallInitiator = true;
    this.callStartTime = new Date();

    const scriptUrl = encodeURIComponent(this.env.getEnv('jitsiScriptUrl'));
    const jitsiUrl = `jitsi/jitsi.html?scriptUrl=${scriptUrl}&toolbar=1&t=${Date.now()}`;
    const w = 900;
    const h = 650;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    this.callWindow = window.open(
      jitsiUrl,
      `jitsi_call_${conv.id}`,
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no`
    );

    this.setupCallMessageListener(`chat_${conv.id}`);
    this.signalR.joinCall(conv.id);
    this.callWindowPollInterval = setInterval(() => {
      if (this.callWindow?.closed) this.onCallWindowClosed();
    }, 1000);

    // Notify all other participants
    const others = conv.participants?.filter(p => p.userName !== this.currentUser) || [];
    for (const other of others) {
      this.signalR.sendCallSignal(other.userName, 'IncomingCall', {
        conversationId: conv.id,
        roomName: `chat_${conv.id}`,
        callerUserName: this.currentUser,
        callerFullName: this.currentFullName,
        isVideo,
      });
    }
  }

  endCall() {
    // Cancel ringing for anyone not yet answered
    if (this.selectedConversation) {
      const others = this.selectedConversation.participants?.filter(p => p.userName !== this.currentUser) || [];
      for (const other of others) {
        this.signalR.sendCallSignal(other.userName, 'CallCancelled', { conversationId: this.selectedConversation.id });
      }
    }
    if (this.callWindow && !this.callWindow.closed) {
      this.callWindow.postMessage({ type: 'HANG_UP' }, '*');
      // Close after short delay so Jitsi can clean up
      setTimeout(() => {
        if (this.callWindow && !this.callWindow.closed) this.callWindow.close();
      }, 300);
    }
    // Cleanup + LeaveCall (which notifies active participants and returns isLast)
    this.onCallWindowClosed();
  }

  private handleCallSignal(signalType: string, payload: any) {
    switch (signalType) {
      case 'IncomingCall':
        if (this.isCallActive) {
          this.callStateService.rejectBusy(payload as IncomingCallPayload);
        }
        break;
      case 'CallCancelled':
        break;
      case 'CallAccepted':
        break;
      case 'CallRejected':
        if (this.isCallActive) {
          this.nzMessage.warning('Cuộc gọi bị từ chối');
          this.endCall();
        }
        break;
      case 'CallLeft':
        // Other party left → auto-close our popup without triggering another LeaveCall loop
        if (this.isCallActive) {
          this.forceCloseCall();
        }
        break;
    }
  }

  /** Called when the user accepted a call from the global incoming-call overlay. */
  private openJitsiForAcceptedCall(call: IncomingCallPayload) {
    this.callStateService.clearAcceptedCall();

    // If conversation not yet loaded, store and retry after load
    const conv = this.conversations.find(c => c.id === call.conversationId);
    if (!conv) {
      this.pendingAcceptedCall = call;
      return;
    }

    if (!this.selectedConversation || this.selectedConversation.id !== call.conversationId) {
      this.selectConversation(conv);
    }

    this.isVideoCall = call.isVideo;
    this.isCallActive = true;
    this.isCallInitiator = false;
    this.callStartTime = new Date();

    const scriptUrl = encodeURIComponent(this.env.getEnv('jitsiScriptUrl'));
    const jitsiUrl = `jitsi/jitsi.html?scriptUrl=${scriptUrl}&toolbar=1&t=${Date.now()}`;
    const w = 900;
    const h = 650;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    this.callWindow = window.open(
      jitsiUrl,
      `jitsi_call_${call.conversationId}`,
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no`
    );
    this.setupCallMessageListener(call.roomName);
    this.signalR.joinCall(call.conversationId);
    this.callWindowPollInterval = setInterval(() => {
      if (this.callWindow?.closed) this.onCallWindowClosed();
    }, 1000);
  }

  /** Called when popup closes (user closed or endCall triggered it). Handles LeaveCall + message save. */
  private onCallWindowClosed() {
    if (!this.isCallActive) return; // guard against double invocation
    const durationSeconds = this.callStartTime
      ? Math.floor((Date.now() - this.callStartTime.getTime()) / 1000)
      : 0;
    const wasInitiator = this.isCallInitiator;
    const isGroup = this.selectedConversation?.isGroup || false;
    const convId = this.selectedConversation?.id;
    this.cleanupCall();

    if (!convId) return;
    this.signalR.leaveCall(convId).then(isLast => {
      // 1-1: only initiator saves; group: last person to leave saves
      const shouldSave = isGroup ? isLast : wasInitiator;
      if (shouldSave && this.selectedConversation) {
        this.sendCallEndMessage(durationSeconds);
      }
    });
  }

  /** Force-close call when the other party left, without invoking LeaveCall (hub already handles it). */
  private forceCloseCall() {
    if (!this.isCallActive) return;
    clearInterval(this.callWindowPollInterval);
    this.callWindowPollInterval = null;
    if (this.callMessageListener) {
      window.removeEventListener('message', this.callMessageListener);
      this.callMessageListener = undefined;
    }
    const win = this.callWindow;
    this.callWindow = null;
    this.callStartTime = null;
    this.isCallActive = false;
    this.isCallInitiator = false;
    if (win && !win.closed) win.close();
  }

  private cleanupCall() {
    clearInterval(this.callWindowPollInterval);
    this.callWindowPollInterval = null;
    if (this.callMessageListener) {
      window.removeEventListener('message', this.callMessageListener);
      this.callMessageListener = undefined;
    }
    this.callWindow = null;
    this.callStartTime = null;
    this.isCallActive = false;
    this.isCallInitiator = false;
  }

  private setupCallMessageListener(roomName?: string) {
    if (this.callMessageListener) {
      window.removeEventListener('message', this.callMessageListener);
    }
    const resolvedRoomName = roomName ?? (this.selectedConversation ? `chat_${this.selectedConversation.id}` : null);
    this.callMessageListener = (event: MessageEvent) => {
      const { type } = event.data;
      switch (type) {
        case 'JITSI_SCRIPT_LOADED':
          if (resolvedRoomName) {
            const config = {
              domain: this.env.getEnv('jitsiServerUrl').replace('https://', ''),
              roomName: resolvedRoomName,
              displayName: this.currentFullName || this.currentUser,
              email: '',
            };
            setTimeout(() => {
              this.callWindow?.postMessage({ type: 'INIT_JITSI', data: config, serverCallback: '' }, '*');
            }, 200);
          }
          break;
      }
    };
    window.addEventListener('message', this.callMessageListener);
  }

  private formatCallDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} giây`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h} giờ ${rm} phút` : `${h} giờ`;
  }

  private sendCallEndMessage(durationSeconds: number) {
    if (!this.selectedConversation) return;
    const dto = new SendMessageDto();
    dto.conversationId = this.selectedConversation.id;
    dto.messageType = this.isVideoCall ? 'VideoCall' : 'Call';
    dto.content = durationSeconds > 0
      ? this.formatCallDuration(durationSeconds)
      : 'Cuộc gọi đã kết thúc';
    this.chatService.sendMessage(dto).pipe(takeUntil(this.destroy$)).subscribe();
  }

  selectExternalPlatform(platform: any) {
    this.selectedConversation = null;
    this.selectedExternalPlatform = platform;
    this.externalPlatformUrl = this.sanitizer.bypassSecurityTrustResourceUrl(platform.url);

    // Kích thước tối ưu cho các bản Chat Web
    const width = 1200;
    const height = 800;

    // Tính toán vị trí giữa màn hình
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popupOptions = `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no`;

    // Mở cửa sổ mới. Trình duyệt sẽ tự dùng lại Session cũ nếu có.
    const newWindow = window.open(platform.url, platform.name, popupOptions);

    if (newWindow) {
      newWindow.focus();
    } else {
      this.nzMessage.warning('Vui lòng cho phép trình duyệt mở popup để sử dụng tính năng này.');
    }
  }

  ngOnDestroy(): void {
    this.forceCloseCall();
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
