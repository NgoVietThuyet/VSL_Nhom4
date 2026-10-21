import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmRecruitmentService } from '../../services';
import { HrmRecruitmentPositionDto, HrmCandidateDto, HrmInterviewDto } from '../../models';

import { NzMessageService } from 'ng-zorro-antd/message';
import { OrganizeService } from '../../../master-data/services/organize.service';
@Component({
  selector: 'app-hrm-recruitment',
  imports: [SharedModules],
  templateUrl: './hrm-recruitment.html',
  styleUrls: ['./hrm-recruitment.scss']
})
export class HrmRecruitment implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visiblePos = false;
  visibleCand = false;
  visibleCandList = false;
  isEditPos = false;
  isEditCand = false;
  positions: PaginationResult = new PaginationResult();
  candidates: any[] = [];
  organizes: any[] = [];
  posDto: HrmRecruitmentPositionDto = new HrmRecruitmentPositionDto();
  candDto: HrmCandidateDto = new HrmCandidateDto();
  posFilter: HrmRecruitmentPositionDto = new HrmRecruitmentPositionDto();
  selectedPositionId: string = '';
  selectedPositionTitle: string = '';
  stages = [
    { value: 'NEW', label: 'Mới', color: 'default' },
    { value: 'SCREENING', label: 'Sàng lọc', color: 'processing' },
    { value: 'INTERVIEW', label: 'Phỏng vấn', color: 'blue' },
    { value: 'OFFER', label: 'Đề xuất', color: 'orange' },
    { value: 'HIRED', label: 'Đã tuyển', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' }
  ];
  posStatuses = [
    { value: 'OPEN', label: 'Đang tuyển', color: 'processing' },
    { value: 'CLOSED', label: 'Đã đóng', color: 'default' },
    { value: 'FILLED', label: 'Đã tuyển đủ', color: 'green' }
  ];

  constructor(
    private global: GlobalService,
    private service: HrmRecruitmentService,
    private message: NzMessageService,
    private orgService: OrganizeService
  ) {
    this.global.setBreadcrumb([{ name: 'Tuyển dụng', path: 'hrm/recruitment' }]);
  }

  ngOnInit(): void {
    this.searchPositions();
    this.loadOrganizes();
  }

  loadOrganizes() {
    this.orgService.search({ pageSize: 999 } as any).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.organizes = res.data || [] });
  }

  searchPositions() {
    this.service.searchPositions(this.posFilter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.positions = res;
      }
    });
  }

  pageIndexChange(index: number) {
    this.posFilter.currentPage = index;
    this.searchPositions();
  }

  pageSizeChange(size: number) {
    this.posFilter.pageSize = size;
    this.posFilter.currentPage = 1;
    this.searchPositions();
  }

  selectPosition(item: any) {
    this.selectedPositionId = item.id;
    this.selectedPositionTitle = item.title;
    const f = new HrmCandidateDto();
    f.positionId = item.id;
    this.service.searchCandidates(f).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.candidates = res?.data || [];
        this.visibleCandList = true;
      }
    });
  }

  closeCandList() {
    this.visibleCandList = false;
    this.selectedPositionId = '';
  }

  trackById(_: number, item: any) { return item.id; }
  stageInfo(s: string) { return this.stages.find(x => x.value === s) || { label: s, color: 'default' }; }
  posStatusInfo(s: string) { return this.posStatuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  openPos(item: any, isEdit: boolean) {
    this.isEditPos = isEdit;
    this.posDto = isEdit && item ? { ...new HrmRecruitmentPositionDto(), ...item } : new HrmRecruitmentPositionDto();
    this.visiblePos = true;
  }

  closePos() { this.visiblePos = false; }

  savePos() {
    if (!this.posDto.code || !this.posDto.title || !this.posDto.organizeId || !this.posDto.deadline || !this.posDto.quantity) {
      this.message.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    const action = this.isEditPos ? 'updatePosition' : 'insertPosition';
    this.service[action](this.posDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.searchPositions();
          this.closePos();
        }
      },
      error: (err) => { }
    });
  }

  deletePos(item: any) {
    this.service.deletePosition(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.searchPositions();
        if (this.selectedPositionId === item.id) {
          this.selectedPositionId = '';
          this.candidates = [];
        }
      }
    });
  }

  openCand(item?: any, isEdit: boolean = false) {
    this.isEditCand = isEdit;
    if (isEdit && item) {
      this.candDto = { ...new HrmCandidateDto(), ...item };
    } else {
      this.candDto = new HrmCandidateDto();
      this.candDto.positionId = this.selectedPositionId;
      this.candDto.stage = 'NEW';
    }
    this.visibleCand = true;
  }

  closeCand() { this.visibleCand = false; }

  saveCand() {
    if (!this.candDto.fullName || !this.candDto.email || !this.candDto.phone) {
      this.message.error('Vui lòng điền đầy đủ thông tin liên hệ của ứng viên');
      return;
    }
    const action = this.isEditCand ? 'updateCandidate' : 'insertCandidate';
    if (this.candDto.stage === 'HIRED') {
      this.message.error('Không thể cập nhật hồ sơ đã được tuyển dụng');
      return;
    }
    this.service[action](this.candDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.searchPositions();
          this.selectPosition({ id: this.selectedPositionId, title: this.selectedPositionTitle });
          this.closeCand();
        }
      },
      error: (err) => { }
    });
  }

  convert(item: any) {
    const hiredCount = (this.candidates || []).filter(c => c.stage === 'HIRED').length;
    const pos = (this.positions.data || []).find((p: any) => p.id === this.selectedPositionId);

    if (pos && pos.quantity > 0 && hiredCount >= pos.quantity) {
      this.message.error('Vị trí tuyển dụng này đã tuyển đủ số lượng chỉ tiêu.');
      return;
    }

    this.service.convertToEmployee(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.searchPositions();
        this.selectPosition({ id: this.selectedPositionId, title: this.selectedPositionTitle });
      }
    });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.searchPositions(); }
  }

  reset() { this.posFilter = new HrmRecruitmentPositionDto(); this.searchPositions(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
