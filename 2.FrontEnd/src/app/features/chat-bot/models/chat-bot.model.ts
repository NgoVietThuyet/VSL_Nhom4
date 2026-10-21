export class ChatBotConversationDto {
    id: string = '';
    title: string = '';
    userName: string = '';
    createDate: string = '';
    updateDate: string = '';
}

export class ChatBotMessageDto {
    id: string = '';
    conversationId: string = '';
    role: string = '';
    content: string = '';
    tokensUsed: number = 0;
    createDate: string = '';
    /** Local-only: attachments snapshotted at send time, not from server */
    attachments?: ChatBotAttachmentDto[];
}

export class SendChatBotMessageDto {
    conversationId: string = '';
    content: string = '';
    attachmentIds: string[] = [];
}

export type ChatBotAttachmentStatus = 'uploading' | 'ocr' | 'ready' | 'error';

export class ChatBotAttachmentDto {
    id: string = '';
    conversationId: string = '';
    fileName: string = '';
    fileSize: number = 0;
    mimeType: string = '';
    extension: string = '';
    icon: string = '';
    status: ChatBotAttachmentStatus = 'uploading';
    error: string | null = null;
    ocrTextLength: number = 0;
    createDate: string = '';
    createBy?: string;
    /** Local-only client field: upload progress 0..100 */
    progress?: number;
}
