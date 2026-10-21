import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EnvironmentService } from '../../../../core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { FileService } from '../../../../shared/services';
import { LocalStorageUtils } from '../../../../shared/utils';
import {
  buildOnlyOfficeDocumentUrl,
  OnlyOfficeFileScope,
} from '../../../../shared/utils/onlyoffice-helper';
import {
  fileNameHasExtension,
  FilePreviewMode,
  resolveFilePreviewMode,
} from '../../../../shared/utils/file-preview.util';

@Component({
  selector: 'app-dc-file-preview',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-file-preview.html',
  styleUrls: ['./dc-file-preview.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcFilePreview {
  @Input() fileId: string | null = null;
  @Input() fileName = '';
  @Input() onlyOfficeScope: OnlyOfficeFileScope = 'File';

  viewMode: FilePreviewMode | 'loading' = 'loading';
  iframeUrl: SafeResourceUrl | null = null;
  mediaUrl: SafeUrl | null = null;
  onlyOfficeTabId = '';

  constructor(
    private env: EnvironmentService,
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileId'] || changes['fileName']) {
      this.loadPreview();
    }
  }

  reload(): void {
    this.loadPreview();
  }

  downloadFile(): void {
    if (this.fileId) this.fileService.download(this.fileId);
  }

  private loadPreview(): void {
    this.resetState();
    if (!this.fileId) return;

    const name = (this.fileName || '').trim();
    if (!fileNameHasExtension(name)) {
      this.viewMode = 'loading';
      this.cdr.markForCheck();
      this.fileService.getById(this.fileId).subscribe({
        next: (res: any) => {
          const f = res?.data ?? res;
          const resolved = f?.fileName ?? f?.FileName ?? name;
          this.openPreview(resolved || name);
        },
        error: () => this.openPreview(name),
      });
      return;
    }

    this.openPreview(name);
  }

  private openPreview(fileName: string): void {
    const mode = resolveFilePreviewMode(fileName);
    if (mode === 'unsupported') {
      this.viewMode = 'unsupported';
      this.cdr.markForCheck();
      return;
    }

    this.viewMode = 'loading';
    this.cdr.markForCheck();

    switch (mode) {
      case 'pdf':
        this.openPdfPreview();
        break;
      case 'onlyoffice':
        this.openOnlyOfficePreview(fileName);
        break;
      case 'image':
      case 'video':
        this.openMediaPreview(mode);
        break;
    }
  }

  private openPdfPreview(): void {
    const apiUrl = `${this.env.getEnv('baseUrl')}/File/View/${this.fileId}`;
    this.viewMode = 'pdf';
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `pdfjs/viewer.html?file=${encodeURIComponent(apiUrl)}`,
    );
    this.cdr.markForCheck();
  }

  private openOnlyOfficePreview(fileName: string): void {
    const scope = this.onlyOfficeScope;
    const viewerPage =
      scope === 'File'
        ? 'only-office/only-office-viewer.html'
        : 'only-office/only-office-viewer-explorer.html';

    this.onlyOfficeTabId = '_' + Math.random().toString(36).substring(2, 11);
    this.fileService.requestOnlyOfficeTicket(this.fileId!, scope).subscribe({
      next: (ticket) => {
        if (!ticket) {
          this.message.error('Không thể mở file');
          this.viewMode = 'unsupported';
          this.cdr.markForCheck();
          return;
        }
        this.viewMode = 'onlyoffice';
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `${viewerPage}?id=${this.onlyOfficeTabId}&t=${Date.now()}`,
        );
        this.cdr.markForCheck();
        const message = this.buildOnlyOfficeMessage(ticket, fileName, scope);
        setTimeout(() => this.observeIframeAndPostMessage(this.onlyOfficeTabId, message), 100);
      },
      error: () => {
        this.message.error('Không thể mở file');
        this.viewMode = 'unsupported';
        this.cdr.markForCheck();
      },
    });
  }

  private buildOnlyOfficeMessage(
    ticket: string,
    fileName: string,
    scope: typeof this.onlyOfficeScope,
  ): Record<string, unknown> {
    const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};
    return {
      file: { id: this.fileId, fileName, name: fileName },
      mode: 'view',
      idTab: this.onlyOfficeTabId,
      account: accountInfo,
      environment: this.env.getEnv('baseUrl'),
      onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
      documentUrl: buildOnlyOfficeDocumentUrl(this.env, this.fileId!, ticket, scope),
    };
  }

  private observeIframeAndPostMessage(idTab: string, message: Record<string, unknown>): void {
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
      const el = document.getElementById(idTab) as HTMLIFrameElement;
      if (el) {
        postIt(el);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private openMediaPreview(mode: 'image' | 'video'): void {
    this.fileService.requestDownloadTicket(this.fileId!).subscribe({
      next: (res) => {
        const ticket = res?.ticket;
        if (!ticket) {
          this.message.error('Không thể mở file');
          this.viewMode = 'unsupported';
          this.cdr.markForCheck();
          return;
        }
        const base = this.env.getEnv('baseUrl');
        const url =
          mode === 'video'
            ? `${base}/File/StreamVideo/${this.fileId}?dl=${encodeURIComponent(ticket)}&t=${Date.now()}`
            : this.fileService.getDownloadUrl(this.fileId!, ticket) + `&t=${Date.now()}`;
        this.viewMode = mode;
        this.mediaUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Không thể mở file');
        this.viewMode = 'unsupported';
        this.cdr.markForCheck();
      },
    });
  }

  private resetState(): void {
    this.viewMode = 'loading';
    this.iframeUrl = null;
    this.mediaUrl = null;
    this.onlyOfficeTabId = '';
  }
}
