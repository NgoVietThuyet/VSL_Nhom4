import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { AdminLesson, AdminTopicDetail, LessonService } from '../lesson.service';
import { LessonFormDrawerComponent } from '../lesson-form-drawer/lesson-form-drawer.component';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [SharedModules, LessonFormDrawerComponent],
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.scss']
})
export class TopicDetailComponent implements OnInit {
  topicId!: number;
  topic: AdminTopicDetail | null = null;
  lessons: AdminLesson[] = [];
  loading = false;
  keyword = '';

  drawerVisible = false;
  editingLesson: AdminLesson | null = null;

  videoVisible = false;
  videoLesson: AdminLesson | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.load();
  }

  get filteredLessons(): AdminLesson[] {
    const k = this.keyword.trim().toLowerCase();
    return k ? this.lessons.filter(l => l.title.toLowerCase().includes(k)) : this.lessons;
  }

  /** Chỉ cho kéo-thả khi đang xem toàn bộ danh sách (không lọc) */
  get canReorder(): boolean {
    return !this.keyword.trim() && this.lessons.length > 1;
  }

  load(): void {
    this.loading = true;
    forkJoin({
      topic: this.lessonService.getTopic(this.topicId),
      lessons: this.lessonService.listLessons(this.topicId),
    }).subscribe({
      next: ({ topic, lessons }) => {
        this.topic = topic;
        this.lessons = lessons;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không tải được chủ đề');
        if (err?.status === 404) this.back();
      }
    });
  }

  back(): void {
    this.router.navigate(['/topics']);
  }

  openLesson(lesson: AdminLesson): void {
    this.router.navigate(['/topics', this.topicId, 'lessons', lesson.lessonId]);
  }

  openCreate(): void {
    this.editingLesson = null;
    this.drawerVisible = true;
  }

  openEdit(lesson: AdminLesson): void {
    this.editingLesson = lesson;
    this.drawerVisible = true;
  }

  onSaved(): void {
    this.drawerVisible = false;
    this.load();
  }

  drop(event: CdkDragDrop<AdminLesson[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const before = [...this.lessons];
    moveItemInArray(this.lessons, event.previousIndex, event.currentIndex);
    this.lessons = [...this.lessons];
    this.lessonService.reorderLessons(this.topicId, this.lessons.map(l => l.lessonId)).subscribe({
      next: () => {
        this.lessons.forEach((l, i) => l.displayOrder = i + 1);
        this.message.success('Đã cập nhật thứ tự bài học');
      },
      error: (err) => {
        this.lessons = before;
        this.message.error(err?.error?.message || 'Không lưu được thứ tự');
      }
    });
  }

  toggleStatus(lesson: AdminLesson): void {
    this.lessonService.toggleLesson(lesson.lessonId).subscribe({
      next: () => this.load(),
      error: (err) => this.message.error(err?.error?.message || 'Lỗi đổi trạng thái')
    });
  }

  deleteLesson(lesson: AdminLesson): void {
    this.lessonService.deleteLesson(lesson.lessonId).subscribe({
      next: () => {
        this.message.success('Đã xoá bài học');
        this.load();
      },
      error: (err) => this.message.error(err?.error?.message || 'Lỗi xoá bài học')
    });
  }

  playVideo(lesson: AdminLesson): void {
    if (!lesson.videoUrl) {
      this.message.info('Bài học chưa có video hướng dẫn');
      return;
    }
    this.videoLesson = lesson;
    this.videoVisible = true;
  }

  closeVideo(): void {
    this.videoVisible = false;
    this.videoLesson = null;
  }

  difficultyLabel(d: number): string {
    return d >= 3 ? 'Nâng cao' : d === 2 ? 'Trung bình' : 'Cơ bản';
  }

  difficultyColor(d: number): string {
    return d >= 3 ? 'red' : d === 2 ? 'orange' : 'green';
  }
}
