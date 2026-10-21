import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';

export interface AdminTopic {
  topicId: number;
  name: string;
  emoji: string;
  level: string;
  category: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  signsCount: number;
  lessonsCount?: number;
  createdAt: string;
}

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.scss']
})
export class TopicsComponent implements OnInit {
  private readonly API = API_BASE + '/admin/topics';

  topics: AdminTopic[] = [];
  loading = false;
  keyword = '';
  viewMode: 'table' | 'grid' = 'table';
  readonly viewOptions = [
    { label: '', value: 'table', icon: 'unordered-list' },
    { label: '', value: 'grid', icon: 'appstore' },
  ];

  readonly levels = ['Nhập môn', 'Cơ bản', 'Trung cấp', 'Nâng cao'];
  readonly categories = [
    { value: 'single', label: 'Từ đơn (single)' },
    { value: 'phrases', label: 'Cụm từ / Câu (phrases)' },
    { value: 'single phrases', label: 'Hỗn hợp (single & phrases)' },
  ];

  visible = false;
  isEdit = false;
  saving = false;
  dto: any = {};

  constructor(private http: HttpClient, private message: NzMessageService, private router: Router) {}

  ngOnInit(): void {
    this.fetchTopics();
  }

  get filteredTopics(): AdminTopic[] {
    const k = this.keyword.trim().toLowerCase();
    return k ? this.topics.filter(t => t.name.toLowerCase().includes(k)) : this.topics;
  }

  fetchTopics(): void {
    this.loading = true;
    this.http.get<{ data: AdminTopic[] }>(this.API).subscribe({
      next: (res) => {
        this.topics = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải danh sách chủ đề');
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.keyword = '';
    this.fetchTopics();
  }

  goToTopic(topic: AdminTopic): void {
    this.router.navigate(['/topics', topic.topicId]);
  }

  categoryLabel(value: string): string {
    return this.categories.find(c => c.value === value)?.label || value;
  }

  open(topic?: AdminTopic): void {
    this.isEdit = !!topic;
    this.dto = topic
      ? { ...topic }
      : {
          name: '',
          emoji: '👋',
          level: 'Cơ bản',
          category: 'single',
          description: '',
          displayOrder: this.topics.length + 1,
          isActive: true
        };
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  save(): void {
    if (!this.dto.name) {
      this.message.warning('Vui lòng nhập tên chủ đề');
      return;
    }

    this.saving = true;
    const req = this.isEdit
      ? this.http.put(`${this.API}/${this.dto.topicId}`, this.dto)
      : this.http.post(this.API, this.dto);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.visible = false;
        this.message.success(this.isEdit ? 'Cập nhật chủ đề thành công' : 'Thêm chủ đề thành công');
        this.fetchTopics();
      },
      error: (err) => {
        this.saving = false;
        this.message.error(err?.error?.message || (this.isEdit ? 'Lỗi cập nhật' : 'Lỗi thêm mới'));
      }
    });
  }

  toggleStatus(topic: AdminTopic): void {
    this.http.patch(`${this.API}/${topic.topicId}/status`, {}).subscribe({
      next: () => this.fetchTopics(),
      error: (err) => this.message.error(err?.error?.message || 'Lỗi đổi trạng thái')
    });
  }

  deleteTopic(topic: AdminTopic): void {
    if ((topic.lessonsCount || 0) > 0) {
      this.message.warning(`Chủ đề đang có ${topic.lessonsCount} bài học, không thể xoá.`);
      return;
    }
    if (topic.signsCount > 0) {
      this.message.warning(`Chủ đề đang có ${topic.signsCount} ký hiệu, không thể xoá. Hãy tạm ẩn hoặc xoá các ký hiệu trước.`);
      return;
    }

    this.http.delete(`${this.API}/${topic.topicId}`).subscribe({
      next: () => {
        this.message.success('Đã xoá chủ đề');
        this.fetchTopics();
      },
      error: (err) => this.message.error(err?.error?.message || 'Lỗi xoá')
    });
  }

  trackById(_: number, item: AdminTopic): number {
    return item.topicId;
  }
}
