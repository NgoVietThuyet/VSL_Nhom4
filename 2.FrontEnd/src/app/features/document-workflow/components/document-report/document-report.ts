import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-document-report',
  standalone: true,
  imports: [SharedModules],
  template: `
    <div class="dc-report-page">
      <h2><nz-icon nzType="bar-chart" nzTheme="outline" /> Báo cáo văn bản</h2>
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="Đang phát triển"
        nzDescription="Báo cáo thống kê VB đến/đi (tra cứu, xuất Excel) sẽ bổ sung theo API ThongKeThongTinQuanLy của QLVB. Xem ma trận gap tại 0.Documents/DC/DC_QLVB_GAP_MATRIX.md." />
      <nz-tabset class="dc-report-tabs">
        <nz-tab nzTitle="Văn bản đến">
          <nz-empty nzNotFoundContent="Chưa có API báo cáo VB đến"></nz-empty>
        </nz-tab>
        <nz-tab nzTitle="Văn bản đi">
          <nz-empty nzNotFoundContent="Chưa có API báo cáo VB đi"></nz-empty>
        </nz-tab>
      </nz-tabset>
    </div>
  `,
  styles: [`
    .dc-report-page { padding: 16px 20px; }
    h2 { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .dc-report-tabs { margin-top: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentReport {}
