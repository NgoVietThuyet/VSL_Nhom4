import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { DcOption } from '../../services/dc-master-data.service';
import {
  CAP_XU_LY_LABELS,
  KIEU_VAN_BAN_LABELS,
  PHAN_LOAI_LABELS,
} from '../../models';

@Component({
  selector: 'app-dc-document-form',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-document-form.html',
  styleUrls: ['./dc-document-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcDocumentForm {
  @Input() mode: 'incoming' | 'outgoing' = 'incoming';
  @Input() model: any = {};
  @Input() canEdit = true;

  @Input() docTypeOptions: DcOption[] = [];
  @Input() fieldOptions: DcOption[] = [];
  @Input() urgencyOptions: DcOption[] = [];
  @Input() securityOptions: DcOption[] = [];
  @Input() organizeOptions: DcOption[] = [];
  @Input() issuingOrgOptions: DcOption[] = [];
  @Input() bookOptions: DcOption[] = [];
  @Input() showBookField = false;

  readonly phanLoaiOptions = Object.entries(PHAN_LOAI_LABELS).map(([v, l]) => ({ value: +v, label: l }));
  readonly capXuLyOptions = Object.entries(CAP_XU_LY_LABELS).map(([v, l]) => ({ value: +v, label: l }));
  readonly kieuVanBanOptions = Object.entries(KIEU_VAN_BAN_LABELS).map(([v, l]) => ({ value: +v, label: l }));
}
