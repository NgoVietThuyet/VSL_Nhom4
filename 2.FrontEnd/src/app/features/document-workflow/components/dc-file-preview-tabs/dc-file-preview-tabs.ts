import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { FileService } from '../../../../shared/services';
import { OnlyOfficeFileScope } from '../../../../shared/utils/onlyoffice-helper';
import { DcFileDropzone } from '../dc-file-dropzone/dc-file-dropzone';
import { DcFilePreview } from '../dc-file-preview/dc-file-preview';
import { DcFilePreviewTab, dcFilePreviewTabTitle } from './dc-file-preview-tabs.model';

@Component({
  selector: 'app-dc-file-preview-tabs',
  standalone: true,
  imports: [SharedModules, DcFileDropzone, DcFilePreview],
  templateUrl: './dc-file-preview-tabs.html',
  styleUrls: ['./dc-file-preview-tabs.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcFilePreviewTabs {
  @Input() dropzoneDisabled = false;
  @Input() onlyOfficeScope: OnlyOfficeFileScope = 'File';
  @Input() isFullBrowser = false;

  @Output() fileAttached = new EventEmitter<{ fileId: string; fileName: string }>();
  @Output() fullBrowserChange = new EventEmitter<boolean>();

  @ViewChildren(DcFilePreview) private previews!: QueryList<DcFilePreview>;

  fileTabs: DcFilePreviewTab[] = [];
  selectedIndex = 0;

  constructor(
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
  ) {}

  get hasTabs(): boolean {
    return this.fileTabs.length > 0;
  }

  get activeTab(): DcFilePreviewTab | null {
    return this.fileTabs[this.selectedIndex] ?? null;
  }

  trackTab(_index: number, tab: DcFilePreviewTab): string {
    return tab.fileId;
  }

  clearTabs(): void {
    this.fileTabs = [];
    this.selectedIndex = 0;
    this.cdr.markForCheck();
  }

  openOrActivateTab(fileId: string, fileName: string): void {
    if (!fileId) return;
    const name = fileName || 'Tệp đính kèm';
    const idx = this.fileTabs.findIndex(t => t.fileId === fileId);
    if (idx >= 0) {
      this.selectedIndex = idx;
      if (name && this.fileTabs[idx].fileName !== name) {
        this.fileTabs = this.fileTabs.map((t, i) =>
          i === idx ? { ...t, fileName: name, title: dcFilePreviewTabTitle(name) } : t,
        );
      }
      this.cdr.markForCheck();
      return;
    }
    this.fileTabs = [
      ...this.fileTabs,
      { fileId, fileName: name, title: dcFilePreviewTabTitle(name) },
    ];
    this.selectedIndex = this.fileTabs.length - 1;
    this.cdr.markForCheck();
  }

  closeTab(event: { index: number }): void {
    const index = event.index;
    if (index < 0 || index >= this.fileTabs.length) return;
    this.fileTabs = this.fileTabs.filter((_, i) => i !== index);
    if (!this.fileTabs.length) {
      this.selectedIndex = 0;
    } else if (this.selectedIndex >= this.fileTabs.length) {
      this.selectedIndex = this.fileTabs.length - 1;
    } else if (index < this.selectedIndex) {
      this.selectedIndex--;
    }
    this.cdr.markForCheck();
  }

  closeTabByFileId(fileId: string): void {
    const idx = this.fileTabs.findIndex(t => t.fileId === fileId);
    if (idx >= 0) this.closeTab({ index: idx });
  }

  onDropzoneFiles(files: File[]): void {
    this.uploadAndOpen(files);
  }

  uploadAndOpen(files: File[]): void {
    if (!files.length) return;
    this.fileService.uploadFiles(files).subscribe({
      next: (res: any) => {
        const uploaded: any[] = res?.data ?? res ?? [];
        const f = uploaded[0];
        if (!f) return;
        const fileId = String(f.id ?? f.Id ?? '');
        const fileName = f.fileName ?? f.FileName ?? 'Tệp đính kèm';
        if (!fileId) return;
        this.fileAttached.emit({ fileId, fileName });
        this.openOrActivateTab(fileId, fileName);
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  reloadActiveTab(): void {
    const preview = this.previews?.get(this.selectedIndex);
    preview?.reload();
  }

  toggleFullBrowser(full: boolean): void {
    this.fullBrowserChange.emit(full);
  }
}
