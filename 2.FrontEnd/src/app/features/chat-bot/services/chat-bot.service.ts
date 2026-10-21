    
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';
import { EnvironmentService, TokenService } from '../../../core';
import { ChatBotConversationDto, ChatBotAttachmentDto } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatBotService {
    constructor(
        private common: CommonService,
        private env: EnvironmentService,
        private tokenService: TokenService,
    ) {}

    searchConversations(filter: any) {
        return this.common.get('ChatBot/Search', filter, false);
    }
    
    getConversations() {
        return this.common.get('ChatBot/Conversations', {}, false);
    }

    getMessages(conversationId: string) {
        return this.common.get(`ChatBot/Messages/${conversationId}`, {}, false);
    }

    createConversation(title: string) {
        return this.common.post('ChatBot/CreateConversation', { title }, false);
    }

    deleteConversation(id: string) {
        return this.common.post(`ChatBot/DeleteConversation/${id}`, {}, false);
    }

    renameConversation(id: string, title: string) {
        return this.common.post(`ChatBot/RenameConversation/${id}`, { title }, false);
    }

    // ===== Attachments =====
    uploadAttachments(files: File[], conversationId?: string, showLoading = false): Observable<any> {
        const params: any = {};
        if (conversationId) params.conversationId = conversationId;
        return this.common.uploadFiles('ChatBot/UploadAttachments', files, undefined, params, showLoading);
    }

    getAttachmentStatus(id: string): Observable<any> {
        return this.common.get(`ChatBot/AttachmentStatus/${id}`, {}, false);
    }

    deleteAttachment(id: string): Observable<any> {
        return this.common.post(`ChatBot/DeleteAttachment/${id}`, {}, false);
    }

    getConversationAttachments(conversationId: string): Observable<any> {
        return this.common.get(`ChatBot/ConversationAttachments/${conversationId}`, {}, false);
    }

    extractTaskStream(request: { type: string; attachmentIds?: string[]; fullText?: string }): Observable<TaskExtractionStreamEvent> {
        const url = `${this.env.getEnv('baseUrl')}/ChatBot/ExtractTaskStream`;
        const token = this.tokenService.getAccessToken() || '';
        return new Observable<TaskExtractionStreamEvent>((observer) => {
            const controller = new AbortController();
            fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(request),
                signal: controller.signal,
            }).then(async (response) => {
                if (!response.ok || !response.body) { observer.error(new Error(`HTTP ${response.status}`)); return; }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() ?? '';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data: ')) continue;
                            try {
                                const ev: TaskExtractionStreamEvent = JSON.parse(trimmed.slice(6));
                                observer.next(ev);
                                if (ev.type === 'done' || ev.type === 'error') { observer.complete(); return; }
                            } catch { /* ignore malformed */ }
                        }
                    }
                } catch (err: any) { if (err?.name !== 'AbortError') observer.error(err); }
                observer.complete();
            }).catch((err) => { if (err?.name !== 'AbortError') observer.error(err); });
            return () => controller.abort();
        });
    }

    sendMessage(conversationId: string, content: string, attachmentIds: string[] = []): Observable<StreamChatBotEvent> {
        const url = `${this.env.getEnv('baseUrl')}/ChatBot/SendStream`;
        const token = this.tokenService.getAccessToken() || '';
        return new Observable<StreamChatBotEvent>((observer) => {
            const controller = new AbortController();

            fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ conversationId, content, attachmentIds }),
                signal: controller.signal
            }).then(async (response) => {
                if (!response.ok || !response.body) {
                    observer.error(new Error(`HTTP ${response.status}`));
                    return;
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() ?? '';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data: ')) continue;
                            const json = trimmed.slice('data: '.length);
                            try {
                                const event: StreamChatBotEvent = JSON.parse(json);
                                observer.next(event);
                                if (event.type === 'done' || event.type === 'error') {
                                    observer.complete();
                                    return;
                                }
                            } catch { /* ignore malformed lines */ }
                        }
                    }
                } catch (err: any) {
                    if (err?.name !== 'AbortError') observer.error(err);
                }
                observer.complete();
            }).catch((err) => {
                if (err?.name !== 'AbortError') observer.error(err);
            });

            return () => controller.abort();
        });
    }
}

export interface StreamChatBotEvent {
    type: 'meta' | 'chunk' | 'done' | 'error';
    conversationId?: string;
    isNewConversation?: boolean;
    content?: string;
    message?: string;
}

export interface TaskExtractionStreamEvent {
    type: 'meta' | 'progress' | 'result' | 'task' | 'warning' | 'error' | 'done';
    document?: Record<string, any>;
    task?: Record<string, any>;
    message?: string;
    totalChunks?: number;
    totalSections?: number;
    chunkIndex?: number;
    sectionIndex?: number;
    tasksFound?: number;
    phase?: string;
    rawText?: string;
    parseError?: string;
}
