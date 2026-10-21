import { Component, Input, OnInit, HostListener, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment.dev';
import { EnvironmentService, GlobalService } from '../../../../core';
import { CommonService } from '../../../../shared/services';
import { TreePlanUtil } from '../../../document-workflow/utils/tree-plan.util';
import { DocumentIncomingTranferInputModel } from '../../models/document-incoming-tranfer-input.class';
import * as GlobalConstants from '../../../../shared/constants/global.constants';
import { DocumentIncomingActivityYKienModel } from '../../models/document-incoming-activity-ykien.class';
import { VanBanDenDonViService } from '../../services/van-ban-den-don-vi.service';

import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-chi-tiet-van-ban-den',
  imports: [SharedModules],
  templateUrl: './chi-tiet-van-ban-den.component.html',
  styleUrls: ['../documents.scss'],
})
export class ChiTietVanBanDenComponent implements OnInit, OnChanges {
  @Input() documentId: string | null = '';
  @Input() type: string | null = '';
  @Input() visible: boolean = false;
  @Input() selectedIndex: number = 0;
  @Output() close = new EventEmitter<boolean>();

  info: any = localStorage.getItem('UserInfo');
  user: any = JSON.parse(this.info);

  globalConstants = GlobalConstants;
  model = new DocumentIncomingTranferInputModel();

  isFullBrowser: boolean = false;
  activeTtcTtct: boolean = true;
  activeTtcPt: boolean = false;
  activeTtcPtb: boolean = false;
  activeTtcFdk: boolean = false;
  activeTtcYkxl: boolean = false;
  activeTtcYkienPhieu: boolean = false;
  activeTtcTtgn: boolean = false;
  countPhieuTrinh: any = 0;
  countPhieuThongBao: any = 0;
  selectedIndexViewFile: any = 0;
  selectedTabIndex: number = 1;

  titleCountFile: string = '';
  idTabActive: string = '';
  fileIdPreview: string = '';

  tabsViewFile: any[] = [];
  processedYKien: any[] = [];

  constructor(
    private env : EnvironmentService,
    public globalService: GlobalService,
    private sanitizer: DomSanitizer,
    private common: CommonService,
    private notification: NzNotificationService,
    private http: HttpClient,
    private message: NzMessageService,
    public tree: TreePlanUtil,
    private cdr: ChangeDetectorRef,
    
    private _sDonVi: VanBanDenDonViService,
  ) { }

  ngOnInit(): void {
    if (this.visible && this.documentId) {
      this.openEdit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const docChanged = !!changes['documentId'] && !changes['documentId'].firstChange;
    const becameVisible = !!changes['visible'] && changes['visible'].currentValue === true;
    if ((docChanged || becameVisible) && this.documentId) {
      this.openEdit();
    }
  }

  listOfMapDataQtgn: any[] = [];
  mapOfExpandedDataQtgn: any = {};
  dataTempQtgn: any[] = [];

  openEdit(): void {
    this.fileIdPreview = '';

    this.mapOfExpandedDataQtgn = {};
    this._sDonVi.xemChiTiet(this.documentId).subscribe({
      next: (data) => {
        if (!data) {
          this.closeDrawer();
          this.message.error("Không tìm thấy Văn bản đính kèm");
          return;
        }
        this.model = data;
          this.model.danhSachPhieuYKien = data.danhSachPhieuYKien || [];
          const isPhieuYKienTab =
            this.model.danhSachPhieuYKien?.length > 0;
          this.activeTtcYkienPhieu = !!isPhieuYKienTab;

          this.getListYKienByDocId(data.document.id, data.document.donViNhanId);
          this.orgFilterYKienXuLySelected = data.document.donViNhanId;
          this.onSearchChangeYKienXuLy();
          this.model.yKien ??= new DocumentIncomingActivityYKienModel();

          this.countPhieuTrinh = data.listPhieu.filter((p: any) => p.loaiPhieuId === GlobalConstants.LOAI_PHIEU_VAN_BAN_DEN.PHIEU_TRINH).length;
          this.countPhieuThongBao = data.listPhieu.filter((p: any) => p.loaiPhieuId === GlobalConstants.LOAI_PHIEU_VAN_BAN_DEN.PHIEU_THONG_BAO).length;

          this.processedYKien = this.model.danhSachYKien.map(i => {
            const isUyQuyen = i.nguoiNhanUyQuyen && i.nguoiYKien?.userName !== i.nguoiNhanUyQuyen?.userName;
            const displayYKien = this.globalService.convertDataYKien(i.activity?.listPlans || [], i.donVi);
            const textColor = i.isYKienTuDo ? '#d46b08' : (i.nguoiNhanYKien ? '#1890ff' : (i.nguoiYKien ? 'red' : ''));

            return {
              ...i,
              isUyQuyen,
              displayYKien,
              textColor
            };
          });
          // Force render ngay trong các trường hợp mở từ overlay/drawer
          this.cdr.detectChanges();
          setTimeout(() => {
            if (this.model.listPhieu.length > 0) {
              this.onClickViewFile(this.model.listPhieu[0]?.file, 'view')
            }
            if (this.model.files.length > 0 && this.model.listPhieu.length == 0) {
              this.onClickViewFile(this.model.files[0], 'view')
            }
            this.quaTrinhGuiNhan(this.model.document.id, '', '');
          }, 500)

      },
      error: () => {
        //this.closeDrawer();
        this.message.error("Không tìm thấy Văn bản đính kèm");
      },
    });
  }

  closeTabViewFile(e: any): void {
    this.tabsViewFile.splice(e.index, 1);
    if (this.selectedIndexViewFile >= this.tabsViewFile.length) {
      this.selectedIndexViewFile = this.tabsViewFile.length - 1;
    }
  }

  onTabViewFileChange(e: any) {
    var tab = this.tabsViewFile[e];
    this.idTabActive = tab?.idTab;
  }

  downloadFile(f: any) {
    this.common.downloadFile(`File/DownloadDirect/${f.path}`).subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) return;
        const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
        const fileUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));
        const filename = this.globalService.extractFilename(res.headers.get('Content-Disposition')) || 'downloaded-file';
        const a = Object.assign(document.createElement('a'), { href: fileUrl, download: filename, style: 'display:none' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(fileUrl);
      }
    });
  }

  formatLineBreaks(text: string): string {
    return text ? text.replace(/\n/g, '<br>') : '';
  }

  generateShortId() {
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    return '_' + Array.from(array, dec => dec.toString(36)).join('');
  }

  onClickViewFile(data: any, mode: string) {
    if (!data) return;

    if (mode === 'edit') this.toggleFullBrowser(true);

    this.fileIdPreview = data.id;
    this.tabsViewFile = this.tabsViewFile.filter(x => x.path !== data.path);
    if (data.fileName?.toLowerCase().endsWith('.bm3') && mode == 'view') {
        this.decrypt(data, mode);
      return;
    }
    const phieuFiles = (this.model.listPhieu || []).map((p: any) => p.file).filter(Boolean);
    const files = this.model.files || [];
    const totalFiles = phieuFiles.length + files.length;

    const indexInPhieu = phieuFiles.findIndex((x: any) => x.id === data.id);
    const indexInFiles = files.findIndex((x: any) => x.id === data.id);

    if (indexInPhieu !== -1) {
      this.titleCountFile = `${indexInPhieu + 1}/${totalFiles}`;
    } else if (indexInFiles !== -1) {
      this.titleCountFile = `${phieuFiles.length + indexInFiles + 1}/${totalFiles}`;
    } else {
      this.titleCountFile = '-/-';
    }

    const isPdf = data.fileName?.toLowerCase().endsWith('.pdf') || data.fileType?.includes('pdf');
    const idTab = this.generateShortId();
    this.idTabActive = idTab;

    const timestamp = new Date().getTime();
    const filePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
      isPdf 
        ? `${this.env.getEnv('pdfViewerUrl')}${encodeURIComponent(this.env.getEnv('apiUrl') + '/File/PreviewFilePDF/' + data.path)}`
        : `${this.env.getEnv('onlyOfficeViewerUrl')}?t=${timestamp}`
    );

    const newTab: any = {
      ...data,
      isPdf,
      idTab,
      filePreview
    };

    this.tabsViewFile.push(newTab);
    this.selectedIndexViewFile = this.tabsViewFile.length - 1;

    if (!isPdf) {
      this.observeIframeAndPostMessage(idTab, {
        file: data,
        mode,
        type: 1,
        environment: this.env.getEnv('apiUrl'),
        onlyOfficeUrl: this.env.getEnv('onlyOfficeUrl'),
        token: this.globalService.getToken()
      });
    }
  }

  observeIframeAndPostMessage(idTab: string, message: any) {
    const iframe = document.getElementById(idTab) as HTMLIFrameElement;
    if (iframe) {
      iframe.onload = () => {
        iframe.contentWindow?.postMessage(message, window.location.origin);
      };
    }
    else {
      const observer = new MutationObserver(() => {
        const iframe = document.getElementById(idTab) as HTMLIFrameElement;
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow?.postMessage(message, window.location.origin);
          };
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  onClickNextPreview() { this.navigatePreview(1); }

  onClickPreviousPreview() { this.navigatePreview(-1); }

  private navigatePreview(direction: number) {
    const listPhieu = this.model.listPhieu || [];
    const files = this.model.files || [];

    const phieuFiles = listPhieu.map((phieu: any) => phieu.file).filter(f => f);
    const allFiles = [...phieuFiles, ...files];

    const currentIndex = allFiles.findIndex(file => file.id === this.fileIdPreview);

    if (currentIndex === -1 || allFiles.length === 0) {
      console.warn('Không tìm thấy file hiện tại hoặc danh sách file trống');
      return;
    }

    let nextIndex = currentIndex + direction;

    if (nextIndex >= allFiles.length) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = allFiles.length - 1;
    }
    const nextFile = allFiles[nextIndex];
    this.onClickViewFile(nextFile, 'view');
  }

  toggleFullBrowser(e: any) {
    this.isFullBrowser = e;
    if (e) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  @HostListener('document:mozfullscreenchange')
  @HostListener('document:MSFullscreenChange')
  onFullScreenChange() {
    this.isFullBrowser = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  closeDrawer() {
    this.visible = false;
    this.close.emit(false);
  }

  private destroy$ = new Subject<void>();

  async decrypt(file: any, mode: any) {
    const existingIndex = this.tabsViewFile.findIndex((t) => t.id === file.id);

    if (existingIndex !== -1) {
      this.selectedIndexViewFile = existingIndex;
      this.idTabActive = this.tabsViewFile[existingIndex].idTab;
      return;
    }

    this.globalService.showLoading();

    var payload = {
      filePath: file.path,
      fileName: file.fileName,
      userName: this.user.userName,
      isOpenLocal: mode !== 'view',
    }

    try {

      let res: any;
      try {
        res = await this.http.post<any>(`${this.env.getEnv('apiUrlLocal')}/DocxEncryptToPdf`, payload)
          .pipe(takeUntil(this.destroy$)).toPromise();
      }
      catch (err) {

        this.notification?.create('error', `[ERR] Lỗi kết nối QLVB Client Services `,
          `Đồng chí vui lòng kiểm tra:<br>
        - QLVB Client Services đã bật chưa? <br>
        - (URL: <a href="${this.env.getEnv('apiUrlLocal')}" target="_blank">
      ${this.env.getEnv('apiUrlLocal')}</a>)<br>
        <label>Chi tiết lỗi: </label> ${JSON.stringify(err)} <br> ${JSON.stringify(res)}`,
          { nzDuration: 20000, nzPlacement: 'topLeft' }
        );
        this.globalService.hideLoading();
        return;
      }

      if (res.status) {
        if (!res.isView) {
          const blob = this.base64ToBlob2(res.base64File, 'application/octet-stream');
          this.downloadBlob(blob, res);
        }
        else if (res.isInstallOnlyOffice) {
          const idTab = this.generateShortId();
          this.idTabActive = idTab;
          file.pathEditUrl = res.url;

          const filePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.env.getEnv('onlyOfficeViewerEncryptUrl')
          );

          const newTab: any = {
            ...file,
            isPdf: false,
            idTab,
            filePreview,
            mode: 'view',
          };

          const lastIndex = this.tabsViewFile.findIndex((t) => t.id === file.id);
          if (lastIndex !== -1) {
            this.tabsViewFile.splice(lastIndex, 1, newTab);
            this.selectedIndexViewFile = lastIndex;
          } else {
            this.tabsViewFile.push(newTab);
            this.selectedIndexViewFile = this.tabsViewFile.length - 1;
          }

          this.observeIframeAndPostMessage(idTab, {
            file,
            mode: 'view',
            type: 2,
            environment: this.env.getEnv('apiUrl'),
            onlyOfficeUrl: this.env.getEnv('onlyOfficeLocalUrl'),
            token: this.globalService.getToken(),
          });

        } else {
          const idTab = this.generateShortId();
          this.idTabActive = idTab;

          const fileUrl = res.isInstallOnlyOffice
            ? res.url
            : URL.createObjectURL(this.base64ToBlob2(res.base64File, 'application/pdf'));

          const newTab = {
            ...file,
            isPdf: true,
            idTab,
            filePreview: this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl),
            mode: 'view',
          };

          this.tabsViewFile.push(newTab);
          this.selectedIndexViewFile = this.tabsViewFile.length - 1;
        }
        this.globalService.hideLoading();

      } else {
        this.notification?.create('error', `[ERR] ${res?.messageError}`,
          res?.messageDetail,
          { nzDuration: 20000, nzPlacement: 'topLeft' }
        );
        this.globalService.hideLoading();
        return;
      }

    }
    catch (err) {

      this.globalService.hideLoading();
    }
  }
  private base64ToBlob2(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  private downloadBlob(blob: Blob, res: any) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res?.fileName;
    a.click();
    URL.revokeObjectURL(url);

    this.notification?.create(
      'error',
      `[ERR] ${res?.messageError}`,
      res?.messageDetail,
      { nzDuration: 20000, nzPlacement: 'topLeft' }
    );
  }

//  async decryptAndroid(file: any, mode: any): Promise<void> {
//     const idx = this.tabsViewFile.findIndex(t => t.id === file.id);
//     if (idx !== -1) {
//       this.selectedIndexViewFile = idx;
//       this.idTabActive = this.tabsViewFile[idx].idTab;
//       return;
//     }

//     this.globalService.showLoading();

//     this.notification.info(
//       'Đang giải mã văn bản',
//       file.fileName,
//       {
//         nzKey: 'decrypting',
//         nzDuration: 0,
//         nzPlacement: 'topLeft',
//       }
//     );

//     try {
//       const resFile = await firstValueFrom(
//         this._sBo.convertDocxToPdfMobile(file.path)
//       );
//       if (!resFile) throw new Error('Convert file failed');

//       const base64 = resFile.includes(',')
//         ? resFile.split(',')[1]
//         : resFile;

//       const res = await SignCrypt.decryptFileBase64({
//         fileBase64: base64
//       });

//       const fileName = `decrypted_${Date.now()}.pdf`;
//       const savedFile = await Filesystem.writeFile({
//         path: fileName,
//         data: res.decryptedBase64,
//         directory: Directory.Cache,
//         recursive: true
//       });

//       const { Capacitor } = await import('@capacitor/core');
//       const webPath = Capacitor.convertFileSrc(savedFile.uri);
//       const pdfUrl = `assets/pdf-viewer/viewer.html?file=${encodeURIComponent(webPath)}`;

//       const idTab = this.generateShortId();
//       this.idTabActive = idTab;

//       this.tabsViewFile.push({
//         ...file,
//         idTab,
//         isPdf: true,
//         mode: 'view',
//         fileUri: savedFile.uri,
//         filePreview: this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl)
//       });

//       this.selectedIndexViewFile = this.tabsViewFile.length - 1;

//       this.notification.remove('decrypting');

//       this.notification.success(
//         'Thành công',
//         `Văn bản ${file.fileName} được giải mã thành công!`,
//         {
//           nzDuration: 3000,
//           nzPlacement: 'topLeft',
//         }
//       );

//     } catch (error) {
//       console.error('Decryption error:', error);

//       this.notification.remove('decrypting');

//       this.notification.error(
//         'Thất bại',
//         `
//         Có lỗi trong quá trình giải mã văn bản ${file.fileName}!<br>
//         Vui lòng liên hệ quản trị viên hệ thống!<br><br>
//         <b>Chi tiết lỗi:</b> ${JSON.stringify(error)}
//       `,
//         {
//           nzDuration: 10000,
//           nzPlacement: 'topLeft',
//         }
//       );
//     } finally {
//       this.globalService.hideLoading();
//     }
//   }

   private async cleanupCacheFiles(): Promise<void> {
       try {
         // Dọn dẹp tất cả các file cache đã tạo
         const cleanupPromises = this.tabsViewFile
           .filter(tab => tab.fileUri) // Chỉ xử lý tabs có fileUri
           .map(async (tab) => {
             try {
               // Lấy tên file từ URI
               const fileName = tab.fileUri.split('/').pop();

               if (fileName) {
                 await Filesystem.deleteFile({
                   path: fileName,
                   directory: Directory.Cache
                 });
                 console.log(`Deleted cache file: ${fileName}`);
               }
             } catch (error) {
               console.warn(`Failed to delete file: ${tab.fileUri}`, error);
               // Không throw error để tiếp tục xóa các file khác
             }
           });

         await Promise.allSettled(cleanupPromises);
         console.log('Cache cleanup completed');

       } catch (error) {
         console.error('Error during cache cleanup:', error);
       }
     }

    formatUserName(user: any): string {
      if (!user) return '';

      const fullName = user.fullName || '';
      const shortName = user.userRole?.shortName || '';

      if (shortName) {
        return `${fullName} - ${shortName}`;
      }

      return fullName;
    }

    onSearchChangeYKienXuLy(){
      this.processedYKien = this.processedYKienOrigin.filter(x => x.orgId == this.orgFilterYKienXuLySelected)
    }

    loadingYKien : boolean = false;
    filterProcessedYKien : any[] = []
    processedYKienOrigin : any[] = []
    orgFilterYKienXuLySelected : string = ''
    getListYKienByDocId(docId: any, donViNhanId: any) {
      this.loadingYKien = true;
      this.orgFilterYKienXuLySelected = donViNhanId;
      this._sDonVi.getListYKienByDocId(docId).subscribe({
        next: (data) => {
          this.model.danhSachYKien = data;
          this.processedYKienOrigin = this.model.danhSachYKien.map((i) => {
            const isUyQuyen =
              i.nguoiNhanUyQuyen &&
              i.nguoiYKien?.userName !== i.nguoiNhanUyQuyen?.userName;
            const displayYKien = this.globalService.convertDataYKien(i.activity?.listPlans || [], i.donVi);
            const textColor = i.isYKienTuDo ? '#d46b08' : i.nguoiNhanYKien ? '#1890ff' : i.nguoiYKien ? 'red' : '';
            return {
              ...i,
              isUyQuyen,
              displayYKien,
              textColor,
            };
          });
          this.filterProcessedYKien = [
            ...new Map(
              this.processedYKienOrigin
                .sort((a, b) => (a.donVi?.orderNumber ?? 0) - (b.donVi?.orderNumber ?? 0))
                .map(p => [p.orgId, { orgId: p.orgId, name: p.donVi?.fullName }])
            ).values()
          ];
          this.processedYKien = this.processedYKienOrigin.filter(x => x.orgId == donViNhanId)
          this.loadingYKien = false;
        },
        error: (err) => {

          this.loadingYKien = false;
        }
      });
    }

    quaTrinhGuiNhan(documentId: any, actId: any, currentId: any) {
      if (!documentId) return;
      this.listOfMapDataQtgn = [];
      this.mapOfExpandedDataQtgn = {};
      this._sDonVi.quaTrinhGuiNhan(documentId, actId, currentId).subscribe({
        next: (data) => {
          var lstOrg = [
            ...new Map(
              data.sort((a: any, b: any) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
                .map((p: any) => [p.donViDocumentId, { id: p.donViDocumentId, donVi: p.donViDocument, pId: "", isColspan : true }])
            ).values()
          ];

          data.forEach((i: any) => {
            if (i.isYKien) {
              i.pId = i.donViDocumentId
            }
          });

          this.listOfMapDataQtgn = [];
          this.mapOfExpandedDataQtgn = {};

          this.dataTempQtgn = [...lstOrg, ...data]

          this.listOfMapDataQtgn = this.tree.buildTreeQtgn(this.dataTempQtgn);
          this.listOfMapDataQtgn.forEach((i: any) => {
            this.mapOfExpandedDataQtgn[i.id] = this.tree.convertTreeToListQtgn(i);
          });

        },
      });
    }

    ngOnDestroy(){
      this.cleanupCacheFiles();
    }
}
