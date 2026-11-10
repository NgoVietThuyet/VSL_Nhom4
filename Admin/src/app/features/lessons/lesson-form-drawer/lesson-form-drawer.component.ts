import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { AdminLesson, LessonService } from '../lesson.service';

/** Drawer tạo / sửa bài học */
@Component({
  selector: 'app-lesson-form-drawer',
  standalone: true,
  imports: [SharedModules],
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

  readonly difficulties = [
    { value: 1, label: 'Cơ bản' },
    { value: 2, label: 'Trung bình' },
    { value: 3, label: 'Nâng cao' },
  ];

  dto: Partial<AdminLesson> = {};
  saving = false;

  constructor(private lessonService: LessonService, private message: NzMessageService) {}

  get isEdit(): boolean {
    return !!this.lesson;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.dto = this.lesson
        ? { ...this.lesson }
        : { title: '', description: '', objectives: '', difficulty: 1, isActive: true };
    }
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    if (!this.dto.title?.trim()) {
      this.message.warning('Vui lòng nhập tên bài học');
      return;
    }

    this.saving = true;
    const body = {
      ...this.dto,
      estimatedMinutes: null,
      videoUrl: this.dto.videoUrl || '',
      videoThumb: this.dto.videoThumb || '',
      duration: this.dto.duration || ''
    };
    const req = this.isEdit
      ? this.lessonService.updateLesson(this.lesson!.lessonId, body)
      : this.lessonService.createLesson(this.topicId, body);

    req.subscribe({
      next: (lesson) => {
        this.saving = false;
        this.message.success(this.isEdit ? 'Cập nhật bài học thành công' : 'Tạo bài học thành công');
        this.saved.emit(lesson);
      },
      error: (err) => {
        this.saving = false;
        this.message.error(err?.error?.message || 'Lưu bài học thất bại');
      }
    });
  }
}
