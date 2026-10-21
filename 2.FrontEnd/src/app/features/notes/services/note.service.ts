import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({ providedIn: 'root' })
export class NoteService {
  constructor(private common: CommonService) {}

  getNotebooks() {
    return this.common.get('Note/Notebooks', {});
  }

  getNotebookDetail(id: string) {
    return this.common.get(`Note/Notebook/${id}`, {}, true);
  }

  createNotebook(dto: any) {
    return this.common.post('Note/Notebook', dto);
  }

  updateNotebook(id: string, dto: any) {
    return this.common.put(`Note/Notebook/${id}`, dto);
  }

  deleteNotebook(id: string) {
    return this.common.delete(`Note/Notebook/${id}`, {});
  }

  getSections(notebookId: string) {
    return this.common.get(`Note/Sections/${notebookId}`, {});
  }

  createSection(dto: any) {
    return this.common.post('Note/Section', dto);
  }

  updateSection(id: string, dto: any) {
    return this.common.put(`Note/Section/${id}`, dto);
  }

  deleteSection(id: string) {
    return this.common.delete(`Note/Section/${id}`, {});
  }

  getPages(sectionId: string) {
    return this.common.get(`Note/Pages/${sectionId}`, {});
  }

  getPageDetail(id: string) {
    return this.common.get(`Note/Page/${id}`, {}, true);
  }

  createPage(dto: any) {
    return this.common.post('Note/Page', dto);
  }

  updatePage(id: string, dto: any) {
    return this.common.put(`Note/Page/${id}`, dto);
  }

  deletePage(id: string) {
    return this.common.delete(`Note/Page/${id}`, {});
  }

  getBlocks(pageId: string) {
    return this.common.get(`Note/Blocks/${pageId}`, {});
  }

  saveBlocks(pageId: string, blocks: any[]) {
    return this.common.post(`Note/Blocks/Save/${pageId}`, blocks);
  }

  createBlock(dto: any) {
    return this.common.post('Note/Block', dto);
  }

  updateBlock(id: string, dto: any) {
    return this.common.put(`Note/Block/${id}`, dto);
  }

  deleteBlock(id: string) {
    return this.common.delete(`Note/Block/${id}`, {});
  }

  // Sharing
  getShares(notebookId: string) {
    return this.common.get(`Note/Shares/${notebookId}`, {});
  }

  shareNotebook(dto: any) {
    return this.common.post('Note/Share', dto);
  }

  removeShare(shareId: string) {
    return this.common.delete(`Note/Share/${shareId}`, {});
  }

  acceptShare(shareId: string) {
    return this.common.post(`Note/AcceptShare/${shareId}`, {});
  }

  rejectShare(shareId: string) {
    return this.common.post(`Note/RejectShare/${shareId}`, {});
  }

  getPendingShares() {
    return this.common.get('Note/PendingShares', {});
  }

  getSharedNotebooks() {
    return this.common.get('Note/SharedNotebooks', {});
  }

  searchUsers(keyword: string) {
    return this.common.get('Account/Search', { keyword });
  }
}
