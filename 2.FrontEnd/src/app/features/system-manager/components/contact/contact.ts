import { Component, HostListener } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { PaginationResult } from "../../../../shared/models";
import { ContactDto } from "../../models/contact.model";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzModalService } from "ng-zorro-antd/modal";
import { GlobalService } from "../../../../core";
import { ContactService } from "../../services/contact.service";
import { SharedModules } from "../../../../shared/ng-zorro.module";
import { EnvironmentService } from "../../../../core/services/environment.service";


@Component({
  selector: 'app-contact',
  imports: [SharedModules],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {
  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  googleAccountEmail: string = '';
  isSyncing: boolean = false;

  data: PaginationResult = new PaginationResult();
  dto: ContactDto = new ContactDto();
  filter: ContactDto = new ContactDto();

  constructor(
    private global: GlobalService,
    private service: ContactService,
    private message: NzMessageService,
    private modal: NzModalService,
    private env: EnvironmentService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Danh bạ',
        path: 'system-manager/contact',
      },
    ]);
  }

  ngOnInit(): void {
    this.search();
    this.checkGoogleAccount();
  }

  checkGoogleAccount(): void {
    this.service.getGoogleAccount().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
          this.googleAccountEmail = res.email;
      },
      error: (e) => {
        this.googleAccountEmail = '';
      }
    });
  }

  syncGoogleContacts(): void {
    this.service.getGoogleAuthUrl().pipe(takeUntil(this.destroy$)).subscribe({
      next: (url: any) => {
        if (typeof url === 'string' && url) {
          const width = 500;
          const height = 600;
          const left = (window.innerWidth - width) / 2;
          const top = (window.innerHeight - height) / 2;

          window.open(url, 'GoogleContactsSync', `width=${width},height=${height},top=${top},left=${left}`);
        } else {
          this.message.error('Không thể lấy đường dẫn xác thực Google');
        }
      },
      error: () => {
        // Lỗi đã được CommonService xử lý và hiển thị
      }
    });
  }

  disconnectGoogle(): void {
    this.modal.create({
      nzTitle: 'Xác nhận hủy liên kết',
      nzContent: 'Bạn có chắc chắn muốn hủy liên kết tài khoản Google hiện tại? Danh bạ đã đồng bộ sẽ không bị xóa.',
      nzOkText: 'Hủy liên kết',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.service.disconnectGoogle().pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            if (res.status) {
              this.message.success('Đã hủy liên kết tài khoản Google');
              this.googleAccountEmail = '';
            } else {
              this.message.error('Hủy liên kết thất bại');
            }
          }
        });
      }
    });
  }

  syncGoogleNow(): void {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.service.syncGoogleNow().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isSyncing = false;
        if (res.status) {
          this.message.success(res.messageObject?.message || 'Đồng bộ danh bạ từ Google thành công!');
          this.search();
        } else {
          this.message.error(res.messageObject?.message || 'Đồng bộ thất bại');
        }
      },
      error: () => {
        this.isSyncing = false;
        this.message.error('Đồng bộ thất bại do lỗi hệ thống');
      }
    });
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    if (event.data && event.data.type === 'oauth_success' && event.data.provider === 'GoogleContacts') {
      this.message.success('Đồng bộ danh bạ từ Google thành công!');
      this.search();
      this.checkGoogleAccount();
    }
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res;
        }
      });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.search();
    }
  }

  reset() {
    this.filter = new ContactDto();
    this.search();
  }

  favorite(item: ContactDto, index: number) {
    item.isFavorite = !item.isFavorite;
    item.id = item.id || '';
    this.service.update(item).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
          } else {
            item.isFavorite = !item.isFavorite;
          }
        },
        error: () => {
          item.isFavorite = !item.isFavorite;
        }
      });
  }

  open(item: ContactDto | string, isEdit: boolean) {
    if (isEdit && typeof item === 'object') {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res;
            this.isEdit = true;
            this.visible = true;
          }
        });
    } else {
      const model = new ContactDto();
      this.dto = model;
      this.isEdit = false;
      this.visible = true;
    }
  }

  close() {
    this.visible = false;
    this.dto = new ContactDto();
  }

  save() {
    if (!this.dto.displayName?.trim()) {
      this.message.error('Tên liên hệ không được để trống');
      return;
    }

    if (this.dto.email?.trim() && !this.isValidEmail(this.dto.email)) {
      this.message.error('Email không đúng định dạng');
      return;
    }

    if (this.dto.phone?.trim() && !this.isValidPhone(this.dto.phone)) {
      this.message.error('Số điện thoại không đúng định dạng');
      return;
    }

    if (this.isEdit) {
      this.update();
    } else {
      this.insert();
    }
  }

  insert() {
    this.service.insert(this.dto).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.close();
            this.search();
          }
        }
      });
  }

  update() {
    this.service.update(this.dto).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.close();
            this.search();
          }
        }
      });
  }

  delete(item: ContactDto) {
    this.modal.create({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa danh bạ "${item.displayName}" không?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.service.delete(item.id).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              if (res.status) {
                this.message.success(res.messageObject?.message || 'Xóa danh bạ thành công');
                this.search();
              } else {
                this.message.error(res.messageObject?.message || 'Xóa danh bạ thất bại');
              }
            }
          });
      }
    });
  }

  pageIndexChange(event: number) {
    this.filter.currentPage = event;
    this.search();
  }

  pageSizeChange(event: number) {
    this.filter.pageSize = event;
    this.filter.currentPage = 1;
    this.search();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  isValidEmail(email: string): boolean {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    return re.test(email.toLowerCase());
  }

  isValidPhone(phone: string): boolean {
    const re = /^[0-9+]{10,12}$/;
    return re.test(phone);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
