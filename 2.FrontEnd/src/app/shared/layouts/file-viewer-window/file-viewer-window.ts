import { Component, Inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../ng-zorro.module';
import { EnvironmentService } from '../../../core';
import { FileService } from '../../services/file.service';
import { LocalStorageUtils } from '../../utils';
import { buildOnlyOfficeDocumentUrl } from '../../utils/onlyoffice-helper';
import { FILE_VIEWER_TOKEN, FileViewerData } from '../../services/window-manager.service';

@Component({
  selector: 'app-file-viewer-window',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './file-viewer-window.html',
  styleUrl: './file-viewer-window.scss',
})
export class FileViewerWindow implements OnInit {
  viewType: 'onlyoffice' | 'image' | 'video' = 'onlyoffice';
  file: any = null;

  filePreviewUrl: SafeResourceUrl | null = null;
  mediaUrl: SafeUrl | null = null;

  idTabActive = '';

  constructor(
    @Inject(FILE_VIEWER_TOKEN) private data: FileViewerData,
    private sanitizer: DomSanitizer,
    private env: EnvironmentService,
    private fileService: FileService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.file = this.data.file;
    this.viewType = this.data.viewType;
    this.initViewer();
  }

  private initViewer(): void {
    if (!this.file) return;

    if (this.viewType === 'onlyoffice') {
      this.idTabActive = '_' + Math.random().toString(36).substring(2, 11);
      this.fileService.requestOnlyOfficeTicket(this.file.id, 'Explorer').subscribe({
        next: (ticket) => {
          if (!ticket) {
            this.message.error('Không thể mở file');
            return;
          }
          this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `only-office/only-office-viewer-explorer.html?id=${this.idTabActive}&t=${Date.now()}`
          );
          setTimeout(() => this.postOnlyOfficeMessage(ticket), 200);
        },
        error: () => this.message.error('Không thể mở file'),
      });
    } else {
      this.fileService.requestDownloadTicket(this.file.id).subscribe({
        next: (res) => {
          const ticket = res?.ticket;
          if (!ticket) return;
          const baseUrl = this.env.getEnv('baseUrl');
          const url = this.viewType === 'video'
            ? `${baseUrl}/File/StreamVideo/${this.file.id}?dl=${encodeURIComponent(ticket)}&t=${Date.now()}`
            : this.fileService.getDownloadUrl(this.file.id, ticket) + `&t=${Date.now()}`;
          this.mediaUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        },
      });
    }
  }

  private postOnlyOfficeMessage(ticket: string): void {
    const iframe = document.getElementById(this.idTabActive) as HTMLIFrameElement;
    const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};
    const message = {
      file: { ...this.file },
      mode: 'view',
      idTab: this.idTabActive,
      account: accountInfo,
      environment: this.env.getEnv('baseUrl'),
      onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
      documentUrl: buildOnlyOfficeDocumentUrl(this.env, this.file.id, ticket, 'Explorer'),
    };

    const send = (el: HTMLIFrameElement) => {
      el.contentWindow?.postMessage(message, '*');
      el.onload = () => el.contentWindow?.postMessage(message, '*');
    };

    if (iframe) {
      send(iframe);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.getElementById(this.idTabActive) as HTMLIFrameElement;
      if (el) { send(el); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
