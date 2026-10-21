import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import {
  ProposalFilterDto,
  TaskApprovalDto,
  TaskApproveExtendDto,
  TaskProposalDto,
} from '../models';

@Injectable({ providedIn: 'root' })
export class TaskWorkflowService {
  constructor(private common: CommonService) {}

  // ─── PROPOSE (đơn vị chủ trì) ────────────────────────────────────
  proposeComplete(dto: TaskProposalDto) {
    return this.common.post('TaskWorkflow/ProposeComplete', dto);
  }
  proposeExtend(dto: TaskProposalDto) {
    return this.common.post('TaskWorkflow/ProposeExtend', dto);
  }
  proposePause(dto: TaskProposalDto) {
    return this.common.post('TaskWorkflow/ProposePause', dto);
  }
  proposeStop(dto: TaskProposalDto) {
    return this.common.post('TaskWorkflow/ProposeStop', dto);
  }

  // ─── APPROVE / REJECT (lãnh đạo đơn vị giao) ────────────────────
  approveComplete(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/ApproveComplete', dto);
  }
  rejectComplete(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/RejectComplete', dto);
  }
  /** Phê duyệt gia hạn — dto.useProposedDate quyết định sub-type. */
  approveExtend(dto: TaskApproveExtendDto) {
    return this.common.post('TaskWorkflow/ApproveExtend', dto);
  }
  rejectExtend(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/RejectExtend', dto);
  }
  approvePause(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/ApprovePause', dto);
  }
  rejectPause(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/RejectPause', dto);
  }
  approveStop(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/ApproveStop', dto);
  }
  rejectStop(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/RejectStop', dto);
  }
  resume(dto: TaskApprovalDto) {
    return this.common.post('TaskWorkflow/Resume', dto);
  }

  // ─── QUERY ───────────────────────────────────────────────────────
  pendingProposals(filter: ProposalFilterDto) {
    return this.common.get('TaskWorkflow/PendingProposals', filter);
  }
  approvedProposals(filter: ProposalFilterDto) {
    return this.common.get('TaskWorkflow/ApprovedProposals', filter);
  }
  historyByTask(taskId: string) {
    return this.common.get(`TaskWorkflow/HistoryByTask/${taskId}`, {});
  }
  historyByEntity(entityType: string, entityId: string) {
    return this.common.get(`TaskWorkflow/HistoryByEntity/${entityType}/${entityId}`, {});
  }
}
