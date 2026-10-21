import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import {
  ASSIGNMENT_STATUS_LABELS,
  DOCUMENT_PROCESSING_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../../models';

export type TaskListFilterMode = 'task' | 'document';

@Component({
  selector: 'app-task-list-filter-panel',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './task-list-filter-panel.html',
  styleUrl: './task-list-filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListFilterPanel {
  private readonly cdr = inject(ChangeDetectorRef);
  visible = false;
  @Input() mode: TaskListFilterMode = 'task';
  @Input() colFilter: Record<string, any> = {};
  @Input() organizes: any[] = [];
  @Input() mainTasks: any[] = [];
  @Input() taskPriorities: any[] = [];
  @Input() documentFields: any[] = [];
  @Input() documentTypes: any[] = [];
  @Input() urgencyLevels: any[] = [];
  @Input() securityLevels: any[] = [];
  /** Khi set (vd. DC văn bản đến/đi), thay cho documentStatusOptions mặc định TK. */
  @Input() trangThaiFilterOptions: { value: number; label: string }[] | null = null;

  @Output() apply = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  readonly taskStatusOptions = Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  readonly assignmentStatusOptions = Object.entries(ASSIGNMENT_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  readonly documentStatusOptions = Object.entries(DOCUMENT_PROCESSING_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));

  get documentStatusFilterOptions(): { value: number; label: string }[] {
    return this.trangThaiFilterOptions?.length ? this.trangThaiFilterOptions : this.documentStatusOptions;
  }

  close(): void {
    this.visible = false;
    this.cdr.markForCheck();
  }

  onApply(): void {
    this.apply.emit();
    this.close();
  }

  onReset(): void {
    this.reset.emit();
  }
}
