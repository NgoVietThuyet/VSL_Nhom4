import { BaseFilter } from '../../../shared/models';
import { DocumentListTabKey, DocumentProcessingStatusCode } from './tk.constants';

export class TaskDocumentDto extends BaseFilter {
  id: string = '';
  documentNumber: string = '';
  documentSymbol: string = '';
  subject: string = '';
  contentSummary: string = '';
  documentTypeId: string = '';
  fieldId: string = '';
  urgencyLevelId: string = '';
  confidentialityLevelId: string = '';
  issuedDate: string | null = null;
  effectiveDate: string | null = null;
  expirationDate: string | null = null;
  issuerOrganizationId: string = '';
  recipientOrganizations: string = '';
  originalFileId: string = '';
  referenceFileId: string = '';
  attachmentFileIds: string[] = [];
  /** ProcessingStatus (0..2) — thay cho `status` cũ. */
  processingStatus: number = DocumentProcessingStatusCode.NotProcessed;
  lastStatusChangedAt: string | null = null;
  createDate: string | null = null;
  createBy: string = '';
  taskTotalCount = 0;
  taskUndispatchedCount = 0;
  isManual = false;
  leaderUsername: string = '';
  signerUsername: string = '';
  documentListTab: DocumentListTab = DocumentListTabKey.InProgress;
  isManualFilter?: boolean;
  filterProcessingStatus?: number;
}

export type DocumentListTab =
  | typeof DocumentListTabKey.NotProcessed
  | typeof DocumentListTabKey.InProgress
  | typeof DocumentListTabKey.Completed;

export const DOCUMENT_LIST_TABS: { key: DocumentListTab; label: string; icon: string }[] = [
  { key: DocumentListTabKey.InProgress, label: 'ĐANG XỬ LÝ', icon: 'sync' },
  { key: DocumentListTabKey.Completed, label: 'HOÀN THÀNH', icon: 'check-circle' },
];

export const CREATE_LIST_TABS: { key: DocumentListTab; label: string; icon: string }[] = [
  { key: DocumentListTabKey.InProgress, label: 'ĐANG XỬ LÝ', icon: 'sync' },
  { key: DocumentListTabKey.Completed, label: 'HOÀN THÀNH', icon: 'check-circle' },
];
