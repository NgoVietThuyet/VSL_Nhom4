import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import {
  DocumentIncomingPhieu,
  DocumentOutgoingPhieu,
  LOAI_PHIEU_DEN_LABELS,
  LoaiPhieuVanBanDen,
} from '../../models';

@Component({
  selector: 'app-dc-document-phieu-panel',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dc-document-phieu-panel.html',
  styleUrls: ['./dc-document-phieu-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcDocumentPhieuPanel implements OnChanges {
  @Input() mode: 'incoming' | 'outgoing' = 'incoming';
  @Input() documentId = '';
  @Input() canEdit = false;
  @Input() incomingItems: DocumentIncomingPhieu[] = [];
  @Input() outgoingItems: DocumentOutgoingPhieu[] = [];
  @Output() saveRequested = new EventEmitter<void>();

  readonly loaiPhieuOptions = Object.entries(LOAI_PHIEU_DEN_LABELS).map(([v, l]) => ({ value: +v, label: l }));

  localIncoming: DocumentIncomingPhieu[] = [];
  localOutgoing: DocumentOutgoingPhieu[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incomingItems']) this.localIncoming = [...(this.incomingItems ?? [])];
    if (changes['outgoingItems']) this.localOutgoing = [...(this.outgoingItems ?? [])];
  }

  get items(): DocumentIncomingPhieu[] | DocumentOutgoingPhieu[] {
    return this.mode === 'incoming' ? this.localIncoming : this.localOutgoing;
  }

  addIncoming(): void {
    this.localIncoming = [
      ...this.localIncoming,
      { tieuDe: '', loaiPhieuId: LoaiPhieuVanBanDen.PhieuTrinh, notes: '' },
    ];
    this.cdr.markForCheck();
  }

  addOutgoing(isToTrinh: boolean): void {
    this.localOutgoing = [
      ...this.localOutgoing,
      { tieuDe: '', isToTrinh, isDuThao: !isToTrinh, notes: '' },
    ];
    this.cdr.markForCheck();
  }

  removeIncoming(index: number): void {
    this.localIncoming = this.localIncoming.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  removeOutgoing(index: number): void {
    this.localOutgoing = this.localOutgoing.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  loaiPhieuLabel(id?: number | null): string {
    if (id == null) return '';
    return LOAI_PHIEU_DEN_LABELS[id] ?? String(id);
  }

  emitSave(): void {
    this.saveRequested.emit();
  }

  getPayload(): DocumentIncomingPhieu[] | DocumentOutgoingPhieu[] {
    return this.mode === 'incoming' ? this.localIncoming : this.localOutgoing;
  }
}
