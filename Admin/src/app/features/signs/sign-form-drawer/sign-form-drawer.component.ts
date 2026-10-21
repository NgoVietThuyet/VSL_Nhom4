import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { MediaInputComponent } from '../../../shared/components/media-input/media-input.component';
import { API_BASE } from '../../../core/config/api.config';
import { AdminLesson, LessonService } from '../../lessons/lesson.service';

interface SignStep {
  title: string;
  detail: string;
}

/**
 * Drawer tạo / sửa ký hiệu. Dùng ở trang "Ký hiệu & Video" và trang chi tiết bài học.
 * Các bước thực hiện được lưu vào stepsJson theo định dạng app học viên đang đọc:
 * [{ step, title, detail }]
 */
@Component({
  selector: 'app-sign-form-drawer',
  standalone: true,
  imports: [SharedModules, MediaInputComponent],
  templateUrl: './sign-form-drawer.component.html',
  styleUrls: ['./sign-form-drawer.component.scss']
})
export class SignFormDrawerComponent implements OnChanges {
  private readonly API = API_BASE + '/admin/signs';

  @Input() visible = false;
  /** null = tạo mới */
  @Input() sign: any = null;
  @Input() topics: any[] = [];
  /** Cố định chủ đề / bài học (khi mở từ trang bài học) */
  @Input() fixedTopicId: number | null = null;
  @Input() fixedLessonId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  readonly difficulties = [
    { value: 1, label: 'Cơ bản (1 sao)' },
    { value: 2, label: 'Trung bình (2 sao)' },
    { value: 3, label: 'Nâng cao (3 sao)' },
  ];

  dto: any = {};
  steps: SignStep[] = [];
  lessons: AdminLesson[] = [];
  saving = false;
  tabIndex = 0;
  private sessionUploads: string[] = [];

  constructor(
    private http: HttpClient,
    private lessonService: LessonService,
    private message: NzMessageService
  ) {}

  get isEdit(): boolean {
    return !!this.sign;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.tabIndex = 0;
      this.sessionUploads = [];
      this.dto = this.sign
        ? { ...this.sign }
        : {
            nameVi: '',
            topicId: this.fixedTopicId ?? (this.topics[0]?.topicId ?? null),
            lessonId: this.fixedLessonId,
            contentType: 'single',
            difficulty: 1,
            duration: '0:03',
            videoUrl: '',
            videoThumb: '',
            description: '',
            culturalNote: '',
            isActive: true
          };
      if (this.fixedLessonId) this.dto.lessonId = this.fixedLessonId;
      this.steps = this.parseSteps(this.dto.stepsJson);
      this.loadLessons();
    }
  }

  onTopicChange(): void {
    this.dto.lessonId = null;
    this.loadLessons();
  }

  loadLessons(): void {
    this.lessons = [];
    if (!this.dto.topicId) return;
    this.lessonService.listLessons(this.dto.topicId).subscribe({
      next: (lessons) => this.lessons = lessons
    });
  }

  // ───────── Các bước thực hiện ─────────

  addStep(): void {
    this.steps = [...this.steps, { title: '', detail: '' }];
  }

  removeStep(index: number): void {
    this.steps = this.steps.filter((_, i) => i !== index);
  }

  dropStep(event: CdkDragDrop<SignStep[]>): void {
    moveItemInArray(this.steps, event.previousIndex, event.currentIndex);
    this.steps = [...this.steps];
  }

  private parseSteps(json?: string): SignStep[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr)
        ? arr.map((s: any) => ({ title: s.title || '', detail: s.detail || s.description || '' }))
        : [];
    } catch {
      return [];
    }
  }

  private stepsToJson(): string {
    const cleaned = this.steps
      .filter(s => s.title.trim() || s.detail.trim())
      .map((s, i) => ({ step: i + 1, title: s.title.trim(), detail: s.detail.trim() }));
    return JSON.stringify(cleaned);
  }

  // ───────── Media ─────────

  onUploaded(url: string): void {
    this.sessionUploads.push(url);
  }

  onDuration(duration: string): void {
    this.dto.duration = duration;
  }

  // ───────── Lưu / huỷ ─────────

  close(): void {
    this.cleanupUploads([]);
    this.closed.emit();
  }

  save(): void {
    if (!this.dto.nameVi?.trim() || !this.dto.topicId) {
      this.tabIndex = 0;
      this.message.warning('Vui lòng nhập tên ký hiệu và chọn chủ đề');
      return;
    }

    const body = { ...this.dto, stepsJson: this.stepsToJson(), unassignLesson: !this.dto.lessonId };
    this.saving = true;
    const req = this.isEdit
      ? this.http.put<any>(`${this.API}/${this.dto.signId}`, body)
      : this.http.post<any>(this.API, body);

    req.subscribe({
      next: (res) => {
        this.saving = false;
        this.cleanupUploads([this.dto.videoUrl, this.dto.videoThumb]);
        this.message.success(this.isEdit ? 'Cập nhật ký hiệu thành công' : 'Thêm ký hiệu thành công');
        this.saved.emit(res?.data);
      },
      error: (err) => {
        this.saving = false;
        this.message.error(err?.error?.message || 'Lưu ký hiệu thất bại');
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
