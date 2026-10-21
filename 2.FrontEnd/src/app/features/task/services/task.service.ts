import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private common: CommonService) {}

  getWorkspaces() {
    return this.common.get('Task/Workspaces', {});
  }
  createWorkspace(dto: any) {
    return this.common.post('Task/Workspace', dto);
  }
  updateWorkspace(id: string, dto: any) {
    return this.common.put(`Task/Workspace/${id}`, dto);
  }
  deleteWorkspace(id: string) {
    return this.common.delete(`Task/Workspace/${id}`, {});
  }

  getBoards(workspaceId: string) {
    return this.common.get(`Task/Boards/${workspaceId}`, {});
  }
  getBoardDetail(id: string) {
    return this.common.get(`Task/Board/${id}`, {}, true);
  }
  createBoard(dto: any) {
    return this.common.post('Task/Board', dto);
  }
  updateBoard(id: string, dto: any) {
    return this.common.put(`Task/Board/${id}`, dto);
  }
  deleteBoard(id: string) {
    return this.common.delete(`Task/Board/${id}`, {});
  }

  createList(dto: any) {
    return this.common.post('Task/List', dto);
  }
  updateList(id: string, dto: any) {
    return this.common.put(`Task/List/${id}`, dto);
  }
  deleteList(id: string) {
    return this.common.delete(`Task/List/${id}`, {});
  }
  reorderLists(dto: any) {
    return this.common.post('Task/List/Reorder', dto);
  }

  getCardDetail(id: string) {
    return this.common.get(`Task/Card/${id}`, {}, true);
  }
  createCard(dto: any) {
    return this.common.post('Task/Card', dto);
  }
  updateCard(id: string, dto: any) {
    return this.common.put(`Task/Card/${id}`, dto);
  }
  deleteCard(id: string) {
    return this.common.delete(`Task/Card/${id}`, {});
  }
  moveCard(dto: any) {
    return this.common.post('Task/Card/Move', dto);
  }
  reorderCards(dto: any) {
    return this.common.post('Task/Card/Reorder', dto);
  }

  getLabels(boardId: string) {
    return this.common.get(`Task/Labels/${boardId}`, {});
  }
  createLabel(dto: any) {
    return this.common.post('Task/Label', dto);
  }
  updateLabel(id: string, dto: any) {
    return this.common.put(`Task/Label/${id}`, dto);
  }
  deleteLabel(id: string) {
    return this.common.delete(`Task/Label/${id}`, {});
  }

  addLabelToCard(dto: any) {
    return this.common.post('Task/CardLabel', dto);
  }
  removeLabelFromCard(id: string) {
    return this.common.delete(`Task/CardLabel/${id}`, {});
  }

  getBoardMembers(boardId: string) {
    return this.common.get(`Task/BoardMembers/${boardId}`, {});
  }
  addBoardMember(dto: any) {
    return this.common.post('Task/BoardMember', dto);
  }
  removeBoardMember(id: string) {
    return this.common.delete(`Task/BoardMember/${id}`, {});
  }

  addCardMember(dto: any) {
    return this.common.post('Task/CardMember', dto);
  }
  removeCardMember(id: string) {
    return this.common.delete(`Task/CardMember/${id}`, {});
  }

  getChecklists(cardId: string) {
    return this.common.get(`Task/Checklists/${cardId}`, {});
  }
  createChecklist(dto: any) {
    return this.common.post('Task/Checklist', dto);
  }
  deleteChecklist(id: string) {
    return this.common.delete(`Task/Checklist/${id}`, {});
  }
  createChecklistItem(dto: any) {
    return this.common.post('Task/ChecklistItem', dto);
  }
  updateChecklistItem(id: string, dto: any) {
    return this.common.put(`Task/ChecklistItem/${id}`, dto);
  }
  deleteChecklistItem(id: string) {
    return this.common.delete(`Task/ChecklistItem/${id}`, {});
  }

  getComments(cardId: string) {
    return this.common.get(`Task/Comments/${cardId}`, {});
  }
  addComment(dto: any) {
    return this.common.post('Task/Comment', dto);
  }
  deleteComment(id: string) {
    return this.common.delete(`Task/Comment/${id}`, {});
  }

  getActivities(cardId: string) {
    return this.common.get(`Task/Activities/${cardId}`, {});
  }

  getDataTaskBoardDetail(id: string){
    return this.common.get(`Task/TaskList/${id}`, {});
  }

  getDataTaskLabelFollowBoard(boardId: string){
    return this.common.get(`Task/TaskLabelFollowBoard/${boardId}`, {});
  }

  uploadFilesCard(files: File[], cardId: string): Observable<any> {
    // return this.common.uploadFiles('Explorer/Upload', files);
    return this.common.uploadFiles('Task/UploadFileCard', files, { cardId });
  }

  deleteFile(fileId: string): Observable<any> {
    return this.common.delete(`Task/DeleteFile/${fileId}`, {});
  }

  // ─────────────────────────── Task Integration ───────────────────────────

  getIntegrationAccounts(provider: string) {
    return this.common.get(`TaskIntegration/${provider}/List`, {});
  }

  getIntegrationAuthUrl(provider: string) {
    return this.common.get(`TaskIntegration/${provider}/Auth`, {});
  }

  deleteIntegrationAccount(provider: string, id: string) {
    return this.common.delete(`TaskIntegration/${provider}/${id}`, {});
  }

  syncIntegrationNow(provider: string) {
    return this.common.post(`TaskIntegration/${provider}/SyncNow`, {});
  }

  connectIntegration(provider: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.common.get(`TaskIntegration/${provider}/List`, {}).subscribe({
        next: (beforeRes: any) => {
          const beforeCount = (Array.isArray(beforeRes) ? beforeRes : beforeRes?.data || []).length;
          
          this.getIntegrationAuthUrl(provider).subscribe({
            next: (authRes: any) => {
              const url = authRes?.data ?? authRes;
              if (!url) { resolve(false); return; }

              this.openOAuthPopup(url).then(() => {
                this.common.get(`TaskIntegration/${provider}/List`, {}).subscribe({
                  next: (afterRes: any) => {
                    const afterCount = (Array.isArray(afterRes) ? afterRes : afterRes?.data || []).length;
                    resolve(afterCount > beforeCount);
                  },
                  error: () => resolve(false)
                });
              }).catch(() => resolve(false));
            },
            error: () => resolve(false)
          });
        },
        error: () => resolve(false)
      });
    });
  }

  /**
   * Mở cửa sổ popup OAuth
   */
  openOAuthPopup(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'trello_oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        reject(new Error('Không thể mở cửa sổ đăng nhập. Vui lòng tắt chặn popup.'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success') {
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) popup.close();
          resolve();
        }
      };

      window.addEventListener('message', messageHandler);

      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          resolve();
        }
      }, 500);
    });
  }
}
