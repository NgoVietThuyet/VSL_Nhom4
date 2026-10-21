import { Component } from "@angular/core";
import { finalize, Subject, takeUntil } from "rxjs";
import { PaginationResult } from "../../../../shared/models";
import { AccountDto } from "../../models/account.model";
import { AccountGroupDto } from "../../models/account-group.model";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzModalService } from "ng-zorro-antd/modal";
import { NzUploadFile } from "ng-zorro-antd/upload";
import { GlobalService } from "../../../../core";
import { LocalStorageUtils, TreeUtils } from "../../../../shared/utils";
import { OrganizeService } from "../../../master-data/services/organize.service";
import { TitleService } from "../../../master-data/services/title.service";
import { AccountAccountGroupDto } from "../../models/account-account-group.model";
import { AccountRightDto } from "../../models/account-right.model";
import { RightDto } from "../../models/right.model";
import { TitleDto } from "../../../master-data/models/title.model";
import { OrganizeDto } from "../../../master-data/models/organize.model";
import { AccountAccountGroupService } from "../../services/account-account-group.service";
import { AccountGroupService } from "../../services/account-group.service";
import { AccountService } from "../../services/account.service";
import { RightService } from "../../services/right.service";
import { FileService } from "../../../../shared/services";
import { SharedModules } from "../../../../shared/ng-zorro.module";


@Component({
  selector: 'app-account',
  imports: [SharedModules],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class Account {
  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;

  data: PaginationResult = new PaginationResult();
  dto: AccountDto = new AccountDto();
  filter: AccountDto = new AccountDto();

  dataAccountGroup: PaginationResult = new PaginationResult();
  dtoAccountGroup: AccountGroupDto = new AccountGroupDto();
  filterAccountGroup: AccountGroupDto = new AccountGroupDto();

  searchOrg: string = '';
  OrgTree: any[] = [];
  displayedOrgTree: any[] = [];
  selectedOrgKeys: string[] = [];

  searchRight = '';
  avatarUploading = false;
  avatarCacheBust = Date.now();
  accountRights: any[] = [];
  displayedRightTree: any[] = [];

  lstTitle: any[] = [];

  constructor(
    private global: GlobalService,
    private service: AccountService,
    private accountGroup: AccountGroupService,
    private accountAccountGroup: AccountAccountGroupService,
    private org: OrganizeService,
    private fileS: FileService,
    private right: RightService,
    private _title: TitleService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Tài khoản',
        path: 'system-manager/account',
      },
    ]);
  }

  ngOnInit(): void {
    this.getOrgs();
    this.getTitle();
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res
        }
      })
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.search();
    }
  }

  getTitle() {
    const filter = new TitleDto();
    filter.pageSize = 1000;
    this._title.search(filter).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.lstTitle = res.data || []
        }
      })
  }

  searchAccountGroup() {
    this.accountGroup.search(this.filterAccountGroup).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.dataAccountGroup = res
        }
      })
  }

  getOrgs() {
    const filter = new OrganizeDto();
    filter.pageSize = 1000;
    this.org.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.OrgTree = this.displayedOrgTree = TreeUtils.buildNzOrgTree(res.data);
        this.autoSelectFirstOrgNode();
      }
    });
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  onNodeClick(e: any) {
    this.visible = false;
    this.filter.orgId = e.keys.length > 0 ? e.keys[0] : '';
    this.filterAccountGroup.orgId = e.keys.length > 0 ? e.keys[0] : '';
    this.selectedOrgKeys = this.filter.orgId ? [this.filter.orgId] : [];
    if (this.filter.orgId && this.filterAccountGroup.orgId) {
      this.search();
      this.searchAccountGroup();
    } else {
      this.data = new PaginationResult();
      this.dataAccountGroup = new PaginationResult();
    }
  }

  private autoSelectFirstOrgNode(): void {
    if (this.filter.orgId || !this.displayedOrgTree?.length) {
      return;
    }

    const firstNode = this.displayedOrgTree[0];
    const firstNodeKey = firstNode?.key ?? firstNode?.id ?? firstNode?.origin?.id;
    if (!firstNodeKey) {
      return;
    }

    this.selectedOrgKeys = [firstNodeKey];
    this.onNodeClick({ keys: [firstNodeKey] });
  }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    this.avatarCacheBust = Date.now();
    if (isEdit) {
      this.service.detail(data.userName).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res?.data ?? res;
            this.loadRights(true);
            this.visible = true;
          }
        })
    }
    else {
      this.loadRights();
      this.visible = true;
      this.dto = new AccountDto();
      this.dto.orgId = this.filter.orgId;
    }
  }

  close() {
    this.visible = false;
    this.dto = new AccountDto();
  }

  save() {
    if (!this.dto.userName) {
      this.message.error('Vui lòng nhập tài khoản');
      return;
    }
    if (!this.dto.fullName) {
      this.message.error('Vui lòng nhập tên đầy đủ');
      return;
    }
    if (!this.dto.email) {
      this.message.error('Vui lòng nhập email');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.dto.email)) {
      this.message.error('Email không đúng định dạng');
      return;
    }

    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res.status) return;
          this.search();
          this.dto = new AccountDto();
          this.dto.orgId = this.filter.orgId;
          this.visible = false;
        }
      })
  }

  resetPassword() {
    this.modal.confirm({
      nzTitle: 'Xác nhận đặt lại mật khẩu',
      nzContent: `Mật khẩu của tài khoản <b>${this.dto.userName}</b> sẽ được đặt lại về mặc định. Bạn có chắc chắn muốn tiếp tục?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Huỷ',
      nzOnOk: () => {
        this.service.resetPassword(this.dto.userName).subscribe({
          next: (res: any) => {
            if (res.status) {
              this.message.success('Đặt lại mật khẩu thành công');
            }
          }
        })
      }
    });
  }

  reset() {
    this.filter = new AccountDto();
    this.search();
  }

  pageIndexChange(e: any) {
    this.filter.currentPage = e;
    this.search();
  }

  pageSizeChange(e: any) {
    this.filter.pageSize = e;
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRights(withCheck = false) {
    const filter = new RightDto();
    filter.pageSize = 1000;
    this.right.search(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.accountRights = TreeUtils.buildNzRightTree(res.data);
        if (withCheck) this.setCheckedRights(this.accountRights, this.dto.rights ?? []);
        this.displayedRightTree = [...this.accountRights];
      });
  }

  private setCheckedRights(nodes: any[], rights: string[]) {
    const rightIds = new Set(rights);
    nodes.forEach(node => {
      node.checked = rightIds.has(node.id);
      node.children?.length && this.setCheckedRights(node.children, rights);
    });
  }

  checkAccountGroup(id: any) {
    var find = this.dto.accountGroups.find(x => x.id == id)
    return find ? true : false
  }

  onChangeAccountGroup(e: any, id: any) {
    var payload = new AccountAccountGroupDto();
    payload.userName = this.dto.userName
    payload.groupId = id;

    var action = e ? this.accountAccountGroup.insert(payload) : this.accountAccountGroup.delete(payload)
    action.subscribe({
      next: (res: any) => {
        this.open(this.dto, true);
      }
    })
  }

  onChangeRight(e: any) {
    var payload = new AccountRightDto();
    payload.userName = this.dto.userName;
    payload.rightId = e.node.key;
    payload.isAdded = e.node.isChecked;
    payload.isRemoved = !e.node.isChecked;

    this.service.updateAccountRight(payload).subscribe({
      next: (res: any) => {

      }
    })
  }

  getAvatarUrl(): string | null {
    return this.global.getAccountAvatarUrl(this.dto?.userName, this.dto?.avatarFileId, this.avatarCacheBust);
  }

  getAvatarInitials(): string {
    return this.global.getInitialsAvatar(this.dto?.fullName || this.dto?.userName || '');
  }

  getAvatarColor(): string {
    return this.global.getAvatarColor(this.dto?.userName || this.dto?.fullName || '');
  }

  beforeUploadAvatar = (file: NzUploadFile | File): boolean => {
    const raw = file instanceof File ? file : (file.originFileObj as File);
    if (!raw) {
      this.message.error('Không đọc được file ảnh');
      return false;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(raw.type)) {
      this.message.error('Chỉ chấp nhận file ảnh JPG, PNG, WEBP, GIF');
      return false;
    }
    if (raw.size > 2 * 1024 * 1024) {
      this.message.error('Ảnh đại diện tối đa 2MB');
      return false;
    }
    if (!this.dto?.userName) {
      this.message.error('Không xác định được tài khoản');
      return false;
    }

    this.avatarUploading = true;
    this.service.uploadAvatar(this.dto.userName, raw)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.avatarUploading = false; })
      )
      .subscribe({
        next: (res: any) => {
          if (!res?.status) return;
          this.dto.avatarFileId = res?.data?.avatarFileId ?? '';
          this.avatarCacheBust = Date.now();
          const accountInfo = LocalStorageUtils.getItem('accountInfo');
          if (accountInfo?.userName === this.dto.userName) {
            this.global.updateStoredAccountInfo({ avatarFileId: this.dto.avatarFileId, avatarVersion: this.avatarCacheBust });
          }
          this.message.success('Cập nhật ảnh đại diện thành công');
        }
      });
    return false;
  };

  removeAvatar(): void {
    if (!this.dto?.userName) return;
    this.service.removeAvatar(this.dto.userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res?.status) return;
          this.dto.avatarFileId = '';
          this.avatarCacheBust = Date.now();
          const accountInfo = LocalStorageUtils.getItem('accountInfo');
          if (accountInfo?.userName === this.dto.userName) {
            this.global.updateStoredAccountInfo({ avatarFileId: '', avatarVersion: this.avatarCacheBust });
          }
          this.message.success('Đã xóa ảnh đại diện');
        }
      });
  }

}
