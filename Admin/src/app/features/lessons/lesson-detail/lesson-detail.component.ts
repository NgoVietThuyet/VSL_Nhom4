import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../shared/ng-zorro.module';
import { API_BASE } from '../../../core/config/api.config';
import { AdminLessonDetail, LessonService, LessonSign } from '../lesson.service';
import { LessonFormDrawerComponent } from '../lesson-form-drawer/lesson-form-drawer.component';
import { SignFormDrawerComponent } from '../../signs/sign-form-drawer/sign-form-drawer.component';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [SharedModules, LessonFormDrawerComponent, SignFormDrawerComponent],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.scss']
})
export class LessonDetailComponent implements OnInit {
  topicId!: number;
  lessonId!: number;
  lesson: AdminLessonDetail | null = null;
  topics: any[] = [];
  loading = false;

  lessonDrawerVisible = false;

  signDrawerVisible = false;
  editingSign: any = null;

  assignVisible = false;
  assignSelected = new Set<number>();
  assigning = false;

  videoVisible = false;
  videoTitle = '';
  videoUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private lessonService: LessonService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.lessonId = Number(this.route.snapshot.paramMap.get('lessonId'));
    this.http.get<{ data: any[] }>(API_BASE + '/admin/topics').subscribe({
      next: (res) => this.topics = res.data || []
    });
    this.load();
  }

  get signs(): LessonSign[] {
    return this.lesson?.signs || [];
  }

  load(): void {
    this.loading = true;
    this.lessonService.getLesson(this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không tải được bài học');
        if (err?.status === 404) this.back();
      }
    });
  }

  back(): void {
    this.router.navigate(['/topics', this.topicId]);
  }

  difficultyLabel(d?: number): string {
    return (d ?? 1) >= 3 ? 'Nâng cao' : d === 2 ? 'Trung bình' : 'Cơ bản';
  }

  difficultyColor(d?: number): string {
    return (d ?? 1) >= 3 ? 'red' : d === 2 ? 'orange' : 'green';
  }

  // ───────── Bài học ─────────

  onLessonSaved(): void {
    this.lessonDrawerVisible = false;
    this.load();
  }

  toggleLesson(): void {
    this.lessonService.toggleLesson(this.lessonId).subscribe({
      next: () => this.load(),
      error: (err) => this.message.error(err?.error?.message || 'Lỗi đổi trạng thái')
    });
  }

  // ───────── Ký hiệu trong bài ─────────

  dropSign(event: CdkDragDrop<LessonSign[]>): void {
    if (!this.lesson || event.previousIndex === event.currentIndex) return;
    const before = [...this.lesson.signs];
    moveItemInArray(this.lesson.signs, event.previousIndex, event.currentIndex);
    this.lesson.signs = [...this.lesson.signs];
    this.saveSignOrder(this.lesson.signs.map(s => s.signId), 'Đã cập nhật thứ tự ký hiệu', before);
  }

  removeSign(sign: LessonSign): void {
    const ids = this.signs.filter(s => s.signId !== sign.signId).map(s => s.signId);
    this.saveSignOrder(ids, `Đã gỡ "${sign.nameVi}" khỏi bài học`, null, true);
  }

  openCreateSign(): void {
    this.editingSign = null;
    this.signDrawerVisible = true;
  }

  openEditSign(sign: LessonSign): void {
    // Lấy bản đầy đủ (có stepsJson, mô tả...) trước khi mở form
    this.http.get<{ data: any[] }>(API_BASE + '/admin/signs', { params: { lessonId: this.lessonId } }).subscribe({
      next: (res) => {
        this.editingSign = (res.data || []).find(s => s.signId === sign.signId) || { ...sign, topicId: this.topicId, lessonId: this.lessonId };
        this.signDrawerVisible = true;
      },
      error: () => this.message.error('Không tải được ký hiệu')
    });
  }

  onSignSaved(): void {
    this.signDrawerVisible = false;
    this.load();
  }

  playVideo(title: string, url?: string): void {
    if (!url) {
      this.message.info('Chưa có video');
      return;
    }
    this.videoTitle = title;
    this.videoUrl = url;
    this.videoVisible = true;
  }

  closeVideo(): void {
    this.videoVisible = false;
    this.videoUrl = '';
  }

  // ───────── Gán ký hiệu có sẵn ─────────

  openAssign(): void {
    this.assignSelected = new Set<number>();
    this.assignVisible = true;
  }

  toggleAssign(signId: number, checked: boolean): void {
    if (checked) this.assignSelected.add(signId);
    else this.assignSelected.delete(signId);
  }

  toggleAssignAll(checked: boolean): void {
    this.assignSelected = new Set(checked ? (this.lesson?.unassignedSigns || []).map(s => s.signId) : []);
  }

  get allAssignChecked(): boolean {
    const list = this.lesson?.unassignedSigns || [];
    return list.length > 0 && list.every(s => this.assignSelected.has(s.signId));
  }

  confirmAssign(): void {
    if (this.assignSelected.size === 0) return;
    // Giữ thứ tự hiện tại, thêm các ký hiệu mới vào cuối theo thứ tự trong danh sách chọn
    const added = (this.lesson?.unassignedSigns || []).filter(s => this.assignSelected.has(s.signId)).map(s => s.signId);
    const ids = [...this.signs.map(s => s.signId), ...added];
    this.assigning = true;
    this.saveSignOrder(ids, `Đã thêm ${added.length} ký hiệu vào bài học`, null, true, () => {
      this.assigning = false;
      this.assignVisible = false;
    });
  }

  private saveSignOrder(ids: number[], okMsg: string, rollback: LessonSign[] | null, reload = false, done?: () => void): void {
    this.lessonService.setLessonSigns(this.lessonId, ids).subscribe({
      next: () => {
        this.message.success(okMsg);
        done?.();
        if (reload) this.load();
      },
      error: (err) => {
        if (rollback && this.lesson) this.lesson.signs = rollback;
        this.assigning = false;
        this.message.error(err?.error?.message || 'Không cập nhật được ký hiệu của bài học');
      }
    });
  }
}
