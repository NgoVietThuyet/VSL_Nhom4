import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { GlobalService } from '../../../../core/services/global.service';
import { SyncUpdateService } from '../../services/sync-update.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
    selector: 'app-sync-update',
    standalone: true,
    imports: [SharedModules],
    templateUrl: './sync-update.html',
})
export class SyncUpdate implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    versions: any[] = [];
    isLoading = false;
    isUploading = false;

    drawerVisible = false;
    selectedFile: File | null = null;
    releaseNote = '';

    constructor(
        private global: GlobalService,
        private service: SyncUpdateService,
        private message: NzMessageService,
        private modal: NzModalService
    ) {
        this.global.setBreadcrumb([
            { name: 'Quản lý hệ thống', path: 'system-manager' },
            { name: 'xWorkspace Sync Update', path: 'system-manager/sync-update' }
        ]);
    }

    ngOnInit(): void { this.load(); }

    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    load(): void {
        this.isLoading = true;
        this.service.getList().pipe(takeUntil(this.destroy$)).subscribe({
            next: (data: any) => { this.versions = data || []; this.isLoading = false; },
            error: () => { this.isLoading = false; }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
    }

    upload(): void {
        if (!this.selectedFile) { this.message.warning('Vui lòng chọn file .exe'); return; }
        this.isUploading = true;
        this.service.upload(this.selectedFile, this.releaseNote)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.message.success('Upload thành công');
                    this.drawerVisible = false;
                    this.selectedFile = null;
                    this.releaseNote = '';
                    this.load();
                    this.isUploading = false;
                },
                error: () => { this.isUploading = false; }
            });
    }

    download(id: number, fileName: string): void {
        const url = this.service.getDownloadUrl(id);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    }

    confirmDelete(id: number): void {
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Hành động này sẽ xóa file khỏi MinIO và không thể khôi phục.',
            nzOkDanger: true,
            nzOkText: 'Xóa',
            nzCancelText: 'Huỷ',
            nzOnOk: () => {
                this.service.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => { this.message.success('Đã xóa thành công'); this.load(); }
                });
            }
        });
    }

    formatSize(bytes: number): string {
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }
}
