import { Component, Input, OnInit, HostListener, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { NoiNhanXuLyComponent } from '../noi-nhan-xu-ly/noi-nhan-xu-ly.component';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment.dev';
import { EnvironmentService, GlobalService } from '../../../../core';
import { PaginationResult } from '../../../../shared/models';
import { CommonService } from '../../../../shared/services';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { OutgoingDocumentTranferInputModel } from '../../models/outgoing-document-tranfer-input.class';
import { VanBanDiDonViService } from '../../services/van-ban-di-don-vi.service';
import * as GlobalConstants from '../../../../shared/constants/global.constants';
import { OutgoingDocumentFilterModel } from '../../models/outgoing-document.filter.class';
import { trackById } from '../../../../shared/utils/track-by.utils';
import { ViewMode } from '../../../../shared/enums/view-mode.enum';
import { OutgoingDocumentFilter } from '../../../filter/document/outgoing-document.filter';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { OrganizeFilter } from '../../../filter/document/master-data/organize.filter';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chi-tiet-van-ban-di',
  imports: [SharedModules, NoiNhanXuLyComponent],
  templateUrl: './chi-tiet-van-ban-di.component.html',
  styleUrls: ['../documents.scss'],
})
export class ChiTietVanBanDiComponent implements OnInit, OnChanges {
  @Input() documentId: string | null = '';
  @Input() visible: boolean = false;
  @Input() selectedIndex: number = 0;
  @Output() close = new EventEmitter<boolean>();

  globalConstants = GlobalConstants;
  shouldOpenPanel:
    | 'listDuThao'
    | 'listToTrinh'
    | 'listToTrinhDaBanHanh'
    | 'listDeXuatBanHanh'
    | 'files'
    | 'vbpd'
    | 'hscv'
    | 'vbth'
    | 'vbtt'
    | null = 'listDuThao';
  trackById = trackById;
  model = new OutgoingDocumentTranferInputModel();
  filter = new OutgoingDocumentFilter();
  filterOrganize = new OrganizeFilter();
  paginationResult = new PaginationResult();
  listOrganizes: any = [];
  lstOrganizes: any[] = [];
  isLoading = false;

  info: any = localStorage.getItem('UserInfo');
  user: any = JSON.parse(this.info);

  isFullBrowser: boolean = false;
  isFullscreen: boolean = false;
  activeTtcTtct: boolean = true;
  selectedIndexViewFile: any = 0;

  viewMode = ViewMode;
  viewModeSelect: string = '';
  previewFileList: any[] = [];

  idTabActive: string = '';
  filePreview: SafeResourceUrl = '';
  fileIdPreview: string = '';
  fileCurentPreview: any = {};
  selectedFileType:
    | 'files'
    | 'listDuThao'
    | 'listToTrinh'
    | 'listToTrinhDaBanHanh'
    | 'listDeXuatBanHanh'
    | 'vanBanPhucDap' = 'listDuThao';
  selectedFileVblq: any[] = [];
  vblqSelectedViewFile: string | null = null;
  titleCountFile: string | null = null;
  isViewVersion: boolean = false;
  selectedTabIndex: number = 2;

  configOnlyOffice: any = null;
  private currentFileList: any[] = [];
  private destroy$ = new Subject<void>();
  isVisibleHoanThanhVBTT = false;

  tabsViewFile: any[] = [];

  isPdf: boolean = false;

  validFileCount = {
    listDuThao: 0,
    listToTrinh: 0,
    files: 0,
    listDeXuatBanHanh: 0,
    listToTrinhDaBanHanh: 0,
    vanBanPhucDap: 0,
  };

  collapseActive: Record<string, boolean> = {
    noiNhanDeBiet: false,
    ngoaiNganh: false,
    noiNganh: false,
    donViNoiBo: false,
    nguoiNhanXuLy: false,
  };

  // Thêm biến đếm tổng số bản ghi đã chọn cho từng loại
  selectedCounts = {
    noiNhanDeBiet: 0,
    ngoaiNganh: 0,
    noiNganh: 0,
    donViNoiBo: 0,
    nguoiNhanXuLy: 0,
  };

  constructor(
    private env : EnvironmentService,
    private _sDonVi: VanBanDiDonViService,
    private _sOrg: OrganizeService,
    public globalService: GlobalService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private common: CommonService,
    private notification: NzNotificationService,
    private http: HttpClient,
    private _s: VanBanDiDonViService,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.getListOrganizes();
    this.loadOrganize();
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

  async getListOrganizes(): Promise<any> {
    try {
      const listOrganizes = await firstValueFrom(
        this._sDonVi.getOrganizes().pipe(takeUntil(this.destroy$))
      );
      this.listOrganizes = listOrganizes;
      return listOrganizes;
    } catch (err) {
      throw err;
    }
  }

  loadOrganize(): void {
      this.filterOrganize.DataFilter.isNgoaiNganh = false;
      this._sOrg.search(this.filterOrganize).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.lstOrganizes = res.data;
          this.cdr.detectChanges();
        },
      });
    }

  updateValidFileCount(
    type:
      | 'listDuThao'
      | 'listToTrinh'
      | 'files'
      | 'listToTrinhDaBanHanh'
      | 'listDeXuatBanHanh'
      | 'vanBanPhucDap'
  ) {
    this.validFileCount[type] =
      this.model[type]?.filter(
        (f) => f.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ).length ?? 0;
  }

  openEdit(): void {
      this.viewModeSelect = ViewMode.VIEW;
      this.filePreview = '';
    this.fileIdPreview = '';
    this.selectedFileType = 'listDuThao';
    setTimeout(() => {
      this._sDonVi.xemChiTiet(this.documentId).subscribe({
        next: (data) => {
          if (!data) {
            this.closeDrawer();
            this.message.error("Không tìm thấy Văn bản đính kèm");
            return;
          }
          this.model = data;
          // this.validFileCount = {
          //   listDuThao: this.model.listPhieuDuThao?.length || 0,
          //   listToTrinh: this.model.listPhieuToTrinh?.length || 0,
          //   files: this.model.files?.length || 0,
          //   listDeXuatBanHanh: this.model.listDeXuatBanHanh?.length || 0,
          //   listToTrinhDaBanHanh: 0,
          //   vanBanPhucDap: this.model.vanBanPhucDap?.length || 0,
          // };
          this.selectedCounts = {
            noiNhanDeBiet: this.model.donViNhanDeBiet?.length || 0,
            ngoaiNganh: this.model.donViNhanNgoaiNganh?.length || 0,
            noiNganh: this.model.donViNhanNoiNganh?.length || 0,
            donViNoiBo: this.model.donViNhanNoiBo?.length || 0,
            nguoiNhanXuLy: this.model.nguoiNhanXuLy?.length || 0,
          };
            if (
                !this.model.noiDungTrinhKy ||
                this.model.noiDungTrinhKy.trim() === ''
            ) {
                this.model.noiDungTrinhKy = 'Kính trình';
            }
            this.model.listDuThao =
                data?.listPhieuDuThao
                ?.map((x: any) => {
                    const file = x.fileFlowPhieu?.[0];
                    // Map thêm các trường tọa độ và trạng thái checked từ phiếu gốc
                    return {
                    ...file,
                    soVB_X: x.soVB_X,
                    soVB_Y: x.soVB_Y,
                    soVB_Font: x.soVB_Font,
                    isVanBan: x.isVanBan,
                    ngay_X: x.ngayBH_X,
                    ngay_Y: x.ngayBH_Y,
                    ngay_Font: x.ngayBH_Font,
                    isNgay: x.isNgay,
                    thang_X: x.thangBH_X,
                    thang_Y: x.thangBH_Y,
                    thang_Font: x.thangBH_Font,
                    isThang: x.isThang,
                    nam_X: x.namBH_X,
                    nam_Y: x.namBH_Y,
                    isChoSo: x.isChoSo,
                    nam_Font: x.namBH_Font,
                    isNam: x.isNam,
                    isDuThao: x.isDuThao ?? false,
                    isBanHanh: x.isBanHanh ?? false,
                    lstVersionFileFlowPhieuDT: x.lstVersionFileFlowPhieuDT,
                    filePDFFlowPhieu: x.filePDFFlowPhieu?.[0],
                    tieuDePhieu: x.tieuDePhieu,
                    };
                })
                .filter(Boolean) || [];
            const list = data?.listPhieuToTrinh || [];

            if (!list.length) {
                this.model.listToTrinh = [];
                this.model.listToTrinhDaBanHanh = [];
            } else {
                // Kiểm tra có bản ghi nào lanBanHanh = null không
                const hasNullLanBanHanh = list.some(
                (x: any) => x.lanBanHanh == null
                );

                let selected: any[] = [];
                let notSelected: any[] = [];

                if (hasNullLanBanHanh) {
                // Nếu có null → tất cả bản ghi null vào listToTrinh
                selected = list.filter((x: any) => x.lanBanHanh == null);
                notSelected = list.filter((x: any) => x.lanBanHanh != null);
                } else {
                // Nếu không → lấy max lanBanHanh
                const maxLanBanHanh = Math.max(
                    ...list.map((x: any) => Number(x.lanBanHanh) || 0)
                );

                selected = list.filter(
                    (x: any) => Number(x.lanBanHanh) === maxLanBanHanh
                );
                notSelected = list.filter(
                    (x: any) => Number(x.lanBanHanh) !== maxLanBanHanh
                );
                }

                // Hàm map dữ liệu
                const mapItem = (x: any) => {
                const file = x.fileFlowPhieu?.[0];
                return {
                    ...file,
                    soVB_X: x.soVB_X,
                    soVB_Y: x.soVB_Y,
                    soVB_Font: x.soVB_Font,
                    isVanBan: x.isVanBan,
                    ngay_X: x.ngayBH_X,
                    ngay_Y: x.ngayBH_Y,
                    ngay_Font: x.ngayBH_Font,
                    isNgay: x.isNgay,
                    thang_X: x.thangBH_X,
                    thang_Y: x.thangBH_Y,
                    thang_Font: x.thangBH_Font,
                    isThang: x.isThang,
                    nam_X: x.namBH_X,
                    nam_Y: x.namBH_Y,
                    nam_Font: x.namBH_Font,
                    isNam: x.isNam,
                    isChoSo: x.isChoSo,
                    lanBanHanh: x.lanBanHanh,
                    bookIdOld: x.bookId,
                    soPhieuOld: x.soPhieu,
                    isDuThao: x.isDuThao ?? false,
                    isBanHanh: x.isBanHanh ?? false,
                    lstVersionFileFlowPhieuTT: x.lstVersionFileFlowPhieuTT,
                    filePDFFlowPhieu: x.filePDFFlowPhieu?.[0],
                    tieuDePhieu: x.tieuDePhieu,
                };
                };

                this.model.listToTrinh = selected.map(mapItem).filter(Boolean);
                this.model.listToTrinhDaBanHanh = notSelected
                .map(mapItem)
                .filter(Boolean);
            }

            this.model.listDeXuatBanHanh =
                data?.listPhieuDeXuatBanHanh
                ?.map((x: any) => ({
                    ...x.fileFlowPhieu?.[0],
                    ...x,
                }))
                .filter(Boolean) || [];

            this.model.files = data?.document?.fileFlowDocument || [];

          [
            'listDuThao',
            'listToTrinh',
            'files',
            'listDeXuatBanHanh',
            'listToTrinhDaBanHanh',
            'vanBanPhucDap',
          ].forEach((t) => this.updateValidFileCount(t as any));

            this.previewFileList = [
                ...(this.model.listDuThao || []),
                ...(this.model.listToTrinh || []),
                ...(this.model.files || []),
            ];

            if (
                data.document.isDonViCuc &&
                data.document.isDeXuatBanHanh === false &&
                data.document.trangThai ===
                this.globalConstants.TRANG_THAI_VAN_BAN_DI.CHO_BAN_HANH
            ) {
                this.model.files = (this.model.files || []).map((f: any) => ({
                ...f,
                checked: true,
                }));

                this.model.phieuFiles = this.model.files;
            }

            const getPriorityFiles = () => {
                return this.model.listDuThao?.length
                ? data?.listPhieuDuThao?.[0]?.filePDFFlowPhieu ||
                    data.listPhieuDuThao?.[0]?.fileFlowPhieu
                : this.model.listDuThao || [];
            };
            const duThaoFiles = getPriorityFiles();
            this.previewFileList = [
                ...duThaoFiles,
                ...(this.model.listToTrinh || []),
            ];

            if (this.previewFileList.length > 0) {
                if (this.previewFileList[0].filePDFFlowPhieu) {
                this.onClickViewFile(
                    this.previewFileList[0].filePDFFlowPhieu,
                    'view'
                );
                } else {
                this.onClickViewFile(this.previewFileList[0], 'view');
                }
            }
            this.model.activity = data.activity;
            // this.isCollapseOpen.listDuThao = true;
            // Force render khi component được tạo bởi parent OnPush
            this.cdr.detectChanges();
        },
        error: (err) => {
          this.closeDrawer();
          this.message.error("Không tìm thấy Văn bản đính kèm");
        },
      });
      this.configOnlyOffice = null;
      this.titleCountFile = '';
      this.isPdf = false;
    });
  }

  searchDuThao() {
    this.isLoading = true;

    const fromDate = this.filter.DataFilter.filter.fromDate
      ? this.toUtcISOString(this.filter.DataFilter.filter.fromDate, false) // đầu ngày
      : null;

    const toDate = this.filter.DataFilter.filter.toDate
      ? this.toUtcISOString(this.filter.DataFilter.filter.toDate, true) // cuối ngày ✅
      : null;

    const filterPayload = {
      ...this.filter,
      DataFilter: {
        ...this.filter.DataFilter,
        filter: {
          ...this.filter.DataFilter.filter,
          fromDate,
          toDate,
        },
      },
    };

    this._sDonVi
      .searchDuThao(filterPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.paginationResult = data;
          this.isLoading = false;
        },
        error: (response: any) => {
          this.isLoading = false;
        },
      });
  }

  toUtcISOString(date: Date, endOfDay = false): string {
    const d = new Date(date);

    // Nếu cần lấy cuối ngày
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }

    // Bù lại offset trước khi gọi toISOString
    const offsetMinutes = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - offsetMinutes);

    return d.toISOString();
  }

  onselectedFileVblqChange(value: any[]) {
    this.selectedFileVblq = value;
  }

  filePreviewKey: string = '';
  onFilePreviewChange(preview: SafeResourceUrl) {
    this.filePreview = preview;
    this.filePreviewKey = Date.now().toString();
    this.cdr.detectChanges(); // force update iframe
  }

  onFileIdPreviewChange(value: any) {
    this.fileIdPreview = value;
  }

  onConfigOnlyOfficeChange(config: any) {
    this.configOnlyOffice = config;
  }

  isPdfChange(value: any) {
    this.isPdf = value;
  }

  onVblqSelectedViewFileChange(value: string | null) {
    this.vblqSelectedViewFile = value;
  }

  onTitleCountFileChange(value: string | null) {
    this.titleCountFile = value;
  }

  onOpenFile(event: any) {
    this.onClickViewFile(event.data, event.mode, event.fileType, event.index);
  }

  onTabsViewFileChange(value: any) {
    this.tabsViewFile = value;
  }

  onTabViewFileChange(e: any) {
    var tab = this.tabsViewFile[e];
    this.idTabActive = tab?.idTab;
  }

  closeTabViewFile(e: any): void {
    this.tabsViewFile.splice(e.index, 1);
    if (this.selectedIndexViewFile >= this.tabsViewFile.length) {
      this.selectedIndexViewFile = this.tabsViewFile.length - 1;
    }
  }

  generateShortId() {
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    return '_' + Array.from(array, dec => dec.toString(36)).join('');
  }

  onClickViewFile(
    data: any,
    mode: any,
    fileType: string = 'listDuThao',
    index: any = null
  ) {
    if (!data) return;
    if (mode === 'edit') this.toggleFullBrowser(true);
    this.fileIdPreview = data.id;
    this.isViewVersion = false;
    this.vblqSelectedViewFile = null;
    this.fileCurentPreview = data;
    this.selectedFileType = fileType as
      | 'files'
      | 'listDuThao'
      | 'listToTrinh'
      | 'vanBanPhucDap';

      if (data.fileName?.toLowerCase().endsWith('.bm3') && mode == 'view') {
          this.decrypt(data, mode, fileType);
        return;
      }


    const existedIndex = this.tabsViewFile.findIndex(
      (x) => x.path === data.path && x.mode == mode
    );
    if (existedIndex !== -1) {
      this.selectedIndexViewFile = existedIndex;
      return;
    }

    let fileLists = [
      (this.model.files || []).filter(
        (x: any) => x.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ),
      (this.model.listDuThao || []).filter(
        (x: any) => x.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ),
      (this.model.listToTrinh || []).filter(
        (x: any) => x.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ),
      (this.model.listVersionDuThao || []).filter(
        (x: any) => x.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ),
      (this.model.listVersionToTrinh || []).filter(
        (x: any) => x.type !== this.globalConstants.FILE_ACTION_TYPE.XOA_FILE
      ),
      this.model.listPhieu || [],
      this.model.yKienFiles || [],
      this.model.listVanBanPhucDap || [],
      this.model.listBanBanDaBanHanh || [],
      this.model.listHoSoCongViec || [],
    ];
    let foundList = fileLists.find((list) =>
      list.some((f: any) => f.id === data.id)
    );
    this.currentFileList = foundList || [];

    // Calculate index/count for titleCountFile
    const totalFiles = this.currentFileList.length;
    const currentIndex = this.currentFileList.findIndex(
      (x: any) => x.id === data.id
    );
    if (currentIndex !== -1) {
      this.titleCountFile = `${currentIndex + 1}/${totalFiles}`;
    } else {
      this.titleCountFile = `-/-`;
    }

    const isPdf =
      data.fileName?.toLowerCase().endsWith('.pdf') ||
      data.fileType?.includes('pdf');
    const idTab = this.generateShortId();
    this.idTabActive = idTab;

    const filePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
      isPdf
        ? `${this.env.getEnv('pdfViewerUrl')}${encodeURIComponent(
            this.env.getEnv('apiUrl') + '/File/PreviewFilePDF/' + data.path
          )}`
        : this.env.getEnv('onlyOfficeViewerUrl')
    );

    const newTab: any = {
      ...data,
      isPdf,
      idTab,
      filePreview,
      mode,
    };
    // Giữ lại bản ghi cuối cùng có id trùng, xoá các bản ghi trùng khác
    const lastIndex = [...this.tabsViewFile]
      .map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => tab.id === data.id)
      .map(({ index }) => index)
      .pop(); // Lấy index cuối có id trùng

    if (lastIndex !== undefined) {
      // Xoá phần tử tại lastIndex
      this.tabsViewFile.splice(lastIndex, 1);

      // Chèn newTab vào lại đúng vị trí đó
      this.tabsViewFile.splice(lastIndex, 0, newTab);

      // Cập nhật selectedIndex
      this.selectedIndexViewFile = lastIndex;
    } else {
      if (index !== null && index >= 0 && index <= this.tabsViewFile.length) {
        this.tabsViewFile.splice(index, 0, newTab);
        this.selectedIndexViewFile = index;
      } else {
        this.tabsViewFile.push(newTab);
        this.selectedIndexViewFile = this.tabsViewFile.length - 1;
      }
    }

    if (!isPdf) {
      this.observeIframeAndPostMessage(idTab, {
        file: data,
        mode,
        type: 2,
        environment: this.env.getEnv('apiUrl'),
        onlyOfficeUrl: this.env.getEnv('onlyOfficeUrl'),
        token: this.globalService.getToken(),
      });
    }
  }

  reFreshQTXL() {
    const { filterConvert } = this.prepareModelForSubmit();
    this._sDonVi.GetDocumentOutgoingQuaTrinhXuLy(filterConvert).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.model.quaTrinhXuLy = data;
      }
    });
  }

  prepareModelForSubmit() {
    const modelConvert = {
      ...this.model,
      activity: {
        ...this.model.activity,
        personAction: this.user.userName,
      },
      orgId: this.user.organizeCode,
      accountLoginInfo: this.user,
      document: {
        ...this.model.document,
        ngayVaoSo: this.model.document.ngayVaoSo
          ? this.globalService.formatDateToSendServer(
              this.model.document.ngayVaoSo
            )
          : null,
        hanTraLoi: this.model.document.hanTraLoi
          ? this.globalService.formatDateToSendServer(
              this.model.document.hanTraLoi
            )
          : null,
      },
      info: {
        ...this.model.info,
        ngayBanHanh: this.model.info.ngayBanHanh
          ? this.globalService.formatDateToSendServer(
              this.model.info.ngayBanHanh
            )
          : null,
      },
    };

    const filterConvert = {
      ...this.filter,
      DataFilter: {
        ...this.filter.DataFilter,
        accountLoginInfo: this.user,
        // indexTab: this.tabIndex,
        filter: {
          ...this.filter.DataFilter.filter,
          fromDate: this.filter.DataFilter.filter.fromDate
            ? this.globalService.formatDateToSendServer(
                this.filter.DataFilter.filter.fromDate
              )
            : null,
          toDate: this.filter.DataFilter.filter.toDate
            ? this.globalService.formatDateToSendServer(
                this.filter.DataFilter.filter.toDate
              )
            : null,
        },
      },
    };

    filterConvert.DataFilter.accountLoginInfo.org = null;
    filterConvert.DataFilter.accountLoginInfo.accountNguoiUyQuyen = null;
    filterConvert.DataFilter.accountLoginInfo.accountGroups = null;

    return { modelConvert, filterConvert };
  }

  showModalHoanThanhVBTT(): void {
    this.isVisibleHoanThanhVBTT = true;
  }

  expandedYKien = false;
  visibleCountYKien = 1;
  toggleYKien(): void {
    if (this.expandedYKien) {
      this.visibleCountYKien = 1; // số item mặc định
    } else {
      this.visibleCountYKien = this.model.quaTrinhXuLy.length;
    }
    this.expandedYKien = !this.expandedYKien;
  }
  downloadFile(data: any) {
    this._handleFile(data.path, data.fileType, data.tieuDePhieuVersion || data.fileName, false);
  }
  private _handleFile(path: string, fileType: string, fileName: string, isPreview: boolean) {
    var url = !isPreview ? 'File/DownloadDirect/' : 'File/PreviewFile/';
    this.common.downloadFile(`${url}${path}`).subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) return
        const contentType =
          res.headers.get('Content-Type') || 'application/octet-stream';
        const fileUrl = URL.createObjectURL(
          new Blob([blob], { type: contentType })
        );
        if (isPreview) {
          const safeUrl =
            contentType === 'application/pdf'
              ? this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl)
              : '';

          this.filePreview = safeUrl;
        } else {
          const filename =
            this.globalService.extractFilename(
              res.headers.get('Content-Disposition')
            ) || fileName;
          const a = Object.assign(document.createElement('a'), {
            href: fileUrl,
            download: filename,
            style: 'display:none',
          });
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(fileUrl);
        }
      },
    });
  }

  formatLineBreaks(text: string): string {
    return text ? text.replace(/\n/g, '<br>') : '';
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

  isFullscreenChange(value: any) {
    this.isFullscreen = value;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  toggleFullBrowser(e: any) {
    this.isFullscreen = e;
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

  getFileNames(files?: any[] | null): string {
    return (files || []).map((f: any) => f.fileName || f.name).join(', ');
  }

  onNoiNhanDeBietChange(selectedItems: any[]): void {
    const convertedItems = selectedItems.map((item) => ({
      personAction: item.id || item.key,
      id: item.id || item.key,
      name: item.name,
      isThuHoiThayThe: item.isThuHoiThayThe,
      status: 0,
      statusName: 'Chưa tiếp nhận',
    }));

    this.model.donViNhanDeBiet = convertedItems;
    this.selectedCounts.noiNhanDeBiet = selectedItems.length;
  }

  onNgoaiNganhChange(selectedItems: any[]): void {
    const convertedItems = selectedItems.map((item) => ({
      receiveOrgId: item.id || item.key,
      id: item.id || item.key,
      name: item.name,
      isThuHoiThayThe: item.isThuHoiThayThe,
      status: 0,
      statusName: 'Chưa tiếp nhận',
    }));

    this.model.donViNhanNgoaiNganh = convertedItems;
    this.selectedCounts.ngoaiNganh = selectedItems.length;
  }

  onNoiNganhChange(selectedItems: any[]): void {
    const convertedItems = selectedItems.map((item) => ({
      receiveOrgId: item.id || item.key,
      id: item.id || item.key,
      name: item.name,
      isThuHoiThayThe: item.isThuHoiThayThe,
      status: 0,
      statusName: 'Chưa tiếp nhận',
    }));

    this.model.donViNhanNoiNganh = convertedItems;
    this.selectedCounts.noiNganh = selectedItems.length;
  }

  onDonViNoiBoChange(selectedItems: any[]): void {
    const convertedItems = selectedItems.map((item) => ({
      receiveOrgId: item.id || item.key,
      id: item.id || item.key,
      name: item.name,
      isThuHoiThayThe: item.isThuHoiThayThe,
      status: 0,
      statusName: 'Chưa tiếp nhận',
    }));

    this.model.donViNhanNoiBo = convertedItems;
    this.selectedCounts.donViNoiBo = selectedItems.length;
  }

  onNguoiNhanXuLyChange(selectedItems: any[]): void {
    const convertedItems = selectedItems.map((item) => ({
      personAction: item.id || item.key,
      id: item.id || item.key,
      name: item.name,
      isThuHoiThayThe: item.isThuHoiThayThe,
      status: 0,
      statusName: 'Chưa tiếp nhận',
    }));

    this.model.nguoiNhanXuLy = convertedItems;
    this.selectedCounts.nguoiNhanXuLy = selectedItems.length;
  }

  async decrypt(file: any, mode: any, fileType?: any) {
    const existingIndex = this.tabsViewFile.findIndex((t) => t.id === file.id);

    if (existingIndex !== -1) {
      this.selectedIndexViewFile = existingIndex;
      this.idTabActive = this.tabsViewFile[existingIndex].idTab;
      return;
    }
    debugger
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
            inList: fileType,
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
            inList: fileType,
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

  // async decryptAndroid(file: any, mode: any): Promise<void> {
  //   const idx = this.tabsViewFile.findIndex(t => t.id === file.id);
  //   if (idx !== -1) {
  //     this.selectedIndexViewFile = idx;
  //     this.idTabActive = this.tabsViewFile[idx].idTab;
  //     return;
  //   }

  //   this.globalService.showLoading();

  //   this.notification.info(
  //     'Đang giải mã văn bản',
  //     file.fileName,
  //     {
  //       nzKey: 'decrypting',
  //       nzDuration: 0,
  //       nzPlacement: 'topLeft',
  //     }
  //   );

  //   try {
  //     const resFile = await firstValueFrom(
  //       this._s.convertDocxToPdfMobile(file.path)
  //     );
  //     if (!resFile) throw new Error('Convert file failed');

  //     const base64 = resFile.includes(',')
  //       ? resFile.split(',')[1]
  //       : resFile;

  //     const res = await SignCrypt.decryptFileBase64({
  //       fileBase64: base64
  //     });

  //     const fileName = `decrypted_${Date.now()}.pdf`;
  //     const savedFile = await Filesystem.writeFile({
  //       path: fileName,
  //       data: res.decryptedBase64,
  //       directory: Directory.Cache,
  //       recursive: true
  //     });

  //     const { Capacitor } = await import('@capacitor/core');
  //     const webPath = Capacitor.convertFileSrc(savedFile.uri);
  //     const pdfUrl = `assets/pdf-viewer/viewer.html?file=${encodeURIComponent(webPath)}`;

  //     const idTab = this.generateShortId();
  //     this.idTabActive = idTab;

  //     this.tabsViewFile.push({
  //       ...file,
  //       idTab,
  //       isPdf: true,
  //       mode: 'view',
  //       fileUri: savedFile.uri,
  //       filePreview: this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl)
  //     });

  //     this.selectedIndexViewFile = this.tabsViewFile.length - 1;

  //     this.notification.remove('decrypting');

  //     this.notification.success(
  //       'Thành công',
  //       `Văn bản ${file.fileName} được giải mã thành công!`,
  //       {
  //         nzDuration: 3000,
  //         nzPlacement: 'topLeft',
  //       }
  //     );

  //   } catch (error) {
  //     console.error('Decryption error:', error);

  //     this.notification.remove('decrypting');

  //     this.notification.error(
  //       'Thất bại',
  //       `
  //       Có lỗi trong quá trình giải mã văn bản ${file.fileName}!<br>
  //       Vui lòng liên hệ quản trị viên hệ thống!<br><br>
  //       <b>Chi tiết lỗi:</b> ${JSON.stringify(error)}
  //     `,
  //       {
  //         nzDuration: 10000,
  //         nzPlacement: 'topLeft',
  //       }
  //     );
  //   } finally {
  //     this.globalService.hideLoading();
  //   }
  // }

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
     ngOnDestroy(){
      this.cleanupCacheFiles();
     }
}
