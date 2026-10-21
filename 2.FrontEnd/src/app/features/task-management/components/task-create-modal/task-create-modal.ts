import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, inject,
} from '@angular/core';
import { TaskEditModal } from '../task-edit-modal/task-edit-modal';
import { emptyExtractedTask, ExtractedTask } from '../../models/task-document-drawer.model';

@Component({
  selector: 'app-task-create-modal',
  standalone: true,
  imports: [TaskEditModal],
  template: `
    <app-task-edit-modal
      [(visible)]="visible"
      [isCreateMode]="true"
      [task]="draftTask"
      [mainTasks]="mainTasks"
      [organizes]="organizes"
      [userOrgIds]="userOrgIds"
      [taskPriorities]="taskPriorities"
      [documentFields]="documentFields"
      [issuingOrgs]="issuingOrgs"
      (visibleChange)="onVisibleChange($event)"
      (save)="onSave($event)">
    </app-task-edit-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreateModal {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() mainTasks: any[] = [];
  @Input() organizes: any[] = [];
  @Input() userOrgIds: string[] = [];
  @Input() taskPriorities: any[] = [];
  @Input() documentFields: any[] = [];
  @Input() issuingOrgs: any[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ExtractedTask>();

  draftTask: ExtractedTask = emptyExtractedTask(1);

  open(nextOrder = 1): void {
    this.draftTask = emptyExtractedTask(nextOrder);
    this.visible = true;
    this.visibleChange.emit(true);
    this.cdr.markForCheck();
  }

  openWithDefaults(nextOrder = 1, defaults: Partial<ExtractedTask> = {}): void {
    this.draftTask = { ...emptyExtractedTask(nextOrder), ...defaults };
    this.visible = true;
    this.visibleChange.emit(true);
    this.cdr.markForCheck();
  }

  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.visibleChange.emit(v);
    this.cdr.markForCheck();
  }

  onSave(task: ExtractedTask): void {
    this.save.emit(task);
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }
}
