import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DocumentAction, DocumentOutgoing, DocumentOutgoingFilter } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentOutgoingService {
  constructor(private common: CommonService) {}

  search(filter: DocumentOutgoingFilter) { return this.common.get('DocumentOutgoing/Search', filter); }
  detail(id: string) { return this.common.get(`DocumentOutgoing/Detail/${id}`, {}); }
  activities(id: string) { return this.common.get(`DocumentOutgoing/Activities/${id}`, {}); }
  create(dto: DocumentOutgoing) { return this.common.post('DocumentOutgoing/Insert', dto); }
  update(dto: DocumentOutgoing) { return this.common.put('DocumentOutgoing/Update', dto); }

  trinhKy(dto: DocumentAction) { return this.common.post('DocumentOutgoing/TrinhKy', dto); }
  dongYDuThao(dto: DocumentAction) { return this.common.post('DocumentOutgoing/DongYDuThao', dto); }
  traLai(dto: DocumentAction) { return this.common.put('DocumentOutgoing/TraLai', dto); }
  hoanThanh(dto: DocumentAction) { return this.common.put('DocumentOutgoing/HoanThanh', dto); }
  banHanh(dto: DocumentAction) { return this.common.post('DocumentOutgoing/BanHanh', dto); }
  thuHoi(dto: DocumentAction) { return this.common.put('DocumentOutgoing/ThuHoi', dto); }
  daXem(dto: DocumentAction) { return this.common.put('DocumentOutgoing/DaXem', dto); }
  xuLyLai(dto: DocumentAction) { return this.common.put('DocumentOutgoing/XuLyLai', dto); }
  khoiPhuc(dto: DocumentAction) { return this.common.put('DocumentOutgoing/KhoiPhuc', dto); }
  xoaDuThao(id: string) { return this.common.delete(`DocumentOutgoing/XoaDuThao/${id}`); }
  luuSo(dto: DocumentAction) { return this.common.put('DocumentOutgoing/LuuSo', dto); }
  getPhieu(documentId: string) { return this.common.get(`DocumentOutgoing/Phieu/${documentId}`, {}); }
  savePhieu(documentId: string, items: unknown[]) {
    return this.common.post('DocumentOutgoing/SavePhieu', { documentId, outgoingItems: items });
  }
  deletePhieu(id: string) { return this.common.delete(`DocumentOutgoing/Phieu/${id}`); }
}
