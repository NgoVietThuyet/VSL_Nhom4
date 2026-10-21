import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { SharedModules } from '../../../../shared/ng-zorro.module';

import { LoaiVanBanBo } from '../../models';

import { DcPlanSelection, DocumentTreePlanNode } from '../../models/document-tree-plan.model';

import { DcPlanPreviewTable } from './dc-plan-preview-table';



interface LeaderOption {

  userName: string;

  fullName: string;

}



@Component({

  selector: 'app-dc-document-opinion-panel',

  standalone: true,

  imports: [SharedModules, DcPlanPreviewTable],

  templateUrl: './dc-document-opinion-panel.html',

  styleUrls: ['./dc-create-panels.scss', '../../styles/dc-plan-tree.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; width: 100%; min-height: min-content; }`],
})

export class DcDocumentOpinionPanel implements OnInit, OnChanges {

  @Input() model: any = {};

  @Input() planSelection: DcPlanSelection | null = null;



  readonly maxYKienLength = 1000;

  leaderOptions: LeaderOption[] = [];

  planPreviewRows: DocumentTreePlanNode[] = [];

  hideOpinionBlock = false;

  yKienLength = 0;

  isYKienLimitReached = false;



  constructor(private cdr: ChangeDetectorRef) {}



  ngOnInit(): void {
    this.syncFromPlan();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['planSelection'] || changes['model']) {
      this.syncFromPlan();
    }
  }



  onYKienChange(): void {

    const text = this.model.xinYKienText ?? '';

    this.yKienLength = text.length;

    this.isYKienLimitReached = this.yKienLength >= this.maxYKienLength;

    this.cdr.markForCheck();

  }



  selectLeader(username: string): void {

    this.model.leaderUsername = this.model.leaderUsername === username ? '' : username;

    this.cdr.markForCheck();

  }



  private syncFromPlan(): void {

    const preview = this.planSelection?.planPreview ?? [];

    this.planPreviewRows = preview.filter(x => !x.isNotCreatePlan);

    this.hideOpinionBlock = this.model.phanLoai === LoaiVanBanBo.VbChuyenTiep;

    this.leaderOptions = preview

      .filter(x => x.type === 'USER' && x.isLanhDao)

      .map(x => ({ userName: x.id, fullName: x.name ?? x.id }));

    if (!this.model.leaderUsername && this.leaderOptions.length === 1) {

      this.model.leaderUsername = this.leaderOptions[0].userName;

    }

    this.onYKienChange();

    this.cdr.markForCheck();

  }



  trackLeader = (_: number, x: LeaderOption) => x.userName;

}

