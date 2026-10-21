import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { MediaInputComponent } from '../../../shared/components/media-input/media-input.component';
import { AdminLesson, LessonService } from '../lesson.service';

/** Drawer tạo / sửa bài học (tab Thông tin + tab Video hướng dẫn) */
@Component({
  selector: 'app-lesson-form-drawer',
  standalone: true,
  imports: [SharedModules, MediaInputComponent],
  templateUrl: './lesson-form-drawer.component.html',
  styleUrls: ['./lesson-form-drawer.component.scss']
})
export class LessonFormDrawerComponent implements OnChanges {
  @Input() visible = false;
  @Input() topicId!: number;
  /** null = tạo mới */
  @Input() lesson: AdminLesson | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AdminLesson>();

  @ViewChild('thumbInput') thumbInput?: MediaInputComponent;

  readonly difficulties = [
    { value: 1, label: 'Cơ bản' },
    { value: 2, label: 'Trung bình' },
    { value: 3, label: 'Nâng cao' },
  ];

  dto: Partial<AdminLesson> = {};
  saving = false;
  tabIndex = 0;
  /** File upload trong phiên mở drawer — xoá nếu admin huỷ hoặc thay file khác */
  private sessionUploads: string[] = [];

  constructor(private lessonService: LessonService, private message: NzMessageService) {}

  get isEdit(): boolean {
    return !!this.lesson;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.tabIndex = 0;
      this.sessionUploads = [];
      this.dto = this.lesson
        ? { ...this.lesson }
        : { title: '', description: '', objectives: '', videoUrl: '', videoThumb: '', duration: '', difficulty: 1, estimatedMinutes: 10, isActive: true };
    }
  }

  onUploaded(url: string): void {
    this.sessionUploads.push(url);
  }

  onDuration(duration: string): void {
    this.dto.duration = duration;
  }

  onFrameCaptured(blob: Blob): void {
    this.thumbInput?.uploadBlob(blob, 'thumb.jpg');
    this.message.info('Đang tải ảnh bìa từ khung hình...');
  }

  close(): void {
    // Dọn các file đã upload nhưng không được lưu
    this.cleanupUploads([]);
    this.closed.emit();
  }

  save(): void {
    if (!this.dto.title?.trim()) {
      this.tabIndex = 0;
      this.message.warning('Vui lòng nhập tên bài học');
      return;
    }

    this.saving = true;
    const body = { ...this.dto, videoUrl: this.dto.videoUrl || '', videoThumb: this.dto.videoThumb || '' };
    const req = this.isEdit
      ? this.lessonService.updateLesson(this.lesson!.lessonId, body)
      : this.lessonService.createLesson(this.topicId, body);

    req.subscribe({
      next: (lesson) => {
        this.saving = false;
        this.cleanupUploads([this.dto.videoUrl, this.dto.videoThumb]);
        this.message.success(this.isEdit ? 'Cập nhật bài học thành công' : 'Tạo bài học thành công');
        this.saved.emit(lesson);
      },
      error: (err) => {
        this.saving = false;
        this.message.error(err?.error?.message || 'Lưu bài học thất bại');
      }
    });
  }

  private cleanupUploads(keep: (string | undefined)[]): void {
    for (const url of this.sessionUploads) {
      if (!keep.includes(url)) {
        this.lessonService.deleteUploaded(url).subscribe({ error: () => {} });
      }
    }
    this.sessionUploads = [];
  }
}
