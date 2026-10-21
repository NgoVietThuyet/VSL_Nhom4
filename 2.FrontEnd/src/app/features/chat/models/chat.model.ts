import { BaseFilter } from "../../../shared/models";

export class ChatConversationDto extends BaseFilter {
    id: string = '';
    name: string = '';
    isGroup: boolean = false;
    avatarUrl: string = '';
    createDate: string = '';
    participants: ChatParticipantDto[] = [];
    lastMessage: ChatMessageDto | null = null;
    unreadCount: number = 0;
}

export class ChatParticipantDto {
    id: string = '';
    conversationId: string = '';
    userName: string = '';
    fullName: string = '';
    avatarFileId: string = '';
    role: string = '';
    lastReadAt: string = '';
}

export class ChatMessageDto {
    id: string = '';
    conversationId: string = '';
    senderUserName: string = '';
    senderFullName: string = '';
    senderAvatarFileId: string = '';
    content: string = '';
    messageType: string = 'Text';
    fileUrl: string = '';
    fileName: string = '';
    fileSize: number = 0;
    isRecalled: boolean = false;
    replyToMessageId: string = '';
    replyToMessage: ChatMessageDto | null = null;
    isPinned: boolean = false;
    reactions: ChatReactionDto[] = [];
    createDate: string = '';
}

export class ChatReactionDto {
    id: string = '';
    messageId: string = '';
    userName: string = '';
    fullName: string = '';
    avatarFileId: string = '';
    emoji: string = '';
}

export class CreateConversationDto {
    name: string = '';
    isGroup: boolean = false;
    userNames: string[] = [];
}

export class SendMessageDto {
    conversationId: string = '';
    content: string = '';
    messageType: string = 'Text';
    replyToMessageId: string = '';
}

export class ForwardMessageDto {
    messageId: string = '';
    conversationIds: string[] = [];
}
