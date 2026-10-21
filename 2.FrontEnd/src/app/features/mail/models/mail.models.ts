export interface MailRecipientDto {
  id?: string;
  mailMessageId?: string;
  email?: string;
  type?: string;
}

export interface MailAttachmentDto {
  id?: string;
  mailMessageId?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
}

export interface MailMessageLabelDto {
  id?: string;
  mailMessageId?: string;
  mailLabelId?: string;
}

export interface MailMessageDto {
  isActive?: boolean;
  currentPage?: number;
  pageSize?: number;
  keyWord?: string;
  isPaging?: boolean;
  id?: string;
  userId?: string;
  fromName?: string;
  fromEmail?: string;
  subject?: string;
  body?: string;
  preview?: string;
  date?: string;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachment?: boolean;
  folder?: string;
  status?: string;
  sentAt?: string;
  retryCount?: number;
  errorMessage?: string;
  providerMessageId?: string;
  mailType?: string;
  isDeleted?: boolean;
  recipients?: MailRecipientDto[];
  attachments?: MailAttachmentDto[];
  mailLabels?: MailMessageLabelDto[];
}

export interface MailLabelDto {
  id?: string;
  name?: string;
  color?: string;
}

export interface MailFolderDto {
  id?: string;
  mailAccountId?: string;
  userId?: string;
  mailType?: string;
  providerId?: string;
  parentProviderId?: string;
  displayName?: string;
  totalCount?: number;
  unreadCount?: number;
  children?: MailFolderDto[];
}

export interface MailComposeDto {
  subject: string;
  body: string;
  to: string[];
  cc: string[];
  bcc: string[];
  labelIds: string[];
  mailAccountId?: string;
  attachments?: MailComposeAttachmentDto[];
}

export interface MailComposeAttachmentDto {
  fileName: string;
  contentType: string;
  contentBase64: string;
  fileSize: number;
}

export interface MailLabelItem {
  id: string;
  name: string;
  color: string;
}

export interface Mail {
  id: string;
  from: string;
  fromEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  isSelected: boolean;
  hasAttachment: boolean;
  folder: string;
  labels: string[];
  to: string;
  cc: string;
  bcc: string;
  attachments: MailAttachmentDto[];
  mailType: string;
  status: string;
  isDeleted: boolean;
}

export interface PagedResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  data: T[];
}

export interface MailAccountDto {
  id?: string;
  userId?: string;
  email?: string;
  provider?: string;
  tokenExpiredAt?: string;
}
