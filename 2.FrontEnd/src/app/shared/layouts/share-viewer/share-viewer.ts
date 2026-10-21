import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ExplorerService } from '../../../features/explorer/services/explorer.service';
import { EnvironmentService } from '../../../core';
import { LocalStorageUtils } from '../../utils';
import {
  buildOnlyOfficeDocumentUrl,
  requestShareOnlyOfficeDownloadTicket,
} from '../../utils/onlyoffice-helper';

@Component({
  selector: 'app-share-viewer',
  standalone: true,
  imports: [CommonModule, NzResultModule, NzIconModule],
  templateUrl: './share-viewer.html',
  styleUrl: './share-viewer.scss',
})
export class ShareViewer implements OnInit {
  isError = false;
  errorMessage = '';

  fileItem: any = null;
  mode: any = null;
  shareInfo: any = null;

  filePreviewUrl: SafeResourceUrl | null = null;
  idTabActive = '';

  private shareCode = '';

  constructor(
    private route: ActivatedRoute,
    private explorerService: ExplorerService,
    private sanitizer: DomSanitizer,
    private env: EnvironmentService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    this.shareCode = code ?? '';
    if (!code) {
      this.isError = true;
      this.errorMessage = 'Liên kết không hợp lệ.';
      return;
    }

    this.explorerService.getItemByShareCode(code).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (!data || !data.item) {
          this.isError = true;
          this.errorMessage = 'Liên kết không tồn tại hoặc đã hết hạn.';
          return;
        }

        this.shareInfo = data;
        this.mode = data.mode;
        this.fileItem = data.item;

        if (!this.isSupportedFile(this.fileItem.name)) {
          this.isError = true;
          this.errorMessage = 'Loại tệp này không hỗ trợ xem trực tuyến.';
          return;
        }

        this.openOnlyOffice();
      },
      error: () => {
        this.isError = true;
        this.errorMessage = 'Có lỗi xảy ra. Liên kết có thể đã hết hạn hoặc không tồn tại.';
      },
    });
  }

  private isSupportedFile(name: string): boolean {
    if (!name) return false;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const supported = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
    return supported.includes(ext);
  }

  private openOnlyOffice(): void {
    this.idTabActive = '_share_' + Math.random().toString(36).substring(2, 11);

    this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `only-office/only-office-viewer-explorer.html?id=${this.idTabActive}&t=${Date.now()}`
    );

    const accountInfo = LocalStorageUtils.getItem('accountInfo') || {};

    requestShareOnlyOfficeDownloadTicket(this.http, this.env, this.shareCode).subscribe({
      next: (ticket) => {
        if (!ticket) {
          this.isError = true;
          this.errorMessage = 'Không thể mở tệp xem trước.';
          return;
        }
        const message = {
          file: { ...this.fileItem },
          mode: this.mode,
          idTab: this.idTabActive,
          account: accountInfo,
          environment: this.env.getEnv('baseUrl'),
          onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
          documentUrl: buildOnlyOfficeDocumentUrl(
            this.env,
            this.fileItem.id,
            ticket,
            'Explorer',
          ),
        };
        setTimeout(() => this.observeIframeAndPostMessage(this.idTabActive, message), 300);
      },
      error: () => {
        this.isError = true;
        this.errorMessage = 'Không thể mở tệp xem trước.';
      },
    });
  }

  private observeIframeAndPostMessage(idTab: string, message: any): void {
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
}
