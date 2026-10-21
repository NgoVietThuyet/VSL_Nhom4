import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { TaskListFilterMode } from './task-list-filter-panel';

@Component({
  selector: 'app-task-list-inline-filters',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './task-list-inline-filters.html',
  styleUrl: './task-list-inline-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListInlineFilters implements OnInit, OnDestroy {
  @Input() mode: TaskListFilterMode = 'task';
  @Input() colFilter: Record<string, any> = {};
  @Input() keyWord = '';
  @Input() organizes: any[] = [];
  @Input() mainTasks: any[] = [];
  @Input() documentTypes: any[] = [];

  @Output() filterChange = new EventEmitter<void>();
  @Output() keyWordChange = new EventEmitter<string>();
  @Output() keyWordEnter = new EventEmitter<void>();

  private readonly filterSubject$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filterSubject$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.filterChange.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChange(): void {
    this.filterSubject$.next();
  }

  onEnter(): void {
    this.filterChange.emit();
  }

  onKeyWordChange(v: string): void {
    this.keyWord = v;
    this.keyWordChange.emit(v);
  }

  onKeyWordKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.keyWordEnter.emit();
    }
  }
}
