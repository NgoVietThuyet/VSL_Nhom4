import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../ng-zorro.module';
import { LessonService } from '../../../features/lessons/lesson.service';

type MediaKind = 'video' | 'image';

const ACCEPT: Record<MediaKind, string> = {
  video: 'video/mp4,video/webm,video/quicktime',
  image: 'image/jpeg,image/png,image/webp',
};
const MAX_BYTES: Record<MediaKind, number> = {
  video: 200 * 1024 * 1024,
  image: 5 * 1024 * 1024,
};

/**
 * Ô nhập video / ảnh: upload lên MinIO (có tiến trình) hoặc dán URL, kèm xem trước.
 * Với video: tự đọc thời lượng và cho phép chụp khung hình làm ảnh bìa.
 */
@Component({
  selector: 'app-media-input',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './media-input.component.html',
  styleUrls: ['./media-input.component.scss']
})
export class MediaInputComponent implements OnChanges, OnDestroy {
  @Input() kind: MediaKind = 'video';
  @Input() value: string | null | undefined = '';
  @Output() valueChange = new EventEmitter<string>();
  /** Thời lượng video dạng m:ss khi đọc được metadata */
  @Output() durationDetected = new EventEmitter<string>();
  /** URL vừa upload thành công — để form dọn file nếu admin huỷ */
  @Output() uploaded = new EventEmitter<string>();
  /** Ảnh chụp từ khung hình video hiện tại */
  @Output() frameCaptured = new EventEmitter<Blob>();

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  mode: 'upload' | 'url' = 'upload';
  readonly modeOptions = [
    { label: 'Tải lên', value: 'upload', icon: 'cloud-upload' },
    { label: 'Dán URL', value: 'url', icon: 'link' },
  ];
  urlDraft = '';
  uploading = false;
  progress = 0;
  fileName = '';
  /** blob: URL của file vừa chọn — dùng để xem trước / chụp khung hình không bị chặn CORS */
  localPreview: string | null = null;

  private uploadSub?: Subscription;

  constructor(private lessonService: LessonService, private message: NzMessageService) {}

  get accept(): string {
    return ACCEPT[this.kind];
  }

  get previewSrc(): string | null {
    return this.localPreview || this.value || null;
  }

  get canCapture(): boolean {
    // Chỉ chụp được khung hình khi nguồn là file local (không bị chặn CORS)
    return this.kind === 'video' && !!this.localPreview;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.urlDraft = this.value || '';
      if (this.value && !this.localPreview && !this.isOwnUpload(this.value)) {
        this.mode = 'url';
      }
    }
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.revokeLocal();
  }

  beforeUpload = (file: any): boolean => {
    const f = file as File;
    if (!ACCEPT[this.kind].split(',').includes(f.type)) {
      this.message.error(this.kind === 'video' ? 'Chỉ hỗ trợ video MP4, WEBM hoặc MOV' : 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return false;
    }
    if (f.size > MAX_BYTES[this.kind]) {
      this.message.error(this.kind === 'video' ? 'Video tối đa 200MB' : 'Ảnh tối đa 5MB');
      return false;
    }
    this.startUpload(f);
    return false;
  };

  uploadBlob(blob: Blob, name: string): void {
    this.startUpload(new File([blob], name, { type: blob.type }));
  }

  private startUpload(file: File): void {
    this.uploadSub?.unsubscribe();
    this.revokeLocal();
    this.localPreview = URL.createObjectURL(file);
    this.fileName = file.name;
    this.uploading = true;
    this.progress = 0;

    this.uploadSub = this.lessonService.upload(file, this.kind).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          const url = event.body?.data?.url;
          this.uploading = false;
          if (url) {
            this.value = url;
            this.urlDraft = url;
            this.valueChange.emit(url);
            this.uploaded.emit(url);
            this.message.success('Tải lên thành công');
          }
        }
      },
      error: (err) => {
        this.uploading = false;
        this.revokeLocal();
        this.message.error(err?.error?.message || 'Tải lên thất bại');
      }
    });
  }

  cancelUpload(): void {
    this.uploadSub?.unsubscribe();
    this.uploading = false;
    this.revokeLocal();
  }

  applyUrl(): void {
    const url = this.urlDraft.trim();
    this.revokeLocal();
    this.value = url;
    this.valueChange.emit(url);
  }

  clear(): void {
    this.cancelUpload();
    this.value = '';
    this.urlDraft = '';
    this.valueChange.emit('');
  }

  onLoadedMetadata(): void {
    const v = this.videoEl?.nativeElement;
    if (!v || !isFinite(v.duration)) return;
    const total = Math.round(v.duration);
    this.durationDetected.emit(`${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`);
  }

  onPreviewError(): void {
    if (this.previewSrc) {
      this.message.warning(this.kind === 'video' ? 'Không phát được video từ đường dẫn này' : 'Không tải được ảnh từ đường dẫn này');
    }
  }

  captureFrame(): void {
    const v = this.videoEl?.nativeElement;
    if (!v || !v.videoWidth) {
      this.message.warning('Video chưa sẵn sàng để chụp');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    try {
      canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) this.frameCaptured.emit(blob);
      }, 'image/jpeg', 0.85);
    } catch {
      this.message.warning('Không chụp được khung hình từ nguồn video này');
    }
  }

  private isOwnUpload(url: string): boolean {
    return url.includes('/lessons/videos/') || url.includes('/lessons/thumbs/');
  }

  private revokeLocal(): void {
    if (this.localPreview) {
      URL.revokeObjectURL(this.localPreview);
      this.localPreview = null;
    }
  }
}
