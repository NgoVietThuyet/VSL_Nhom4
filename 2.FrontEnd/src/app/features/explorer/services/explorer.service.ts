import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';
import { EnvironmentService, TokenService } from '../../../core';

@Injectable({ providedIn: 'root' })
export class ExplorerService {
  constructor(
    private common: CommonService,
    private http: HttpClient,
    private env: EnvironmentService,
    private tokenService: TokenService,
  ) {}

  private get baseUrl(): string {
    return this.env.getEnv('baseUrl') || '';
  }

  getItems(
    parentId: string | null = null,
    tagId: string | null = null,
  ): Observable<any> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId;
    if (tagId) params['tagId'] = tagId;
    return this.common.get('Explorer/Items', params);
  }

  searchItems(keyword: string, parentId?: string | null): Observable<any> {
    const params: any = { keyword };
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Explorer/Search', params);
  }

  getAncestors(itemId: string): Observable<any> {
    return this.common.get(`Explorer/Ancestors/${itemId}`);
  }

  getItem(id: string): Observable<any> {
    return this.common.get(`Explorer/Item/${id}`, {});
  }

  createFolder(dto: {
    name: string;
    parentId?: string | null;
    color?: string;
  }): Observable<any> {
    return this.common.post('Explorer/Folder', dto);
  }

  uploadFiles(files: File[], parentId?: string | null): Observable<any> {
    const paramsUrl: any = {};
    if (parentId) paramsUrl['parentId'] = parentId;
    return this.common.uploadFiles('Explorer/Upload', files, paramsUrl);
  }

  renameItem(id: string, name: string): Observable<any> {
    return this.common.put(`Explorer/Rename/${id}`, { name });
  }

  deleteItem(id: string): Observable<any> {
    return this.common.delete(`Explorer/Item/${id}`, {});
  }

  hardDeleteItem(id: string): Observable<any> {
    return this.common.delete(`Explorer/Item/HardDelete/${id}`);
  }

  restoreItem(id: string): Observable<any> {
    return this.common.post(`Explorer/Restore/${id}`, {});
  }

  toggleFavorite(id: string): Observable<any> {
    return this.common.post(`Explorer/Favorite/${id}`, {});
  }

  getFavorites(parentId?: string | null): Observable<any> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Explorer/Favorites', params);
  }
  getRecent(
    pageIndex: number = 1,
    pageSize: number = 50,
    parentId?: string | null,
  ): Observable<any> {
    const params: any = { pageIndex, pageSize };
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Explorer/Recent', params);
  }

  getShared(): Observable<any> {
    return this.common.get('Explorer/Shared', {});
  }

  getTrash(): Observable<any> {
    return this.common.get('Explorer/Trash', {});
  }

  toggleTag(itemId: string, tagId: string): Observable<any> {
    return this.common.post(`Explorer/Tag/${itemId}/${tagId}`, {});
  }

  downloadFile(id: string, fileName: string): void {
    const token = this.tokenService.getAccessToken();
    this.http
      .get(`${this.baseUrl}/Explorer/Download/${id}`, {
        observe: 'response',
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          if (!response.body) return;
          const blob = new Blob([response.body], {
            type:
              response.headers.get('Content-Type') ||
              'application/octet-stream',
          });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(link.href);
        },
        error: () => {},
      });
  }

  getShares(itemId: string): Observable<any> {
    return this.common.get(`Explorer/Shares/${itemId}`, {});
  }

  shareItem(dto: {
    itemId: string;
    userId: string;
    role?: string;
  }): Observable<any> {
    return this.common.post('Explorer/Share', dto);
  }

  removeShare(shareId: string): Observable<any> {
    return this.common.delete(`Explorer/Share/${shareId}`, {});
  }

  createShareLink(itemId: string, mode: string): Observable<any> {
    return this.common.post(`Explorer/ShareLink/${itemId}/${mode}`, {});
  }

  getCurrentShareLink(itemId: string): Observable<any> {
    return this.common.get(`Explorer/CurrentShareLink/${itemId}`);
  }

  updateShareLinkMode(itemId: string, mode: string): Observable<any> {
    return this.common.put(`Explorer/ShareLink/${itemId}/${mode}`, {});
  }

  getItemByShareCode(code: string): Observable<any> {
    return this.common.get(`Explorer/ByShareCode/${code}`);
  }

  searchUsers(keyword: string): Observable<any> {
    return this.common.get('Account/Search', {
      keyWord: keyword,
      pageSize: 50,
      currentPage: 1,
      isActive: true,
    });
  }

  getTags(): Observable<any> {
    return this.common.get('Explorer/Tags', {});
  }

  getPendingShares(): Observable<any> {
    return this.common.get('Explorer/PendingShares', {});
  }

  acceptShare(shareId: string): Observable<any> {
    return this.common.post(`Explorer/AcceptShare/${shareId}`, {});
  }

  rejectShare(shareId: string): Observable<any> {
    return this.common.post(`Explorer/RejectShare/${shareId}`, {});
  }

  createTag(dto: {
    name: string;
    color?: string;
    userId?: string;
  }): Observable<any> {
    return this.common.post('Explorer/Tag', dto);
  }

  deleteTag(tagId: string) {
    return this.common.delete(`Explorer/Tag/${tagId}`);
  }

  getArchiveTags(): Observable<any> {
    return this.common.get('Archive/Tags', {});
  }

  createArchiveTag(dto: { name: string; color?: string }): Observable<any> {
    return this.common.post('Archive/Tag', dto);
  }

  deleteArchiveTag(tagId: string) {
    return this.common.delete(`Archive/Tag/${tagId}`);
  }

  moveItem(id: string, targetParentId?: string | null): Observable<any> {
    const params: any = {};
    if (targetParentId) params['targetParentId'] = targetParentId;
    return this.common.post(`Explorer/Move/${id}`, {});
  }

  getActivities(itemId: string): Observable<any> {
    return this.common.get(`Explorer/Activities/${itemId}`, {});
  }

  getUserActivities(
    pageIndex: number = 1,
    pageSize: number = 20,
    keyword?: string,
  ): Observable<any> {
    const params: any = { pageIndex, pageSize };
    if (keyword?.trim()) params['keyword'] = keyword.trim();
    return this.common.get('Explorer/Activities', params);
  }

  getArchiveActivities(
    pageIndex: number = 1,
    pageSize: number = 20,
    keyword?: string,
  ): Observable<any> {
    const params: any = { pageIndex, pageSize };
    if (keyword?.trim()) params['keyword'] = keyword.trim();
    return this.common.get('Archive/Activities', params);
  }

  getArchiveItems(parentId?: string | null): Observable<any> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Archive/Items', params);
  }

  searchArchiveItems(
    keyword: string,
    parentId?: string | null,
  ): Observable<any> {
    const params: any = { keyword };
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Archive/Search', params);
  }

  getArchiveItem(id: string): Observable<any> {
    return this.common.get(`Archive/Item/${id}`, {});
  }

  getArchiveRecent(
    pageIndex: number = 1,
    pageSize: number = 50,
    parentId?: string | null,
  ): Observable<any> {
    const params: any = { pageIndex, pageSize };
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Archive/Recent', params);
  }

  copyFromArchiveToPersonal(
    itemIds: string[],
    targetParentId: string | null = null,
  ) {
    return this.common.post('Archive/CopyToPersonal', {
      itemIds: itemIds,
      targetParentId: targetParentId,
    });
  }

  createArchiveFolder(dto: {
    name: string;
    parentId?: string | null;
    color?: string;
  }): Observable<any> {
    return this.common.post('Archive/Folder', dto);
  }

  uploadArchiveFiles(files: File[], parentId?: string | null): Observable<any> {
    const paramsUrl: any = {};
    if (parentId) paramsUrl['parentId'] = parentId;
    return this.common.uploadFiles('Archive/Upload', files, paramsUrl);
  }
  getArchiveFavorites(parentId?: string | null): Observable<any> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId;
    return this.common.get('Archive/Favorites', params);
  }

  getArchiveTrash(): Observable<any> {
    return this.common.get('Archive/Trash', {});
  }

  archiveRenameItem(id: string, name: string): Observable<any> {
    return this.common.put(`Archive/Rename/${id}`, { name });
  }

  archiveDeleteItem(id: string): Observable<any> {
    return this.common.delete(`Archive/Item/${id}`, {});
  }

  archiveRestoreItem(id: string): Observable<any> {
    return this.common.post(`Archive/Restore/${id}`, {});
  }

  archiveToggleFavorite(id: string): Observable<any> {
    return this.common.post(`Archive/Favorite/${id}`, {});
  }

  archiveToggleTag(itemId: string, tagId: string): Observable<any> {
    return this.common.post(`Archive/Tag/${itemId}/${tagId}`, {});
  }

  archiveDownloadFile(id: string, fileName: string): void {
    const token = this.tokenService.getAccessToken();
    this.http
      .get(`${this.baseUrl}/Archive/Download/${id}`, {
        observe: 'response',
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          if (!response.body) return;
          const blob = new Blob([response.body], {
            type:
              response.headers.get('Content-Type') ||
              'application/octet-stream',
          });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(link.href);
        },
        error: () => {},
      });
  }

  archiveCreateShareLink(itemId: string): Observable<any> {
    return this.common.post(`Archive/ShareLink/${itemId}`, {});
  }

  archiveDisableShareLink(itemId: string): Observable<any> {
    return this.common.post(`Archive/DisableShareLink/${itemId}`, {});
  }

  getArchiveShares(itemId: string): Observable<any> {
    return this.common.get(`Archive/Shares/${itemId}`, {});
  }

  archiveShareItem(dto: {
    itemId: string;
    userId: string;
    role?: string;
  }): Observable<any> {
    return this.common.post('Archive/Share', dto);
  }

  getArchiveItemPermission(itemId: string): Observable<any> {
    return this.common.get(`Archive/Permission/${itemId}`, {});
  }

  setArchivePermission(dto: {
    itemId: string;
    permType: string;
    orgIds?: string[];
    userNames?: string[];
  }): Observable<any> {
    return this.common.post('Archive/Permission', dto);
  }

  getArchiveGrants(itemId: string): Observable<any> {
    return this.common.get(`Archive/Grants/${itemId}`);
  }

  revokeArchiveGrant(grantId: string): Observable<any> {
    return this.common.delete(`Archive/Grant/${grantId}`);
  }

  transferArchiveOwner(dto: {
    itemId: string;
    newOwnerUserNames: string[];
  }): Observable<any> {
    return this.common.post('Archive/Permission/Transfer', dto);
  }

  getOrgsForPermission(): Observable<any> {
    return this.common.get('Archive/Permission/Orgs', {});
  }

  getUsersForPermission(
    orgId?: string | null,
    keyword?: string | null,
  ): Observable<any> {
    const params: any = {};
    if (orgId) params['orgId'] = orgId;
    if (keyword) params['keyword'] = keyword;
    return this.common.get('Archive/Permission/Users', params);
  }

  archiveMoveItems(ids: string[], targetParentId: string | null) {
    return this.common.post('Archive/MoveItems', { ids, targetParentId });
  }

  archiveCopyItems(ids: string[], targetParentId: string | null) {
    return this.common.post('Archive/CopyItems', { ids, targetParentId });
  }

  archiveDownloadMultipleAsZip(ids: string[]): Observable<HttpResponse<Blob>> {
    return this.common.downloadFilePost('Archive/DownloadZip', ids);
  }

  copyItems(itemIds: string[], targetParentId: string | null) {
    return this.common.post(`${this.baseUrl}/Explorer/CopyItems`, {
      itemIds,
      targetParentId,
    });
  }

  moveItems(itemIds: string[], targetParentId: string | null) {
    return this.common.post(`${this.baseUrl}/Explorer/MoveItems`, {
      itemIds,
      targetParentId,
    });
  }
  downloadMultipleAsZip(ids: string[]): Observable<HttpResponse<Blob>> {
    return this.common.downloadFilePost('Explorer/DownloadZip', ids);
  }
}
