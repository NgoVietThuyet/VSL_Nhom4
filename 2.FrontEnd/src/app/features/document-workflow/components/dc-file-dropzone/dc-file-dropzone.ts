import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-dc-file-dropzone',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-file-dropzone.html',
  styleUrls: ['./dc-file-dropzone.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcFileDropzone {
  @Input() disabled = false;
  @Input() loading = false;
  @Input() hintText = 'Bấm hoặc kéo thả văn bản vào đây';
  @Input() readonlyText = 'Chưa có tệp đính kèm';
  @Input() loadingText = 'Đang tải xem trước...';

  @Output() filesSelected = new EventEmitter<File[]>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  isDragOver = false;

  onZoneClick(): void {
    if (this.disabled || this.loading) return;
    this.fileInput?.nativeElement.click();
  }

  onDragOver(e: DragEvent): void {
    if (this.disabled || this.loading) return;
    e.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
  }

  onDrop(e: DragEvent): void {
    if (this.disabled || this.loading) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length) this.filesSelected.emit(files);
  }

  onFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.filesSelected.emit(files);
  }
}
