import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { BuildTreePlanRequest } from '../models/document-tree-plan.model';
import { DocumentAction, DocumentIncoming, DocumentIncomingFilter } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentIncomingService {
  constructor(private common: CommonService) {}

  search(filter: DocumentIncomingFilter) { return this.common.get('DocumentIncoming/Search', filter); }
  detail(id: string) { return this.common.get(`DocumentIncoming/Detail/${id}`, {}); }
  activities(id: string) { return this.common.get(`DocumentIncoming/Activities/${id}`, {}); }
  create(dto: DocumentIncoming) { return this.common.post('DocumentIncoming/Insert', dto); }
  update(dto: DocumentIncoming) { return this.common.put('DocumentIncoming/Update', dto); }

  tiepNhan(dto: DocumentAction) { return this.common.post('DocumentIncoming/TiepNhan', dto); }
  tuChoi(dto: DocumentAction) { return this.common.post('DocumentIncoming/TuChoi', dto); }
  chuyenXuLy(dto: DocumentAction) { return this.common.post('DocumentIncoming/ChuyenXuLy', dto); }
  chiDao(dto: DocumentAction) { return this.common.post('DocumentIncoming/ChiDao', dto); }
  hoanThanh(dto: DocumentAction) { return this.common.put('DocumentIncoming/HoanThanh', dto); }
  traLai(dto: DocumentAction) { return this.common.put('DocumentIncoming/TraLai', dto); }
  thuHoi(dto: DocumentAction) { return this.common.put('DocumentIncoming/ThuHoi', dto); }
  luuTraCuu(dto: DocumentAction) { return this.common.put('DocumentIncoming/LuuTraCuu', dto); }
  delete(id: string) { return this.common.delete(`DocumentIncoming/Delete/${id}`); }
  buildTreePlan(request: BuildTreePlanRequest) {
    return this.common.post('DocumentIncoming/BuildTreePlan', request);
  }
  savePlan(documentId: string, items: unknown[]) {
    return this.common.post('DocumentIncoming/SavePlan', { documentId, items });
  }
  getPlan(documentId: string) {
    return this.common.get(`DocumentIncoming/Plan/${documentId}`, {});
  }
  trinhXinYKien(dto: DocumentAction) {
    return this.common.post('DocumentIncoming/TrinhXinYKien', dto);
  }
  chuyenTiepVanBan(dto: DocumentAction) {
    return this.common.post('DocumentIncoming/ChuyenTiepVanBan', dto);
  }
  duyetPhuongAn(dto: DocumentAction) { return this.common.post('DocumentIncoming/DuyetPhuongAn', dto); }
  xacNhanHoanThanh(dto: DocumentAction) { return this.common.put('DocumentIncoming/XacNhanHoanThanh', dto); }
  xuLyLai(dto: DocumentAction) { return this.common.put('DocumentIncoming/XuLyLai', dto); }
  khoiPhuc(dto: DocumentAction) { return this.common.put('DocumentIncoming/KhoiPhuc', dto); }
  themXuLy(dto: DocumentAction) { return this.common.post('DocumentIncoming/ThemXuLy', dto); }
  daXem(dto: DocumentAction) { return this.common.put('DocumentIncoming/DaXem', dto); }
  phanLoai(dto: DocumentAction) { return this.common.put('DocumentIncoming/PhanLoai', dto); }
  luuSo(dto: DocumentAction) { return this.common.put('DocumentIncoming/LuuSo', dto); }
  getPhieu(documentId: string) { return this.common.get(`DocumentIncoming/Phieu/${documentId}`, {}); }
  savePhieu(documentId: string, items: unknown[]) {
    return this.common.post('DocumentIncoming/SavePhieu', { documentId, incomingItems: items });
  }
  deletePhieu(id: string) { return this.common.delete(`DocumentIncoming/Phieu/${id}`); }
}
