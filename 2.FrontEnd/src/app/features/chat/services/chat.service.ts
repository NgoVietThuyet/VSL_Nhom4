import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { CreateConversationDto, ForwardMessageDto, SendMessageDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(private common: CommonService) { }

    getConversations(page: number = 1, pageSize: number = 20) {
        return this.common.get('Chat/Conversations', { page, pageSize }, false)
    }

    createConversation(data: CreateConversationDto) { return this.common.post('Chat/CreateConversation', data, false) }

    getPrivateConversation(targetUser: string) { return this.common.get(`Chat/PrivateConversation/${targetUser}`, {}, false) }

    getMessages(conversationId: string, page: number = 1, pageSize: number = 50) {
        return this.common.get(`Chat/Messages/${conversationId}`, { page, pageSize }, false)
    }

    sendMessage(data: SendMessageDto, file?: File) {
        const formData = new FormData();
        formData.append('conversationId', data.conversationId);
        formData.append('content', data.content || '');
        formData.append('messageType', data.messageType || 'Text');
        if (data.replyToMessageId) {
            formData.append('replyToMessageId', data.replyToMessageId);
        }
        if (file) {
            formData.append('file', file, file.name);
        }
        return this.common.post('Chat/SendMessage', formData, false);
    }

    addParticipants(conversationId: string, userNames: string[]) {
        return this.common.post('Chat/AddParticipants', { conversationId, userNames }, false)
    }

    removeParticipant(conversationId: string, userName: string) {
        return this.common.post('Chat/RemoveParticipant', { conversationId, userName }, false)
    }

    recallMessage(messageId: string) {
        return this.common.post(`Chat/RecallMessage/${messageId}`, {}, false)
    }

    togglePin(messageId: string) {
        return this.common.post(`Chat/TogglePin/${messageId}`, {}, false)
    }

    getPinnedMessages(conversationId: string) {
        return this.common.get(`Chat/PinnedMessages/${conversationId}`, {}, false)
    }

    toggleReaction(messageId: string, conversationId: string, emoji: string) {
        return this.common.post('Chat/ToggleReaction', { messageId, conversationId, emoji }, false)
    }

    markAsRead(conversationId: string) {
        return this.common.post(`Chat/MarkAsRead/${conversationId}`, {}, false)
    }

    markAsUnread(conversationId: string) {
        return this.common.post(`Chat/MarkAsUnread/${conversationId}`, {}, false)
    }

    searchMessages(conversationId: string, keyword: string, page: number = 1, pageSize: number = 20) {
        return this.common.get(`Chat/SearchMessages/${conversationId}`, { keyword, page, pageSize }, false)
    }

    forwardMessage(data: ForwardMessageDto) {
        return this.common.post('Chat/ForwardMessage', data, false)
    }

    leaveGroup(conversationId: string) {
        return this.common.post(`Chat/LeaveGroup/${conversationId}`, {}, false)
    }

    removeAllReactions(messageId: string, conversationId: string) {
        return this.common.post('Chat/RemoveAllReactions', { messageId, conversationId }, false)
    }

    getMediaFilesLinks(conversationId: string, limit: number = 20) {
        return this.common.get(`Chat/MediaFilesLinks/${conversationId}`, { limit }, false)
    }

    getMediaByType(conversationId: string, type: string, page: number = 1, pageSize: number = 20) {
        return this.common.get(`Chat/MediaByType/${conversationId}/${type}`, { page, pageSize }, false)
    }

    deleteConversation(conversationId: string) {
        return this.common.delete(`Chat/${conversationId}`, {}, false)
    }
}
