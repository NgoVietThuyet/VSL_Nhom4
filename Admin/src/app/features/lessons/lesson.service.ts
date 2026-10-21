import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../../core/config/api.config';

export interface AdminTopicDetail {
  topicId: number;
  name: string;
  emoji: string;
  level: string;
  category: string;
  description?: string;
  isActive: boolean;
  signsCount: number;
  lessonsCount: number;
  activeLessonsCount: number;
  lessonsWithVideoCount: number;
  unassignedSignsCount: number;
}

export interface AdminLesson {
  lessonId: number;
  topicId: number;
  title: string;
  description?: string;
  objectives?: string;
  videoUrl?: string;
  videoThumb?: string;
  duration?: string;
  difficulty: number;
  estimatedMinutes?: number;
  displayOrder?: number;
  isActive: boolean;
  signsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonSign {
  signId: number;
  nameVi: string;
  contentType?: string;
  duration?: string;
  videoUrl?: string;
  videoThumb?: string;
  difficulty: number;
  isActive: boolean;
  displayOrder?: number;
}

export interface AdminLessonDetail extends AdminLesson {
  topicName: string;
  topicEmoji: string;
  signs: LessonSign[];
  unassignedSigns: LessonSign[];
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly ADMIN = API_BASE + '/admin';

  constructor(private http: HttpClient) {}

  getTopic(topicId: number): Observable<AdminTopicDetail> {
    return this.http.get<ApiResponse<AdminTopicDetail>>(`${this.ADMIN}/topics/${topicId}`).pipe(map(r => r.data));
  }

  listLessons(topicId: number): Observable<AdminLesson[]> {
    return this.http.get<ApiResponse<AdminLesson[]>>(`${this.ADMIN}/topics/${topicId}/lessons`).pipe(map(r => r.data || []));
  }

  createLesson(topicId: number, body: Partial<AdminLesson>): Observable<AdminLesson> {
    return this.http.post<ApiResponse<AdminLesson>>(`${this.ADMIN}/topics/${topicId}/lessons`, body).pipe(map(r => r.data));
  }

  reorderLessons(topicId: number, ids: number[]): Observable<unknown> {
    return this.http.put(`${this.ADMIN}/topics/${topicId}/lessons/order`, { ids });
  }

  getLesson(lessonId: number): Observable<AdminLessonDetail> {
    return this.http.get<ApiResponse<AdminLessonDetail>>(`${this.ADMIN}/lessons/${lessonId}`).pipe(map(r => r.data));
  }

  updateLesson(lessonId: number, body: Partial<AdminLesson>): Observable<AdminLesson> {
    return this.http.put<ApiResponse<AdminLesson>>(`${this.ADMIN}/lessons/${lessonId}`, body).pipe(map(r => r.data));
  }

  toggleLesson(lessonId: number): Observable<unknown> {
    return this.http.patch(`${this.ADMIN}/lessons/${lessonId}/status`, {});
  }

  deleteLesson(lessonId: number): Observable<unknown> {
    return this.http.delete(`${this.ADMIN}/lessons/${lessonId}`);
  }

  /** Đặt danh sách ký hiệu (đúng thứ tự) cho bài học; ký hiệu không có trong danh sách bị gỡ ra. */
  setLessonSigns(lessonId: number, ids: number[]): Observable<LessonSign[]> {
    return this.http.put<ApiResponse<LessonSign[]>>(`${this.ADMIN}/lessons/${lessonId}/signs`, { ids }).pipe(map(r => r.data || []));
  }

  /** Upload video / ảnh bìa, trả về các HttpEvent để theo dõi tiến trình. */
  upload(file: File, kind: 'video' | 'image'): Observable<HttpEvent<ApiResponse<{ url: string }>>> {
    const form = new FormData();
    form.append('file', file);
    const req = new HttpRequest('POST', `${this.ADMIN}/files/upload?kind=${kind}`, form, { reportProgress: true });
    return this.http.request<ApiResponse<{ url: string }>>(req);
  }

  /** Xoá file đã upload nhưng không dùng nữa (VD: admin huỷ form). */
  deleteUploaded(url: string): Observable<unknown> {
    return this.http.delete(`${this.ADMIN}/files`, { params: { url } });
  }
}
