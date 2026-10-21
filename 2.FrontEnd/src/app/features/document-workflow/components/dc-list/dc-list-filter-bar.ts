import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { DocumentBaseFilter } from '../../models';

@Component({
  selector: 'app-dc-list-filter-bar',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-list-filter-bar.html',
  styleUrl: './dc-list-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcListFilterBar {
  @Input() filter: DocumentBaseFilter = {};
  @Input() keywordPlaceholder = 'Tìm kiếm nhanh...';
  @Input() showPhanLoaiFilter = true;
  @Input() phanLoaiOptions: { value: number; label: string }[] = [];
  @Input() documentFields: { code: string; name: string }[] = [];
  @Input() securityLevels: { code: string; name: string }[] = [];

  @Output() search = new EventEmitter<void>();
}
