import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { DocumentTreePlanNode } from '../../models/document-tree-plan.model';

@Component({
  selector: 'app-dc-plan-preview-table',
  standalone: true,
  imports: [SharedModules],
  template: `
    <nz-table *ngIf="rows.length > 0" nzSize="small" [nzData]="rows" nzBordered
      [nzFrontPagination]="false" [nzShowPagination]="false">
      <thead>
        <tr>
          <th nzAlign="center" nzWidth="40px"></th>
          <th>Cá nhân | Đơn vị</th>
          <th nzAlign="center" nzWidth="200px">Vai trò</th>
          <th nzAlign="center" nzWidth="80px" *ngIf="editable">Bỏ chọn</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of rows; trackBy: trackRow">
          <td nzAlign="center">
            <nz-icon *ngIf="item.type === 'USER' || item.type === 'ORG'"
              [nzType]="item.type === 'USER' ? 'user' : 'home'"
              [style.color]="item.type === 'USER' ? '#378a00' : '#1890ff'" />
          </td>
          <td>{{ item.name }}</td>
          <td nzAlign="center">
            <ng-container *ngIf="item.isXuLyChinh && item.isChuTri && item.isLanhDao">
              <nz-tag nzColor="default">Chủ trì</nz-tag>
              <nz-tag nzColor="success">Chỉ đạo</nz-tag>
            </ng-container>
            <ng-container *ngIf="item.isXuLyChinh && item.isChuTri && !item.isLanhDao">
              <nz-tag nzColor="default">Chủ trì</nz-tag>
              <nz-tag nzColor="processing">Xử lý chính</nz-tag>
            </ng-container>
            <ng-container *ngIf="item.isXuLyChinh && !item.isChuTri">
              <nz-tag [nzColor]="item.isLanhDao ? 'success' : 'processing'">
                {{ item.isLanhDao ? 'Chỉ đạo' : 'Xử lý chính' }}
              </nz-tag>
            </ng-container>
            <nz-tag *ngIf="item.isPhoiHop" nzColor="error">Phối hợp</nz-tag>
            <nz-tag *ngIf="item.isNhanDeBiet" nzColor="warning">Nhận để biết</nz-tag>
          </td>
          <td nzAlign="center" *ngIf="editable">
            <button nz-button nzDanger class="btn-icon" type="button" (click)="remove.emit(item)">
              <nz-icon nzType="minus" nzTheme="outline" />
            </button>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DcPlanPreviewTable {
  @Input() rows: DocumentTreePlanNode[] = [];
  @Input() editable = false;
  @Output() remove = new EventEmitter<DocumentTreePlanNode>();
  trackRow = (_: number, x: DocumentTreePlanNode) => x.id;
}
