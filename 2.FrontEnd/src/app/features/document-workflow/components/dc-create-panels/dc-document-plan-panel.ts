import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DcPlanTreeComponent } from '../dc-plan-tree/dc-plan-tree.component';

import { DcPlanSelection } from '../../models/document-tree-plan.model';



@Component({

  selector: 'app-dc-document-plan-panel',

  standalone: true,

  imports: [DcPlanTreeComponent],

  template: `

    <app-dc-plan-tree

      [phanLoai]="model.phanLoai"

      [rootOrgId]="model.organizationId"

      [deXuatLanhDaoXuLy]="model.deXuatLanhDaoXuLy"

      (phanLoaiChange)="onPhanLoaiChange($event)"

      (deXuatLanhDaoChange)="onDeXuatChange($event)"

      (selectionChange)="selectionChange.emit($event)">

    </app-dc-plan-tree>

  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: flex; flex: 1; min-height: 0; height: 100%; width: 100%; }`],
})

export class DcDocumentPlanPanel {

  @Input() model: any = {};

  @Output() selectionChange = new EventEmitter<DcPlanSelection>();



  onPhanLoaiChange(value: number | null): void {

    this.model.phanLoai = value;

    if (value == null) {

      this.model.deXuatLanhDaoXuLy = null;

    }

  }



  onDeXuatChange(value: string | null): void {

    this.model.deXuatLanhDaoXuLy = value;

  }

}

