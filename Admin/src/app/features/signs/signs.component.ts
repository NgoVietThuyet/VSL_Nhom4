import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';
import { SignFormDrawerComponent } from './sign-form-drawer/sign-form-drawer.component';

export interface AdminSign {
  signId: number;
  nameVi: string;
  contentType: string;
  duration?: string;
  videoUrl: string;
  videoThumb?: string;
  description?: string;
  stepsJson?: string;
  culturalNote?: string;
  difficulty: number;
  isActive: boolean;
  topicId?: number;
  topicName?: string;
  topicEmoji?: string;
  lessonId?: number;
  lessonTitle?: string;
  displayOrder?: number;
}

@Component({
  selector: 'app-signs',
  standalone: true,
  imports: [SharedModules, SignFormDrawerComponent],
  templateUrl: './signs.component.html',
  styleUrls: ['./signs.component.scss']
})
export class SignsComponent implements OnInit {
  private readonly API = API_BASE + '/admin/signs';
  private readonly TOPICS_API = API_BASE + '/admin/topics';

  signs: AdminSign[] = [];
  topics: any[] = [];
  loading = false;

  searchQuery = '';
  selectedTopicId: number | null = null;
  selectedDifficulty: number | null = null;

  pageIndex = 1;
  pageSize = 20;

  readonly difficulties = [
    { value: 1, label: 'Cơ bản (1 sao)' },
    { value: 2, label: 'Trung bình (2 sao)' },
    { value: 3, label: 'Nâng cao (3 sao)' },
  ];

  visible = false;
  editingSign: AdminSign | null = null;

  showVideoPreview = false;
  previewVideoUrl = '';
  previewTitle = '';

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.fetchTopics();
    this.search();
  }

  fetchTopics(): void {
    this.http.get<{ data: any[] }>(this.TOPICS_API).subscribe({
      next: (res) => this.topics = res.data || []
    });
  }

  search(): void {
    this.loading = true;
    this.pageIndex = 1;

    const params: string[] = [];
    if (this.searchQuery.trim()) params.push(`search=${encodeURIComponent(this.searchQuery.trim())}`);
    if (this.selectedTopicId != null) params.push(`topicId=${this.selectedTopicId}`);
    if (this.selectedDifficulty != null) params.push(`difficulty=${this.selectedDifficulty}`);
    const url = params.length ? `${this.API}?${params.join('&')}` : this.API;

    this.http.get<{ data: AdminSign[] }>(url).subscribe({
      next: (res) => {
        this.signs = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải danh sách ký hiệu');
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.searchQuery = '';
    this.selectedTopicId = null;
    this.selectedDifficulty = null;
    this.search();
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.search();
  }

  open(sign?: AdminSign): void {
    this.editingSign = sign ?? null;
    this.visible = true;
  }

  onSaved(): void {
    this.visible = false;
    this.search();
  }

  toggleStatus(sign: AdminSign): void {
    this.http.patch(`${this.API}/${sign.signId}/status`, {}).subscribe({
      next: () => this.search(),
      error: (err) => this.message.error(err?.error?.message || 'Lỗi đổi trạng thái')
    });
  }

  deleteSign(sign: AdminSign): void {
    this.http.delete(`${this.API}/${sign.signId}`).subscribe({
      next: () => {
        this.message.success('Đã xoá ký hiệu');
        this.search();
      },
      error: (err) => this.message.error(err?.error?.message || 'Lỗi xoá')
    });
  }

  openVideo(sign: AdminSign): void {
    if (!sign.videoUrl) {
      this.message.info('Ký hiệu này chưa có video mẫu');
      return;
    }
    this.previewVideoUrl = sign.videoUrl;
    this.previewTitle = sign.nameVi;
    this.showVideoPreview = true;
  }

  closeVideo(): void {
    this.showVideoPreview = false;
    this.previewVideoUrl = '';
  }

  trackById(_: number, item: AdminSign): number {
    return item.signId;
  }
}
