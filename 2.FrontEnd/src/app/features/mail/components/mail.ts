import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Subject, takeUntil, of, debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { GlobalService } from '../../../core';
import {
  Mail,
  MailAccountDto,
  MailAttachmentDto,
  MailComposeAttachmentDto,
  MailComposeDto,
  MailFolderDto,
  MailLabelItem,
  MailMessageDto,
  PagedResponse
} from '../models/mail.models';
import { MailService } from '../services/mail.service';
import { MailAccountService } from '../services/mail-account.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router } from '@angular/router';
import { SanitizeHtmlPipe } from '../../../core/pipes/sanitize-html.pipe';
import { sanitizeHtml } from '../../../core/security/html-sanitize';

@Component({
  selector: 'app-mail',
  imports: [SharedModules, SanitizeHtmlPipe],
  templateUrl: './mail.html',
  styleUrl: './mail.scss',
})
export class MailComponent implements OnInit, OnDestroy {
  @ViewChild('composeBodyElem') composeBodyElem!: ElementRef<HTMLElement>;
  private destroy$ = new Subject<void>();
  suggestedContacts: string[] = [];
  isSearchingContacts = false;
  private searchTimeout: any;

  filter: MailMessageDto =
    {
      currentPage: 1,
      pageSize: 20,
      isPaging: true
    };

  totalMails: number = 0;
  isLoadingMore: boolean = false;
  hasMoreData: boolean = true;

  selectedMail: Mail | null = null;
  isComposing: boolean = false;
  searchKeyword: string = '';
  isSyncing: boolean = false;


  // Folders động từ API (tree structure)
  dynamicFolders: MailFolderDto[] = [];
  activeFolderId: string = '';

  labels: MailLabelItem[] = [];
  mails: Mail[] = [];

  // Tài khoản đã liên kết
  linkedAccounts: MailAccountDto[] = [];
  isConnectingGmail: boolean = false;
  isConnectingMicrosoft: boolean = false;
  isConnectingZoho: boolean = false;

  // Provider đang chọn (Gmail | Microsoft | Zoho)
  selectedMailType: string = '';
  private routeMailType: string = '';
  private routeFolderId: string = '';
  private routeMailId: string = '';

  // Các loại mail (không có Internal)
  readonly mailTypeOptions = [
    { value: 'Gmail', label: 'Gmail', icon: 'gmail' },
    { value: 'Microsoft', label: 'Microsoft', icon: 'microsoft' },
    { value: 'Zoho', label: 'Zoho Mail', icon: 'zoho' },
  ];

  composeTo: string[] = [];
  composeSubject: string = '';
  composeBody: string = '';
  composeCc: string[] = [];
  composeBcc: string[] = [];
  showCcBcc: boolean = false;
  isComposeExpanded: boolean = false;
  composeAttachments: File[] = [];
  isSendingMail: boolean = false;
  showSendAccountPopup: boolean = false;
  selectedSenderAccountId: string = '';
  pendingMailPayload: MailComposeDto | null = null;

  constructor(
    private global: GlobalService,
    private mailService: MailService,
    private mailAccountService: MailAccountService,
    private message: NzMessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.global.setBreadcrumb([{ name: 'Thư điện tử', path: 'mail' }]);
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.routeMailType = params['mailType'] || '';
        this.routeFolderId = params['folderId'] || '';
        this.routeMailId = params['mailId'] || '';
      });

    this.loadLinkedAccounts();
  }

  onContactSearch(keyword: string): void {
    if (!keyword || keyword.trim() === '') {
      this.suggestedContacts = [];
      return;
    }

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.isSearchingContacts = true;
      this.mailService.suggestContacts(keyword).subscribe({
        next: (res: any) => {
          this.suggestedContacts = res?.data ?? res ?? [];
          this.isSearchingContacts = false;
        },
        error: () => {
          this.suggestedContacts = [];
          this.isSearchingContacts = false;
        }
      });
    }, 500);
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  get isGmailLinked(): boolean {
    return this.linkedAccounts.some(a => a.provider === 'Gmail');
  }

  get isMicrosoftLinked(): boolean {
    return this.linkedAccounts.some(a => a.provider === 'Microsoft');
  }

  get isZohoLinked(): boolean {
    return this.linkedAccounts.some(a => a.provider === 'Zoho');
  }

  get hasAnyLinked(): boolean {
    return this.linkedAccounts.length > 0;
  }

  get filteredMails(): Mail[] {
    let result = [...this.mails];

    if (this.searchKeyword?.trim()) {
      const kw = this.searchKeyword.toLowerCase();
      result = result.filter(
        m =>
          m.subject.toLowerCase().includes(kw) ||
          m.from.toLowerCase().includes(kw) ||
          m.preview.toLowerCase().includes(kw)
      );
    }

    return result;
  }

  // ─── Mail Type & Folder ───────────────────────────────────────────────────────

  onMailTypeChange(type: string): void {
    this.selectedMailType = type;
    this.filter.mailType = type;
    this.filter.folder = undefined;
    this.activeFolderId = '';
    this.selectedMail = null;
    this.mails = [];
    this.updateMailQueryParams({ mailType: type || null, folderId: null, mailId: null });
    this.loadFolders();
  }

  loadFolders(): void {
    if (!this.selectedMailType) return;

    this.mailService.getFolders(this.selectedMailType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // API trả về { status, data } - lấy data
          const rawFolders = res?.data ?? res ?? [];
          this.dynamicFolders = rawFolders;

          const preferredFolder = this.routeFolderId
            ? this.findFolderById(this.dynamicFolders, this.routeFolderId)
            : null;

          // Mặc định chọn folder Hộp thư đến
          const inboxFolder = this.findInboxFolder(this.dynamicFolders);
          const defaultFolder = preferredFolder || inboxFolder || this.getFirstLeafFolder(this.dynamicFolders);
          if (defaultFolder?.id) {
            const shouldRestoreMail = preferredFolder?.id === defaultFolder.id && !!this.routeMailId;
            this.selectFolder(defaultFolder, false, shouldRestoreMail ? this.routeMailId : undefined);
            if (!preferredFolder?.id) {
              this.updateMailQueryParams({ folderId: defaultFolder.id, mailId: null });
            }
          }
        },
        error: () => {
          this.dynamicFolders = [];
        }
      });
  }

  selectFolder(folder: MailFolderDto, updateQuery: boolean = true, preferredMailId?: string): void {
    if (!folder.id) return;
    this.activeFolderId = folder.id;
    this.filter.folder = folder.id;
    this.selectedMail = null;
    if (updateQuery) {
      this.updateMailQueryParams({ folderId: folder.id, mailId: null });
    }
    this.loadMailbox(preferredMailId);
  }

  private findInboxFolder(folders: MailFolderDto[]): MailFolderDto | null {
    for (const f of folders) {
      if (
        (f.displayName || '').toLowerCase().includes('hộp thư đến') ||
        (f.displayName || '').toLowerCase().includes('inbox') ||
        f.providerId === 'INBOX'
      ) {
        return f;
      }
      if (f.children?.length) {
        const found = this.findInboxFolder(f.children);
        if (found) return found;
      }
    }
    return null;
  }

  private getFirstLeafFolder(folders: MailFolderDto[]): MailFolderDto | null {
    if (!folders?.length) return null;
    const first = folders[0];
    if (first.children?.length) return this.getFirstLeafFolder(first.children);
    return first;
  }

  // ─── Mail List & Detail ───────────────────────────────────────────────────────

  selectMail(mail: Mail): void {
    this.selectedMail = mail;
    this.updateMailQueryParams({ mailId: mail.id });
    if (!mail.isRead) {
      this.updateReadState(mail, true);
    }
  }

  closeMail(): void {
    this.selectedMail = null;
    this.updateMailQueryParams({ mailId: null });
  }

  getFolderUnreadCount(folder: MailFolderDto): number {
    return folder.unreadCount || 0;
  }

  toggleStar(mail: Mail, event: MouseEvent): void {
    event.stopPropagation();
    const nextValue = !mail.isStarred;
    mail.isStarred = nextValue;
    if (this.selectedMail?.id === mail.id) {
      this.selectedMail.isStarred = nextValue;
    }

    this.mailService.updateStarState(mail.id, nextValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res?.status) {
            mail.isStarred = !nextValue;
            if (this.selectedMail?.id === mail.id) this.selectedMail.isStarred = !nextValue;
          }
        },
        error: () => {
          mail.isStarred = !nextValue;
          if (this.selectedMail?.id === mail.id) this.selectedMail.isStarred = !nextValue;
        }
      });
  }

  get selectedMails(): Mail[] {
    return this.filteredMails.filter(m => m.isSelected);
  }

  get allSelected(): boolean {
    const mails = this.filteredMails;
    return mails.length > 0 && mails.every(m => m.isSelected);
  }

  get someSelected(): boolean {
    return this.selectedMails.length > 0 && !this.allSelected;
  }

  toggleSelectAll(): void {
    const allSelected = this.allSelected;
    this.filteredMails.forEach(m => (m.isSelected = !allSelected));
  }

  deleteMail(mail: Mail, event?: MouseEvent): void {
    event?.stopPropagation();
    const permanent = this.isTrashFolder();
    this.mailService.delete(mail.id, permanent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status === false) return;
          this.mails = this.mails.filter(m => m.id !== mail.id);
          if (this.selectedMail?.id === mail.id) {
            this.selectedMail = null;
            this.updateMailQueryParams({ mailId: null });
          }
        },
        error: () => this.loadMailbox()
      });
  }

  deleteSelectedMails(): void {
    const mails = [...this.selectedMails];
    if (!mails.length) return;
    const permanent = this.isTrashFolder();
    forkJoin(mails.map(mail => this.mailService.delete(mail.id, permanent)))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadMailbox(),
        error: () => this.loadMailbox()
      });
  }

  markSelectedAsRead(): void { this.updateSelectedReadState(true); }
  markSelectedAsUnread(): void { this.updateSelectedReadState(false); }

  private updateSelectedReadState(isRead: boolean): void {
    const mailsToUpdate = this.selectedMails.filter(m => m.isRead !== isRead);
    if (!mailsToUpdate.length) return;

    mailsToUpdate.forEach(mail => {
      mail.isRead = isRead;
      this.updateSidebarUnreadCount(mail.folder || this.activeFolderId, !isRead);
    });

    forkJoin(mailsToUpdate.map(mail => this.mailService.updateReadState(mail.id, isRead)))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadFolders(),
        error: () => this.loadFolders()
      });
  }

  // ─── Compose ──────────────────────────────────────────────────────────────────

  openCompose(): void {
    this.isComposing = true;
    this.composeTo = [];
    this.composeSubject = '';
    this.composeBody = '';
    this.composeCc = [];
    this.composeBcc = [];
    this.showCcBcc = false;
    this.isComposeExpanded = false;
    this.composeAttachments = [];
    this.selectedSenderAccountId = '';
    this.pendingMailPayload = null;
    this.showSendAccountPopup = false;
    setTimeout(() => {
      if (this.composeBodyElem) {
        // replaceChildren() with no args clears all children without innerHTML.
        this.composeBodyElem.nativeElement.replaceChildren();
      }
    });
  }

  closeCompose(): void {
    this.isComposing = false;
    this.isComposeExpanded = false;
    this.showSendAccountPopup = false;
    this.pendingMailPayload = null;
    this.selectedSenderAccountId = '';
    this.isSendingMail = false;
  }

  async sendMail(): Promise<void> {
    if (!this.composeTo?.length || !this.composeSubject?.trim()) return;

    const payload = await this.buildComposePayload();
    if (!payload) {
      if (this.composeAttachments.length > 0) {
        this.message.error('Không thể đọc hoặc xử lý tệp đính kèm. Vui lòng thử lại.');
      }
      this.isSendingMail = false;
      return;
    }

    if (this.linkedAccounts.length === 0) {
      this.message.warning('Vui lòng liên kết mail trước khi gửi.');
      return;
    }

    if (this.linkedAccounts.length === 1) {
      const account = this.linkedAccounts[0];
      payload.mailAccountId = account.id;
      await this.submitCompose(payload);
      return;
    }

    this.pendingMailPayload = payload;
    this.selectedSenderAccountId = this.linkedAccounts[0]?.id || '';
    this.showSendAccountPopup = true;
  }

  toggleComposeExpand(): void {
    this.isComposeExpanded = !this.isComposeExpanded;
  }

  onComposeBodyInput(event: Event): void {
    const target = event.target as HTMLElement;
    this.composeBody = target?.innerHTML ?? '';
  }

  formatCompose(command: string): void {
    document.execCommand(command, false);
  }

  insertLink(): void {
    const url = prompt('Nhập liên kết');
    if (!url?.trim()) return;
    document.execCommand('createLink', false, url.trim());
  }

  triggerAttachmentPicker(input: HTMLInputElement): void {
    input.click();
  }

  onComposeAttachmentsSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (!files.length) return;

    const existingKeys = new Set(this.composeAttachments.map(f => `${f.name}|${f.size}|${(f as any).lastModified || 0}`));
    const newFiles: File[] = [];

    for (const file of files) {
      const key = `${file.name}|${file.size}|${(file as any).lastModified || 0}`;
      if (!existingKeys.has(key)) {
        newFiles.push(file);
        existingKeys.add(key);
      }
    }

    if (newFiles.length > 0) {
      this.composeAttachments = [...this.composeAttachments, ...newFiles];
    }

    target.value = '';
  }

  removeComposeAttachment(index: number): void {
    if (index < 0 || index >= this.composeAttachments.length) return;
    this.composeAttachments.splice(index, 1);
  }

  closeSendAccountPopup(): void {
    this.showSendAccountPopup = false;
    this.pendingMailPayload = null;
    this.selectedSenderAccountId = '';
  }

  confirmSendAccountAndSend(): void {
    if (!this.pendingMailPayload || !this.selectedSenderAccountId) {
      this.message.warning('Vui lòng chọn tài khoản gửi.');
      return;
    }

    const payload: MailComposeDto = {
      ...this.pendingMailPayload,
      mailAccountId: this.selectedSenderAccountId
    };

    this.showSendAccountPopup = false;
    this.pendingMailPayload = null;
    this.selectedSenderAccountId = '';
    this.submitCompose(payload);
  }

  getProviderLabel(provider?: string): string {
    switch ((provider || '').toLowerCase()) {
      case 'gmail':
        return 'Gmail';
      case 'microsoft':
        return 'Microsoft';
      case 'zoho':
        return 'Zoho Mail';
      default:
        return provider || 'Mail';
    }
  }

  getComposeBodyPlainTextLength(): number {
    return this.stripHtml(this.composeBody).length;
  }

  private async buildComposePayload(): Promise<MailComposeDto | null> {
    const attachments = await this.buildComposeAttachments();
    if (attachments === null) return null;

    const payload: MailComposeDto = {
      to: this.parseEmails(this.composeTo),
      cc: this.parseEmails(this.composeCc),
      bcc: this.parseEmails(this.composeBcc),
      subject: this.composeSubject.trim(),
      body: sanitizeHtml(this.composeBody, 'email'),
      labelIds: [],
      attachments
    };

    return payload;
  }

  private async buildComposeAttachments(): Promise<MailComposeAttachmentDto[] | null> {
    if (!this.composeAttachments.length) return [];

    try {
      const results = await Promise.all(this.composeAttachments.map(file => this.convertFileToPayload(file)));
      return results;
    } catch {
      return null;
    }
  }

  private convertFileToPayload(file: File): Promise<MailComposeAttachmentDto> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Invalid file payload'));
          return;
        }

        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          contentBase64: base64,
          fileSize: file.size
        });
      };
      reader.onerror = () => reject(reader.error || new Error('Cannot read file'));
      reader.readAsDataURL(file);
    });
  }

  private async submitCompose(payload: MailComposeDto): Promise<void> {
    if (this.isSendingMail) return;
    this.isSendingMail = true;

    this.mailService.compose(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status) {
            this.message.success('Gửi thư thành công!');
            this.closeCompose();
            this.loadMailbox();
          } else {
            this.message.error(res?.messageObject?.message || 'Gửi thư thất bại.');
          }
          this.isSendingMail = false;
        },
        error: () => {
          this.isSendingMail = false;
          this.message.error('Gửi thư thất bại.');
        }
      });
  }

  replyMail(mail: Mail): void {
    this.isComposing = true;
    this.composeTo = mail.fromEmail ? [mail.fromEmail] : [];
    this.composeSubject = mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`;
    this.composeBody = `<br><br><hr><p><strong>Phản hồi thư trước</strong></p><p>Từ: ${mail.from} &lt;${mail.fromEmail}&gt;<br>Đến: ${mail.to}<br>Chủ đề: ${mail.subject}</p><p>${this.stripHtml(mail.body)}</p>`;
    this.composeCc = [];
    this.composeBcc = [];
    this.showCcBcc = false;
    this.isComposeExpanded = false;
    this.composeAttachments = [];

    setTimeout(() => {
      if (this.composeBodyElem) {
        // DOMParser creates an inert document — no scripts run, no Trusted Types sink triggered.
        // Nodes are imported into the live document and replace existing children safely.
        const doc = new DOMParser().parseFromString(this.composeBody, 'text/html');
        const nodes = Array.from(doc.body.childNodes).map(n => document.importNode(n, true));
        this.composeBodyElem.nativeElement.replaceChildren(...nodes);
      }
    });
  }

  forwardMail(mail: Mail): void {
    this.isComposing = true;
    this.composeTo = [];
    this.composeSubject = mail.subject.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`;
    this.composeBody = `<br><br><hr><p><strong>Thư được chuyển tiếp</strong></p><p>Từ: ${mail.from} &lt;${mail.fromEmail}&gt;<br>Đến: ${mail.to}${mail.cc ? `<br>CC: ${mail.cc}` : ''}<br>Chủ đề: ${mail.subject}</p><p>${this.stripHtml(mail.body)}</p>`;
    this.composeCc = [];
    this.composeBcc = [];
    this.showCcBcc = false;
    this.isComposeExpanded = false;
    this.composeAttachments = [];

    setTimeout(() => {
      if (this.composeBodyElem) {
        const doc = new DOMParser().parseFromString(this.composeBody, 'text/html');
        const nodes = Array.from(doc.body.childNodes).map(n => document.importNode(n, true));
        this.composeBodyElem.nativeElement.replaceChildren(...nodes);
      }
    });
  }

  // ─── Attachment Download ──────────────────────────────────────────────────────

  downloadAttachment(attachment: MailAttachmentDto, event: MouseEvent): void {
    event.stopPropagation();
    if (!attachment.id || !attachment.fileName) return;
    this.mailService.downloadAttachment(attachment.id, attachment.fileName);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // ─── Linked Accounts & OAuth ─────────────────────────────────────────────────

  loadLinkedAccounts(): void {
    this.mailAccountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // CommonService wraps response in { status, data }
          const accounts = res?.data ?? res ?? [];
          this.linkedAccounts = accounts;

          // Mặc định chọn loại mail đầu tiên đã liên kết
          if (this.linkedAccounts.length > 0 && !this.selectedMailType) {
            const preferredProvider = this.routeMailType && this.linkedAccounts.some(a => a.provider === this.routeMailType)
              ? this.routeMailType
              : '';
            const firstProvider = preferredProvider || this.linkedAccounts[0].provider || 'Gmail';
            this.selectedMailType = firstProvider;
            this.filter.mailType = firstProvider;
            this.updateMailQueryParams({
              mailType: firstProvider || null,
              folderId: this.routeFolderId || null,
              mailId: this.routeMailId || null
            });
            this.loadFolders();
          }
        },
        error: () => {
          this.linkedAccounts = [];
        }
      });
  }

  loginWithGmail(): void {
    if (this.isConnectingGmail || this.isGmailLinked) return;
    this.isConnectingGmail = true;

    this.mailAccountService.getGmailAuthUrl()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const url = res?.data ?? res;
          this.mailAccountService.connectAccount(url)
            .then((success) => {
              if (success) {
                this.message.success('Kết nối Gmail thành công!');
                this.linkedAccounts = [];
                this.selectedMailType = '';
                this.loadLinkedAccounts();
              }
            })
            .finally(() => { this.isConnectingGmail = false; });
        },
        error: () => {
          this.isConnectingGmail = false;
          this.message.error('Không thể lấy đường dẫn đăng nhập Gmail!');
        }
      });
  }

  loginWithMicrosoft(): void {
    if (this.isConnectingMicrosoft || this.isMicrosoftLinked) return;
    this.isConnectingMicrosoft = true;

    this.mailAccountService.getMicrosoftAuthUrl()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const url = res?.data ?? res;
          this.mailAccountService.connectAccount(url)
            .then((success) => {
              if (success) {
                this.message.success('Kết nối Microsoft thành công!');
                this.linkedAccounts = [];
                this.selectedMailType = '';
                this.loadLinkedAccounts();
              }
            })
            .finally(() => { this.isConnectingMicrosoft = false; });
        },
        error: () => {
          this.isConnectingMicrosoft = false;
          this.message.error('Không thể lấy đường dẫn đăng nhập Microsoft!');
        }
      });
  }

  loginWithZoho(): void {
    if (this.isConnectingZoho || this.isZohoLinked) return;
    this.isConnectingZoho = true;

    this.mailAccountService.getZohoAuthUrl()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const url = res?.data ?? res;
          this.mailAccountService.connectAccount(url)
            .then((success) => {
              if (success) {
                this.message.success('Kết nối Zoho Mail thành công!');
                this.linkedAccounts = [];
                this.selectedMailType = '';
                this.loadLinkedAccounts();
              }
            })
            .finally(() => { this.isConnectingZoho = false; });
        },
        error: () => {
          this.isConnectingZoho = false;
          this.message.error('Không thể lấy đường dẫn đăng nhập Zoho Mail!');
        }
      });
  }

  disconnectAccount(acc: MailAccountDto): void {
    if (!acc.id) return;
    this.mailAccountService.deleteAccount(acc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status !== false) {
            this.message.success(`Đã ngắt kết nối ${this.getProviderLabel(acc.provider)}`);
            window.location.reload();
          } else {
            this.message.error(`Không thể ngắt kết nối ${this.getProviderLabel(acc.provider)}`);
          }
        },
        error: () => {
          this.message.error(`Lỗi khi ngắt kết nối ${this.getProviderLabel(acc.provider)}`);
        }
      });
  }

  // ─── Manual Sync ─────────────────────────────────────────────────────────────

  syncNow(): void {
    if (!this.selectedMailType || this.isSyncing) return;
    this.isSyncing = true;

    this.mailAccountService.syncNow(this.selectedMailType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isSyncing = false;
          if (res?.status !== false) {
            this.loadFolders();
          } else {
          }
        },
        error: () => {
          this.isSyncing = false;
        }
      });
  }

  syncAccount(acc: MailAccountDto): void {
    if (this.isSyncing || !acc.provider) return;
    this.isSyncing = true;

    this.mailAccountService.syncNow(acc.provider)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isSyncing = false;
          if (res?.status !== false) {
            if (this.selectedMailType === acc.provider) {
              this.loadFolders();
            }
          } else {
          }
        },
        error: () => {
          this.isSyncing = false;
        }
      });
  }

  // ─── Read State ───────────────────────────────────────────────────────────────

  updateReadState(mail: Mail, isRead: boolean): void {
    if (mail.isRead === isRead) return;
    const previousValue = mail.isRead;

    mail.isRead = isRead;
    if (this.selectedMail?.id === mail.id) this.selectedMail.isRead = isRead;

    // Optimistic Update Sidebar
    const folderToUpdate = mail.folder || this.activeFolderId;
    this.updateSidebarUnreadCount(folderToUpdate, !isRead);

    this.mailService.updateReadState(mail.id, isRead)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status === false) {
            mail.isRead = previousValue;
            if (this.selectedMail?.id === mail.id) this.selectedMail.isRead = previousValue;
            this.updateSidebarUnreadCount(folderToUpdate, !previousValue);
          }
        },
        error: () => {
          mail.isRead = previousValue;
          if (this.selectedMail?.id === mail.id) this.selectedMail.isRead = previousValue;
          this.updateSidebarUnreadCount(folderToUpdate, !previousValue);
        }
      });
  }

  private updateSidebarUnreadCount(folderId: string, increment: boolean, count: number = 1): void {
    if (!folderId) return;
    const updateRecursive = (folders: any[]): boolean => {
      for (const f of folders) {
        if (f.id === folderId || f.name === folderId || f.providerId === folderId) {
          f.unreadCount = increment ? (f.unreadCount + count) : Math.max(0, f.unreadCount - count);
          return true;
        }
        if (f.children && f.children.length) {
          if (updateRecursive(f.children)) return true;
        }
      }
      return false;
    };
    updateRecursive(this.dynamicFolders);
  }

  // ─── Load Mailbox ─────────────────────────────────────────────────────────────

  loadMailbox(preferredMailId?: string, isAppend: boolean = false): void {
    const selectedMailId = preferredMailId || this.selectedMail?.id;

    if (!isAppend) {
      this.filter.currentPage = 1;
      this.hasMoreData = true;
    }

    const labelsObs = this.labels.length > 0 ? of(this.labels) : this.mailService.getLabels();

    forkJoin({
      messages: this.mailService.search(this.filter, !isAppend),
      labels: labelsObs
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ messages, labels }: any) => {
          const page = this.extractPagedResponse<MailMessageDto>(messages) as PagedResponse<MailMessageDto>;
          const messageItems = this.extractPagedItems<MailMessageDto>(page);

          // Lấy totalRecord trực tiếp từ messages hoặc page
          const totalCount = messages?.totalRecord ?? (page as any)?.totalRecord;
          if (totalCount !== undefined) {
            this.totalMails = totalCount;
          }

          if (labels && this.labels.length === 0) {
            this.labels = ((labels?.data ?? labels) || []).map((label: any) => ({
              id: label.id || '',
              name: label.name || '',
              color: label.color || '#999999'
            }));
          }

          const newMails = messageItems.map((mail: MailMessageDto) => this.mapMail(mail));

          if (isAppend) {
            this.mails = [...this.mails, ...newMails];
          } else {
            this.mails = newMails;
          }

          if (page && page.totalPage) {
            this.hasMoreData = this.filter.currentPage! < page.totalPage;
          } else {
            this.hasMoreData = messageItems.length === this.filter.pageSize;
          }

          this.selectedMail = selectedMailId ? this.mails.find(m => m.id === selectedMailId) || null : null;
          if (selectedMailId && !this.selectedMail) {
            this.updateMailQueryParams({ mailId: null });
          }

          this.isLoadingMore = false;
        },
        error: () => {
          this.isLoadingMore = false;
        }
      });
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = 50;
    const position = target.scrollTop + target.clientHeight;
    const height = target.scrollHeight;

    if (height - position < threshold) {
      if (!this.isLoadingMore && this.hasMoreData) {
        this.isLoadingMore = true;
        this.filter.currentPage = (this.filter.currentPage || 1) + 1;
        this.loadMailbox(undefined, true);
      }
    }
  }

  isMyEmail(email: string): boolean {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return this.linkedAccounts.some(acc => (acc.email || '').toLowerCase() === lowerEmail);
  }

  isSentFolder(folderId: string): boolean {
    if (!folderId) return false;
    const folder = this.findFolderById(this.dynamicFolders, folderId);
    if (!folder) return false;
    const name = (folder.displayName || '').toLowerCase();
    const id = (folder.providerId || '').toUpperCase();
    return id === 'SENT' || name.includes('đã gửi') || name.includes('sent');
  }

  getDisplaySender(mail: Mail): string {
    if (this.isSentFolder(mail.folder)) {
      return mail.to ? `Đến: ${mail.to}` : (mail.fromEmail || 'Không xác định');
    }
    return mail.from;
  }

  private updateMailQueryParams(params: {
    mailType?: string | null;
    folderId?: string | null;
    mailId?: string | null;
  }): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (params.mailType !== undefined) this.routeMailType = params.mailType || '';
    if (params.folderId !== undefined) this.routeFolderId = params.folderId || '';
    if (params.mailId !== undefined) this.routeMailId = params.mailId || '';
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  getAvatarColor(avatar: string): string {
    const colors = ['#4285f4', '#db4437', '#f4b400', '#0f9d58', '#ab47bc', '#00acc1', '#ff7043', '#9e9d24'];
    const index = (avatar || 'A').toUpperCase().charCodeAt(0) % colors.length;
    return colors[index];
  }

  formatDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (mailDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    const diffDays = Math.floor((today.getTime() - mailDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    }

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
  }

  getLabelColor(labelKey: string): string {
    return this.labels.find(l => l.id === labelKey)?.color || '#999';
  }

  getLabelName(labelKey: string): string {
    return this.labels.find(l => l.id === labelKey)?.name || labelKey;
  }

  trackById(_index: number, item: Mail): string { return item.id; }
  trackByFolderId(_index: number, folder: MailFolderDto): string { return folder.id || ''; }

  getFolderIcon(folder: MailFolderDto): string {
    const name = (folder.displayName || folder.providerId || '').toLowerCase();
    const id = (folder.providerId || '').toUpperCase();

    if (id === 'INBOX' || name.includes('hộp thư đến') || name.includes('inbox')) return 'inbox';
    if (id === 'SENT' || name.includes('đã gửi') || name.includes('sent')) return 'send';
    if (id === 'DRAFT' || name.includes('nháp') || name.includes('draft')) return 'file-text';
    if (id === 'TRASH' || name.includes('thùng rác') || name.includes('trash')) return 'delete';
    if (id === 'SPAM' || name.includes('thư rác') || name.includes('spam')) return 'warning';
    if (id === 'STARRED' || name.includes('dấu sao') || name.includes('starred')) return 'star';
    return 'folder';
  }

  private isTrashFolder(): boolean {
    const activeFolder = this.findFolderById(this.dynamicFolders, this.activeFolderId);
    const name = (activeFolder?.displayName || '').toLowerCase();
    const id = (activeFolder?.providerId || '').toUpperCase();
    return id === 'TRASH' || name.includes('thùng rác') || name.includes('trash');
  }

  private findFolderById(folders: MailFolderDto[], id: string): MailFolderDto | null {
    for (const f of folders) {
      if (f.id === id) return f;
      if (f.children?.length) {
        const found = this.findFolderById(f.children, id);
        if (found) return found;
      }
    }
    return null;
  }



  private extractPagedResponse<T>(value: any): PagedResponse<T> | T[] | null {
    return (value?.data ?? value?.Data ?? value ?? null) as PagedResponse<T> | T[] | null;
  }

  private extractPagedItems<T>(value: PagedResponse<T> | T[] | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    const items = value?.data ?? (value as any)?.Data;
    return Array.isArray(items) ? items : [];
  }

  private mapMail(dto: MailMessageDto): Mail {
    const recipients = dto.recipients || [];
    const attachments = dto.attachments || [];

    // Gmail-like "Me" logic
    let from = dto.fromName || dto.fromEmail || 'Không xác định';
    if (this.isMyEmail(dto.fromEmail || '')) {
      from = 'Tôi';
    }

    const dateValue = dto.date || dto.sentAt;

    const mapRecipient = (r: any) => {
      const email = r.email || '';
      return this.isMyEmail(email) ? 'Tôi' : email;
    };

    return {
      id: dto.id || '',
      from,
      fromEmail: dto.fromEmail || '',
      avatar: from === 'Tôi' ? 'T' : (from.charAt(0).toUpperCase() || '?'),
      subject: dto.subject || '(Không có chủ đề)',
      preview: dto.preview || this.stripHtml(dto.body || ''),
      body: dto.body || '',
      date: dateValue ? new Date(dateValue) : new Date(),
      isRead: dto.isRead ?? false,
      isStarred: dto.isStarred ?? false,
      isSelected: false,
      hasAttachment: (dto.hasAttachment ?? false) || attachments.length > 0,
      folder: dto.folder || '',
      labels: (dto.mailLabels || []).map(l => l.mailLabelId || '').filter(l => !!l),
      to: recipients.filter(r => (r.type || '').toLowerCase() === 'to').map(mapRecipient).filter(Boolean).join(', '),
      cc: recipients.filter(r => (r.type || '').toLowerCase() === 'cc').map(mapRecipient).filter(Boolean).join(', '),
      bcc: recipients.filter(r => (r.type || '').toLowerCase() === 'bcc').map(mapRecipient).filter(Boolean).join(', '),
      attachments,
      mailType: dto.mailType || '',
      status: dto.status || '',
      isDeleted: dto.isDeleted ?? false
    };
  }

  private parseEmails(value: string | string[]): string[] {
    if (Array.isArray(value)) {
      const joined = value.filter(v => !!v).join(',');
      return joined
        .split(/[;,\n]/)
        .map(item => item.trim())
        .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index);
    }
    if (!value) return [];
    return value
      .split(/[;,\n]/)
      .map(item => item.trim())
      .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index);
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
