import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';
import { initials } from '../../shared/labels';

interface ConfigField {
  key: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {
  private readonly HEALTH_API = API_BASE + '/admin/system/health';
  private readonly CONFIG_API = API_BASE + '/admin/system/config';
  private readonly ADMINS_API = API_BASE + '/admin/system/admins';

  /** Mô tả các tham số. Giá trị và danh sách khoá đang áp dụng lấy từ máy chủ. */
  readonly configFields: ConfigField[] = [
    { key: 'aiConfidenceThreshold', label: 'Ngưỡng độ tin cậy AI chấp nhận', min: 0.5, max: 1, step: 0.01,
      hint: 'Từ 0.5 đến 1. Dưới ngưỡng này lượt nhận diện bị tính là chưa đạt.' },
    { key: 'framesPerPrediction', label: 'Số khung hình mỗi lần dự đoán', min: 1, max: 120, step: 1,
      hint: 'Ví dụ 30 khung hình ≈ 1 giây video ở 30 FPS.' },
    { key: 'xpPerMastery', label: 'XP khi luyện đúng 1 ký hiệu', min: 0, max: 1000, step: 5,
      hint: 'Số XP cộng cho học viên mỗi lần luyện AI được chấm đúng.' },
    { key: 'xpPerQuizCorrect', label: 'XP mỗi câu Quiz đúng', min: 0, max: 1000, step: 5,
      hint: 'Số XP cộng cho mỗi câu trả lời đúng khi kết quả Quiz được gửi về máy chủ.' },
  ];

  health: any = null;
  healthError = false;
  checking = false;
  config: any = {};
  appliedKeys: string[] = [];
  admins: any[] = [];
  saving = false;

  readonly initials = initials;

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.fetchHealth();
    this.fetchConfig();
    this.fetchAdmins();
  }

  fetchHealth(): void {
    this.checking = true;
    this.http.get<{ data: any }>(this.HEALTH_API).subscribe({
      next: (res) => {
        this.health = res.data;
        this.healthError = false;
        this.checking = false;
      },
      error: () => {
        this.health = null;
        this.healthError = true;
        this.checking = false;
      }
    });
  }

  fetchConfig(): void {
    this.http.get<{ data: any }>(this.CONFIG_API).subscribe({
      next: (res) => this.applyConfig(res.data)
    });
  }

  fetchAdmins(): void {
    this.http.get<{ data: any[] }>(this.ADMINS_API).subscribe({
      next: (res) => this.admins = res.data || []
    });
  }

  isApplied(key: string): boolean {
    return this.appliedKeys.includes(key);
  }

  saveConfig(): void {
    this.saving = true;
    const payload: Record<string, unknown> = {};
    this.configFields.forEach(f => payload[f.key] = this.config[f.key]);
    this.http.put<{ data: any }>(this.CONFIG_API, payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.applyConfig(res.data);
        this.message.success('Đã lưu cấu hình hệ thống');
      },
      error: () => {
        this.saving = false;
        this.message.error('Lỗi cập nhật cấu hình');
      }
    });
  }

  get jvmPercent(): number {
    if (!this.health?.jvmTotalMemoryMb) return 0;
    return Math.round((this.health.jvmUsedMemoryMb / this.health.jvmTotalMemoryMb) * 100);
  }

  private applyConfig(data: any): void {
    const { appliedKeys, ...values } = data || {};
    this.config = values;
    this.appliedKeys = Array.isArray(appliedKeys) ? appliedKeys : [];
  }
}
