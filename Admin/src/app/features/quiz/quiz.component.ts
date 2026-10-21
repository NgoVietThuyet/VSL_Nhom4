import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {
  private readonly OVERVIEW_API = API_BASE + '/admin/quiz/overview';
  private readonly ATTEMPTS_API = API_BASE + '/admin/quiz/attempts';
  private readonly TOPICS_API = API_BASE + '/admin/topics';

  overview: any = null;
  attempts: any[] = [];
  topics: any[] = [];
  loading = false;
  selectedTopicId: number | null = null;

  pageIndex = 1;
  pageSize = 10;

  // Danh sách câu hỏi trắc nghiệm mẫu của hệ thống
  sampleQuestions = [
    {
      id: 1,
      topicName: 'Chào hỏi & Xã giao',
      question: 'Cử chỉ đưa bàn tay phải lên ngang tầm mắt và vẫy nhẹ từ trái qua phải là ký hiệu của từ nào?',
      options: ['A. Cảm ơn', 'B. Xin chào', 'C. Tạm biệt', 'D. Xin lỗi'],
      correctAnswer: 'B. Xin chào',
      explanation: 'Đây là động tác vẫy tay chào mở đầu thân thiện cơ bản trong VSL.'
    },
    {
      id: 2,
      topicName: 'Chào hỏi & Xã giao',
      question: 'Động tác chạm đầu ngón tay vào dưới cằm rồi đưa nhẹ về phía trước mang ý nghĩa gì?',
      options: ['A. Tạm biệt', 'B. Xin lỗi', 'C. Cảm ơn', 'D. Chúc may mắn'],
      correctAnswer: 'C. Cảm ơn',
      explanation: 'Cử chỉ xuất phát từ trái tim và lời nói gửi sự biết ơn chân thành.'
    },
    {
      id: 3,
      topicName: 'Chào hỏi & Xã giao',
      question: 'Khi thực hiện ký hiệu "Xin lỗi", nét mặt người học cần biểu lộ thế nào?',
      options: ['A. Cười lớn', 'B. Nghiêm nghị', 'C. Hối lỗi và chân thành', 'D. Không cần nét mặt'],
      correctAnswer: 'C. Hối lỗi và chân thành',
      explanation: 'Nét mặt biểu cảm đóng vai trò quyết định cảm xúc và ngữ pháp trong giao tiếp ký hiệu.'
    }
  ];

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.fetchOverview();
    this.fetchTopics();
    this.fetchAttempts();
  }

  fetchOverview(): void {
    this.http.get<{ data: any }>(this.OVERVIEW_API).subscribe({
      next: (res) => this.overview = res.data
    });
  }

  fetchTopics(): void {
    this.http.get<{ data: any[] }>(this.TOPICS_API).subscribe({
      next: (res) => this.topics = res.data || []
    });
  }

  fetchAttempts(): void {
    this.loading = true;
    this.pageIndex = 1;
    let url = this.ATTEMPTS_API;
    if (this.selectedTopicId != null) {
      url += `?topicId=${this.selectedTopicId}`;
    }

    this.http.get<{ data: any[] }>(url).subscribe({
      next: (res) => {
        this.attempts = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải lịch sử làm bài');
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.fetchOverview();
    this.fetchAttempts();
  }

  initials(name?: string): string {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}
