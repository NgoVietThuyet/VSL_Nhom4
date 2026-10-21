import { Component } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, debounceTime } from 'rxjs';
import { GlobalService } from '../../../../core';
import { BaseFilter, PaginationResult } from '../../../../shared/models';
import { ChiTietVanBanDenComponent } from '../../../documents/components/chi-tiet-van-ban-den/chi-tiet-van-ban-den.component';
import { ChiTietVanBanDiComponent } from '../../../documents/components/chi-tiet-van-ban-di/chi-tiet-van-ban-di.component';
import { VanBanDenDonViService } from '../../../documents/services/van-ban-den-don-vi.service';
import { DocumentFilter } from '../../../filter/document/incoming-document.filter';
import { OrganizeFilter } from '../../../filter/document/master-data/organize.filter';
import { AccountService } from '../../../system-manager/services/account.service';
import { FieldsService } from '../../services/fields.service';
import { OrganizeService } from '../../services/organize.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import * as GlobalConstants from '../../../../shared/constants/global.constants';
import { OrganizeInService } from '../../services/organize-in.service';
import { DocumentBookService } from '../../services/document-book.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-document-book',
  imports: [SharedModules, ChiTietVanBanDenComponent, ChiTietVanBanDiComponent],
  templateUrl: './document-book.component.html',
})
export class DocumentBookComponent {
  validateForm: FormGroup;
  isSubmit: boolean = false;
  visible: boolean = false;
  edit: boolean = false;
  filter = new BaseFilter();
  paginationResult = new PaginationResult();
  loading: boolean = false;
  currentYear = new Date().getFullYear();

  listSecurityLevels: { label: string; value: number }[] = GlobalConstants.DO_MAT.listForBook.map(item => ({
    label: item.name,
    value: item.id
  }));
  listBookTypes: { label: string; value: string }[] = [
    { label: 'Sổ văn bản đến', value: 'INCOMING' },
    { label: 'Sổ văn bản đi', value: 'OUTGOING' }
  ];
  listOrganizes: { id: string; name: string; pId: string; }[] = [];
  listFields: { label: string; value: string; name: string }[] = [];
  listClerks: { label: string; value: string; name: string; role: string; organizeCode: string }[] = [];
  listFilterClerks: any[] = [];

  currentItem: any = null;
  isDocumentDrawerVisible = false;
  selectedDocumentBook: FormGroup;
  documentListPagination = new PaginationResult();
  documentListFilter = new DocumentFilter();
  documentListLoading = false;
  // Variables for document selection
  selectedDocuments: any[] = [];
  selectAll = false;
  indeterminate = false;

  readonly globalConstants = GlobalConstants;
  organizeFilter = new OrganizeFilter();
  listOrganizesForDrawer: any[] = [];
  organizeLoading = false;
  searchInputList$ = new Subject<string>();
  private searchSubList: any;
  username: string = '';

  //View document detail
  ViewdocumentDetailVisible = false;
  documentId: string = '';

  listImportError: any[] = [];
  isShowListErrorVisible = false;
  constructor(
    private _service: DocumentBookService,
    private fields: FieldsService,
    private organizein: OrganizeInService,
    private fullNameEmp: AccountService,
    private fb: NonNullableFormBuilder,
    public globalService: GlobalService,
    private message: NzMessageService,
    private _vanBanDenDonViService: VanBanDenDonViService,
    private _sOrg: OrganizeService,
    private modal: NzModalService,
    private router: Router,
  ) {
    const userInfo = this.getUserInfo();
    const organizeCode = userInfo?.organizeCode || '';
    this.validateForm = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      orgId: [organizeCode, [Validators.required]],
      orgName: [''],
      year: [this.currentYear, [Validators.required]],
      securityLevelCode: [null, [Validators.required]],
      bookTypeCode: ['INCOMING', [Validators.required]],
      startNumber: ['0', [Validators.required]],
      orderNumber: ['0', [Validators.required]],
      documentBookFields: [[], [Validators.required, Validators.minLength(1)]],
      clerks: [[], [Validators.required]],
      isActive: [true, [Validators.required]],
      isDefault: [false]
    });
    this.selectedDocumentBook = this.fb.group({
      id: [''],
      code: [''],
      name: [''],
      orgId: [''],
      orgName: [''],
      year: [this.currentYear],
      securityLevelCode: [''],
      bookTypeCode: ['INCOMING'],
      startNumber: ['0'],
      orderNumber: ['0'],
      documentBookFields: [[]],
      clerks: [],
      isActive: [true],
      isDefault: [false]
    });
    this.globalService.setBreadcrumb([
      {
        name: 'Sổ văn bản',
        path: 'master-data/document-book',
      },
    ]);
    this.globalService.getLoading().subscribe((value) => {
      this.loading = value;
    });
    this.organizeFilter.DataFilter.isNgoaiNganh = false;
    this.onChangeOrganizeNgoaiNganh();
    this.searchSubList = this.searchInputList$
      .pipe(debounceTime(500))
      .subscribe(value => {
        this.onChangeOrganize(value);
      });
  }
  ngOnDestroy() {
    this.globalService.setBreadcrumb([]);
  }

  ngOnInit(): void {
    this.filter.dataFilter = {};
    const userInfo = this.getUserInfo();
    this.username = userInfo?.userName || '';
    this.validateForm.get('name')?.valueChanges.subscribe(() => this.generateCode());
    this.validateForm.get('year')?.valueChanges.subscribe(() => this.generateCode());
    this.validateForm.get('bookTypeCode')?.valueChanges.subscribe(() => this.generateCode());
    this.validateForm.get('orgId')?.valueChanges.subscribe(code => {
      this.updateOrgName();
      this.generateCode();
    });
    this.getEmpNameOrigin(userInfo?.organizeCode);
    this.getSecurityLevelCode();
    this.getOrganizes();

    // Khởi tạo giá trị mặc định cho checkbox "Nội ngành"
    this.organizeFilter.DataFilter.isNgoaiNganh = false;
    if(this.username !== 'admin')
    {
      this.filter.dataFilter = {
      orgId: userInfo.organizeCode
    };
    }
    this.getFields();
    this.search();
  }

  onSortChange(eqtypTxt: string, value: any) {
    this.filter = {
      ...this.filter,
      //SortColumn: eqtypTxt,
      //IsDescending: value === 'descend',
    };
    this.search();
  }

  search() {
    this.isSubmit = false;
    this._service.search(this.filter).subscribe({
      next: (data) => {
        this.paginationResult = {
          ...data,
        };
      },

    });
  }

  isCodeExist(eqtyp: string): boolean {
    return this.paginationResult.data?.some(
      (accType: any) => accType.eqtyp === eqtyp
    );
  }

  getUserInfo(): any {
    const userInfo = localStorage.getItem('accountInfo');
 
    return userInfo ? JSON.parse(userInfo) : null;
  }

  normalizeName(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s/g, '')
      .toUpperCase();
  }

  orgSelected: any;
  onChangeOrg(orgId: string) {
    const selectedOrg = this.listOrganizes.find(org => org.id === orgId);
    if (selectedOrg) {
      this.validateForm.patchValue({
        orgId: selectedOrg.id,
        orgName: selectedOrg.name
      });
      this.generateCode();
    }
  }

  generateCode(): void {
    const orgId = this.validateForm.get('orgId')?.value;
    const year = this.validateForm.get('year')?.value;
    const name = this.validateForm.get('name')?.value;
    const bookType = this.validateForm.get('bookTypeCode')?.value;

    if (orgId && year && name && bookType) {
      const segment = bookType === 'INCOMING' ? 'SOVBDEN' : 'SOVBDI';
      const normalizedName = this.normalizeName(name);
      const generatedCode = `${orgId}/${segment}/${year}/${normalizedName}`;
      this.validateForm.get('code')?.setValue(generatedCode);
    } else {
      this.validateForm.get('code')?.setValue('');
    }
  }

  getEmpNameOrigin(orgCode?: string): void {
    const code = orgCode || this.getUserInfo()?.organizeCode;
    if (!code) {
      this.listClerks = [];
      return;
    }

    this.fullNameEmp.GetAllClerks(code).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.listClerks = res.map((emp: any) => ({
            label: emp.fullName,
            value: emp.userName,
            role: emp.userRoleCode,
            organizeCode: emp.organizeCode
          }));
        }
      },
      error: () => {
        this.message.error('Lỗi khi lấy danh sách nhân viên');
      }
    });
  }

  getEmpName(orgCode?: string): void {
    const code = orgCode || this.getUserInfo()?.organizeCode;
    if (!code) {
      this.listClerks = [];
      return;
    }

    this.fullNameEmp.GetAllClerks(code).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.listClerks = res.map((emp: any) => ({
            label: emp.fullName,
            value: emp.userName,
            role: emp.userRoleCode,
            organizeCode: emp.organizeCode
          }));

          const userInfo = this.getUserInfo();
          const currentUser = userInfo?.userName || '';

          this.listFilterClerks = this.listClerks.filter(
            x => x.organizeCode === userInfo.organizeCode
          );

          const matchedClerk = this.listClerks.find(
            clerk => clerk.value === currentUser && ['VAN_THU', 'VT'].includes(clerk.role)
          );

          this.validateForm.get("clerks")?.setValue([
            matchedClerk?.value || this.listClerks[0]?.value
          ]);
        } else {
          this.listClerks = [];
          this.message.warning('Không tìm thấy văn thư nào');
        }
      },
      error: () => {
        this.message.error('Lỗi khi lấy danh sách nhân viên');
      }
    });
  }


  getClerkNameById(clerkId: string): string {
    const clerk = this.listClerks.find(c => c.value === clerkId);
    return clerk ? clerk.label : clerkId;
  }

  getClerkNames(clerkCodes: string[]): string {
    if (!clerkCodes || clerkCodes.length === 0) return '';
    return clerkCodes.map(code => this.getClerkNameById(code)).join(', ');
  }

  getOrganizes(): void {
    this.organizein.getOrg().subscribe({
      next: (res: any) => {
        this.listOrganizes = res || [];
        this.updateOrgName();
      },
      error: () => {
        this.message.error('Không lấy được danh sách tổ chức');
      }
    });
  }

  updateOrgName(): void {
    const orgId = this.validateForm.get('orgId')?.value;
    if (orgId) {
      const orgName = this.getRoomNameByOrg(orgId);
      this.validateForm.get('orgName')?.setValue(orgName);
    }
  }

  getFields(): void {
    this.listFields = GlobalConstants.LINH_VUC.listAll.map((field: any) => ({
      value: field.id.toString(),
      label: field.name,
      name: field.name
    }));

    if (!this.edit && this.listFields.length > 0) {
      this.validateForm.get('documentBookFields')?.setValue([this.listFields[0].value]);
    }
  }
  getSecurityLevelCode(): void {
    this.listSecurityLevels = GlobalConstants.DO_MAT.listForBook.map((field: any) => ({
      value: field.id,
      label: field.name,
      name: field.name
    }));

    if (!this.edit && this.listSecurityLevels.length > 0) {
      this.validateForm.get('securityLevelCode')?.setValue([this.listSecurityLevels[0].value]);
    }
  }

  getFieldTypeLabel(field: number | any): string {
    const fieldCode = typeof field === 'number' ? field : field.fieldsCode;
    const foundField = this.listFields.find(f => f.value === fieldCode);
    return foundField ? foundField.name : '';
  }

  getRoomNameByOrg(id: string): string {
    const organization = this.listOrganizes.find(org => org.id === id);
    return organization ? organization.name : "";
  }

  getBookTypeLabel(value: string): string {
    const type = this.listBookTypes.find((item) => item.value === value);
    return type ? type.label : value;
  }


  submitForm(): void {
    this.isSubmit = true;
    if (this.validateForm.valid) {
      const formData = this.validateForm.getRawValue();

      const clerks = (formData.clerks || []).map((clerksName: string) => ({
        clerksName
      }));


      const documentBookFields = (formData.documentBookFields || []).map((fieldsCode: string) => ({
        fieldsCode: parseInt(fieldsCode)
      }));

      const payload = {
        ...formData,
        clerks,
        documentBookFields
      };
      if (this.edit) {
        this._service.update(payload).subscribe({
          next: (data) => {
            this.search();
          },
          error: (response) => {

          },
        });
      } else {
        if (this.isCodeExist(payload.code)) {
          this.message.error(
            `Mã ${payload.code} đã tồn tại, vui lòng nhập lại`
          );
          return;
        }
        this._service.create(payload).subscribe({
          next: (data) => {
            this.search();
          },
          error: (response) => {

          },
        });
      }
      this.visible = false;
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  close() {
    this.visible = false;
    // this.resetForm();
    this.currentItem = null;
  }

  reset() {
    const organizeCode = this.getUserInfo()?.organizeCode || '';
    this.filter = new BaseFilter();
    this.filter.dataFilter = {
      orgId: organizeCode
    };
    this.search();
  }

  openCreate() {
    this.edit = false;
    this.visible = true;
    this.resetForm();

    const userInfo = this.getUserInfo();
    const currentUser = userInfo?.userName || '';
    this.getEmpNameOrigin(userInfo.organizeCode);
    this.listFilterClerks = this.listClerks.filter(x => x.organizeCode == userInfo.organizeCode);

    if (this.listClerks.length > 0) {
      const defaultClerk = this.listClerks[0].value;
      if (this.listClerks.length > 0) {
        const matchedClerk = this.listClerks.find(
          (clerk) => clerk.value === currentUser && (clerk.role === 'VAN_THU' || clerk.role === 'VT')
        );

        if (matchedClerk) {
          this.validateForm.get('clerks')?.setValue([matchedClerk.value]);
        } else {
          this.validateForm.get('clerks')?.setValue([defaultClerk]);
        }
      }
    }
  }

  // resetForm() {
  //   this.validateForm.reset();
  //   this.isSubmit = false;
  //   this.generateCode();
  // }
  resetForm() {
    this.validateForm.reset();
    const userInfo = this.getUserInfo();
    const organizeCode = userInfo?.organizeCode || '';
    const organizeName = this.getRoomNameByOrg(organizeCode);

    this.validateForm.patchValue({
      orgId: organizeCode,
      orgName: organizeName,
      year: this.currentYear,
      securityLevelCode: null,
      bookTypeCode: 'INCOMING',
      startNumber: '0',
      orderNumber: '0',
      documentBookFields: [],
      isActive: true
    });

    this.isSubmit = false;
  }

  deleteItem(eqtyp: string) {
    this._service.delete(eqtyp).subscribe({
      next: (data) => {
        this.search();
      },

    });
    this.visible = false;
  }

  openEdit(data: any) {
    const userInfo = this.getUserInfo();
    this.edit = true;
    this.visible = true;
    const organizeCode = userInfo?.organizeCode || '';
    const selectedFields = (data.documentBookFields || []).map(
      (f: any) => f.fieldsCode?.toString() || f?.toString()
    );
    this.getEmpNameOrigin(data.orgId);
    const selectedClerks = (data.clerks || []).map(
      (c: any) => c.clerksName || c
    );
     // Sau khi check thì mở form edit
     this.validateForm.setValue({
      id: data.id,
      code: data.code,
      name: data.name,
      orgId: data.orgId,
      orgName: this.getRoomNameByOrg(data.orgId),
      year: data.year,
      securityLevelCode: data.securityLevelCode,
      bookTypeCode: data.bookTypeCode,
      startNumber: data.startNumber,
      orderNumber: data.orderNumber,
      documentBookFields: selectedFields,
      clerks: selectedClerks,
      isActive: data.isActive,
      isDefault: data.isDefault ?? false,
    });
  this.currentItem = data;
  this.documentListFilter.DataFilter.bookId = data.id;

    this._service.checkHasDocument(this.documentListFilter.DataFilter.bookId).subscribe({
      next: (res: any) => {
        debugger
        if (res && res.hasDocument == true)
        {
          this.hasDocumentData = true;
        }
        else{
          this.hasDocumentData = false;
        }
      },
      error: () => {
        this.hasDocumentData = false;
      }
    })
  // this._service.GetAllVanBanTheoSo(this.documentListFilter).subscribe({
  //   next: (res: any) => {
  //     this.hasDocumentData = !!(res?.data && res.data.length > 0);


  //     setTimeout(() => {
  //       this.edit = true;
  //       this.visible = true;
  //     }, 200);
  //   },
  //   error: () => {
  //     this.message.error('Không kiểm tra được văn bản trong sổ');
  //     this.hasDocumentData = false;
  //   }
  // });
  }

  pageSizeChange(size: number): void {
    this.filter.currentPage = 1;
    this.filter.pageSize = size;
    this.search();
  }

  pageIndexChange(index: number): void {
    this.filter.currentPage = index;
    this.search();
  }
  // Method xử lý khi click vào phân trang của danh sách sổ văn bản
  pageDocumentsSizeChange(size: number): void {
    this.documentListFilter.PageSize = size;
    this.searchDocuments();
  }
  pageDocumentsIndexChange(index: number): void {
    this.documentListFilter.CurrentPage = index;
    this.searchDocuments();
  }

  // Khởi tạo danh sách đơn vị cho drawer
  loadOrganizesForDrawer() {
    this.organizeLoading = true;
    this._sOrg.search(this.organizeFilter).subscribe({
      next: (data) => {
        this.listOrganizesForDrawer = data.data || [];
        this.organizeLoading = false;
      },
      error: (error) => {
        this.listOrganizesForDrawer = [];
        this.organizeLoading = false;
        this.message.error('Lỗi khi tải danh sách đơn vị');
      }
    });
  }

  viewDocumentList(book: any, event: MouseEvent) {
    event.stopPropagation();
    const selectedFields = (book.documentBookFields || []).map(
      (f: any) => f.fieldsCode?.toString() || f?.toString()
    );
    const selectedClerks = (book.clerks || []).map(
      (c: any) => c.clerksName || c
    );

    this.currentItem = book;
    this.selectedDocumentBook.setValue({
      id: book.id,
      code: book.code,
      name: book.name,
      orgId: book.orgId,
      orgName: this.getRoomNameByOrg(book.orgId),
      year: book.year,
      securityLevelCode: this.selectedDoMatName(book.securityLevelCode),
      bookTypeCode: book.bookTypeCode,
      startNumber: book.startNumber,
      orderNumber: book.orderNumber,
      documentBookFields: selectedFields,
      clerks: selectedClerks,
      isActive: book.isActive,
      isDefault: book.isDefault,
    });

    // Reset checkbox "Nội ngành" khi mở drawer mới
    this.organizeFilter.DataFilter.isNgoaiNganh = false;

    // Load danh sách đơn vị cho dropdown
    this.loadOrganizesForDrawer();

    setTimeout(() => {
      this.isDocumentDrawerVisible = true;
      // Disable all controls in selectedDocumentBook
      Object.keys(this.selectedDocumentBook.controls).forEach(key => {
        this.selectedDocumentBook.get(key)?.disable();
      });
    }, 200);

    this.searchDocuments();
  }

  closeDocumentDrawer() {
    this.isDocumentDrawerVisible = false;
    this.selectedDocumentBook.reset({
      id: '',
      code: '',
      name: '',
      orgId: '',
      orgName: '',
      year: this.currentYear,
      securityLevelCode: '',
      bookTypeCode: 'INCOMING',
      startNumber: '0',
      orderNumber: '0',
      documentBookFields: [],
      clerks: [],
      isActive: true,
      isDefault: false,
    });
    // Reset document list filter and selection
    this.documentListFilter = new DocumentFilter();
    // Reset checkbox "Nội ngành"
    this.organizeFilter.DataFilter.isNgoaiNganh = false;
    this.selectedDocuments = [];
    this.selectAll = false;
    this.indeterminate = false;
  }

  hasDocumentData: boolean = false;
  searchDocuments() {
    this.documentListLoading = true;

    this.documentListFilter.DataFilter.bookId = this.selectedDocumentBook.get('id')?.value || '';
    this._service.GetAllVanBanTheoSo(this.documentListFilter).subscribe({
    next: (res: any) => {
        this.documentListPagination = res;
      this.documentListLoading = false;
    },
    error: () => {
      this.message.error('Lỗi khi tải danh sách văn bản');
      this.documentListLoading = false;
    }
  });
  }

  documentPageSizeChange(size: number): void {
    this.documentListFilter.PageSize = size;
    this.searchDocuments();
  }

  documentPageIndexChange(index: number): void {
    this.documentListFilter.CurrentPage = index;
    this.searchDocuments();
  }

  onSearchInputList(value: string): void {
    this.searchInputList$.next(value);
  }

  onChangeOrganizeNgoaiNganh() {
    // Cập nhật filter isNgoaiNganh dựa trên trạng thái checkbox
    this.documentListFilter.DataFilter.isNgoaiNganh = this.organizeFilter.DataFilter.isNgoaiNganh ? '1' : '0';
    // Gọi tìm kiếm văn bản
    /*  this.searchDocuments();*/
    // Cập nhật danh sách đơn vị
    this.loadOrganizesForDrawer();
  }

  onChangeOrganize(e: any) {
    this.organizeFilter.DataFilter.id = ''
    this.organizeFilter.KeyWord = e
    this.loadOrganizesForDrawer();
  }

  resetDocumentFilters(): void {
    this.documentListFilter = new DocumentFilter();
    // Reset checkbox "Nội ngành"
    this.organizeFilter.DataFilter.isNgoaiNganh = false;
    this.searchDocuments();
  }

  // deleteSelectedDocuments() {
  //   if (this.selectedDocuments && this.selectedDocuments.length > 0) {
  //     this.modal.confirm({
  //       nzTitle: 'Xác nhận xóa',
  //       nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedDocuments.length} văn bản đã chọn?`,
  //       nzOkText: 'Xóa',
  //       nzCancelText: 'Hủy',
  //       nzOnOk: () => {
  //         // Call API xóa
  //         this.documentService.deleteMultiple(this.selectedDocuments).subscribe(() => {
  //           this.message.success('Xóa thành công!');
  //           this.searchDocuments(); // Reload data
  //           this.selectedDocuments = []; // Clear selection
  //         });
  //       }
  //     });
  //   } else {
  //     this.message.warning('Vui lòng chọn ít nhất một văn bản để xóa!');
  //   }
  // }

  // Method export dữ liệu
  exportDocuments() {

    let bookId = this.selectedDocumentBook.get('id')?.value || '';
    const lstDocumentId = this.selectedDocuments.map((doc: any) => doc.id).join(',');
    this._service.exportExcel(bookId, lstDocumentId).subscribe({
      next: (res: any) => {
        if (res) {
          const contentDisposition = res.headers.get('Content-Disposition');
          let fileName = 'export.xlsx';

          if (contentDisposition) {
            // Ưu tiên lấy tên file từ UTF-8 (đầy đủ dấu tiếng Việt)
            const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
            if (utf8FileNameMatch && utf8FileNameMatch[1]) {
              fileName = decodeURIComponent(utf8FileNameMatch[1]);
            } else {
              // Nếu không có UTF-8 thì fallback sang bản ASCII
              const asciiFileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
              if (asciiFileNameMatch && asciiFileNameMatch[1]) {
                fileName = asciiFileNameMatch[1];
              }
            }
          }

          const blob = new Blob([res.body], { type: res.body.type });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this.message.error('Không có dữ liệu để xuất.');
        }
      },
      error: (error: any) => {
        this.message.error('Lỗi khi xuất dữ liệu: ' + error.message);
      }
    });
  }

  // Method export tất cả văn bản trong sổ
  exportAllDocuments() {
    this.documentListFilter.DataFilter.bookId = this.selectedDocumentBook.get('id')?.value || '';

    if (!this.documentListFilter.DataFilter.bookId) {
      this.message.warning('Không tìm thấy thông tin sổ văn bản');
      return;
    }

    this.documentListLoading = true;
    this.globalService.showLoading()

    const filter = {
      keyWord: this.documentListFilter.KeyWord,
      DataFilter: {
        ...this.documentListFilter.DataFilter,
      }
    };

    this._service.GetAllVanBanTheoSoIds(filter).subscribe({
      next: (documentIds: string[]) => {
        if (!documentIds || documentIds.length === 0) {
          this.message.warning('Không có văn bản nào trong sổ để xuất');
          this.documentListLoading = false;
          return;
        }

        const lstDocumentId = documentIds.join(',');

        this._service.exportExcel(this.documentListFilter.DataFilter.bookId, lstDocumentId).subscribe({
          next: (res: any) => {
            this.globalService.showLoading()
            if (res) {
              const contentDisposition = res.headers.get('Content-Disposition');
              let fileName = 'export.xlsx';

              if (contentDisposition) {
                // Ưu tiên lấy tên file từ UTF-8 (đầy đủ dấu tiếng Việt)
                const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
                if (utf8FileNameMatch && utf8FileNameMatch[1]) {
                  fileName = decodeURIComponent(utf8FileNameMatch[1]);
                } else {
                  // Nếu không có UTF-8 thì fallback sang bản ASCII
                  const asciiFileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                  if (asciiFileNameMatch && asciiFileNameMatch[1]) {
                    fileName = asciiFileNameMatch[1];
                  }
                }
              }

              const blob = new Blob([res.body], { type: res.body.type });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);

              this.message.success(`Đã xuất ${documentIds.length} văn bản thành công`);
            } else {
              this.globalService.hideLoading()
              this.message.error('Không có dữ liệu để xuất.');
            }
            this.globalService.hideLoading()
            this.documentListLoading = false;
          },
          error: (error: any) => {
            this.globalService.hideLoading()
            this.message.error('Lỗi khi xuất dữ liệu: ' + error.message);
            this.documentListLoading = false;
          }
        });
      },
      error: (error: any) => {
        this.globalService.hideLoading();
        this.message.error('Lỗi khi lấy danh sách ID văn bản: ' + error.message);
        this.documentListLoading = false;
      }
    });
  }

  // Method xử lý khi click checkbox "chọn tất cả"
  onSelectAllChange(checked: boolean): void {
    if (checked) {
      // Chọn tất cả
      this.selectedDocuments = [...this.documentListPagination.data];
      this.selectAll = true;
      this.indeterminate = false;
    } else {
      // Bỏ chọn tất cả
      this.selectedDocuments = [];
      this.selectAll = false;
      this.indeterminate = false;
    }
  }

  // Method xử lý khi click checkbox từng row
  onItemChecked(document: any, checked: boolean): void {
    if (checked) {
      this.selectedDocuments.push(document);
    } else {
      this.selectedDocuments = this.selectedDocuments.filter((item: any) => item.id !== document.id);
    }
    this.updateSelectAllStatus();
  }

  // Cập nhật trạng thái checkbox "chọn tất cả"
  updateSelectAllStatus(): void {
    const totalCount = this.documentListPagination.data.length;
    const selectedCount = this.selectedDocuments.length;

    if (selectedCount === 0) {
      this.selectAll = false;
      this.indeterminate = false;
    } else if (selectedCount === totalCount) {
      this.selectAll = true;
      this.indeterminate = false;
    } else {
      this.selectAll = false;
      this.indeterminate = true;
    }
  }

  // Kiểm tra document có được chọn không
  isDocumentSelected(document: any): boolean {
    return this.selectedDocuments.some((item: any) => item.id === document.id);
  }
  get selectedBookName(): string {
    return "Danh sách văn bản " + (this.selectedDocumentBook?.get('name')?.value + ' năm ' + this.selectedDocumentBook?.get('year')?.value) || '';
  }
  get selectedBookTypeCode(): string {
    return this.selectedDocumentBook?.get('bookTypeCode')?.value || '';
  }
  get selectedBookCode(): string {
    return this.selectedDocumentBook?.get('code')?.value || '';
  }
  selectedDoKhanName(doKhanCode: number): string {
    return this.globalConstants.DO_KHAN.getText(doKhanCode);
  }
  selectedDoMatName(doMatCode: number): string {
    return this.globalConstants.DO_MAT.getText(doMatCode);
  }
  openViewDocumentDetail(data: any) {
    this.documentId = data.id;
    this.ViewdocumentDetailVisible = true;
  }
  onCloseViewDocumentDetail(e: any) {
    this.documentId = '';
    this.ViewdocumentDetailVisible = e;
  }
  importAction(action: string) {
    if (action == 'template') {
      this._service.downloadTemplate()
        .subscribe((res: HttpResponse<Blob>) => {
          const blob = res.body!;

          // Lấy tên file từ header nếu có
          let filename = 'template.xlsx';
          const contentDisposition = res.headers.get('content-disposition');
          if (contentDisposition) {
            const matches = /filename\*?=(?:UTF-8'')?([^;]+)/.exec(contentDisposition);
            if (matches && matches[1]) {
              filename = decodeURIComponent(matches[1].replace(/['"]/g, '').trim());
            }
          }

          // Tạo link và trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        });
    }
    else if (action == 'upload') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls'; // chỉ cho chọn file Excel
      input.style.display = 'none';

      input.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          this._service.uploadTemplate(file).subscribe(res => {
            if (res.errors && res.errors.length > 0) {
              this.listImportError = res.errors;
              this.isShowListErrorVisible = true;
            }
            else {
              this.search();
            }
          });
        }
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    }
  }
  closeListErrorModal() {
    this.isShowListErrorVisible = false;
    this.listImportError = [];
    this.search();
  }

  // Văn bản thu hồi, thay thế
  isVisibleVanBanDi: boolean = false;
  detailVanBanDiId: string = '';
  onViewDetailVanBanDi(documentId: any): void {
    if (!documentId) return;
    this.detailVanBanDiId = documentId;
    this.isVisibleVanBanDi = true;
  }
  onCloseViewDetailVanBanDi(event: any) {
    this.isVisibleVanBanDi = event;
  }


}
