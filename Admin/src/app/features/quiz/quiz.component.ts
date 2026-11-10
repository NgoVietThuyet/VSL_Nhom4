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
  private readonly QUESTIONS_API = API_BASE + '/admin/quiz/questions';

  overview: any = null;
  attempts: any[] = [];
  topics: any[] = [];
  sampleQuestions: any[] = [];
  loading = false;
  selectedTopicId: number | null = null;

  pageIndex = 1;
  pageSize = 10;

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.fetchOverview();
    this.fetchTopics();
    this.fetchAttempts();
    this.fetchQuestions();
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

  fetchQuestions(): void {
    let url = this.QUESTIONS_API;
    if (this.selectedTopicId != null) {
      url += `?topicId=${this.selectedTopicId}`;
    }
    this.http.get<{ data: any[] }>(url).subscribe({
      next: (res) => this.sampleQuestions = res.data || []
    });
  }

  onTopicChange(): void {
    this.fetchAttempts();
    this.fetchQuestions();
  }

  refresh(): void {
    this.fetchOverview();
    this.fetchAttempts();
    this.fetchQuestions();
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
