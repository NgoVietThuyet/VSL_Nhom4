import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';
import { EnvironmentService } from '../../../core';


@Injectable({
  providedIn: 'root',
})
export class VanBanDiDonViService {
  constructor(private commonService: CommonService, private http: HttpClient, private env: EnvironmentService) {}

  searchBanHanh(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/SearchBanHanh', params);
  }

  searchDuThao(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/SearchDuThao', params);
  }

  searchXuLy(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/SearchXuLy', params);
  }

  searchYKien(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/SearchYKien', params);
  }

  getMasterData(orgCode: any, username: any): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetMasterData?orgCode=${orgCode}&username=${username}`
    );
  }

  getMasterDataDc(documentId: any): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetMasterData?documentId=${documentId}`
    );
  }

  getAccountsByFilter(
    documentId: any,
    isFilterCapDuoi?: boolean
  ): Observable<any> {
    let url = `VanBanDiDonVi/GetAccountByFilter?documentId=${documentId}`;

    if (isFilterCapDuoi !== undefined && isFilterCapDuoi !== null) {
      url += `&isFilterCapDuoi=${isFilterCapDuoi}`;
    }

    return this.commonService.get(url);
  }

  thongTinChiTiet(
    actId: string,
    isNotify?: boolean | null,
    tabClient?: boolean | null
  ): Observable<any> {
    let url = `VanBanDiDonVi/ThongTinChiTiet?actId=${actId}`;
    if (isNotify !== null && isNotify !== undefined) {
      url += `&isNotify=${isNotify}`;
    }
    if (tabClient !== null && tabClient !== undefined) {
      url += `&tabClient=${tabClient}`;
    }

    return this.commonService.get(url);
  }

  taoMoiThongTin(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/TaoMoiThongTin', params);
  }

  capNhatThongTin(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/CapNhatThongTin', params);
  }

  capNhatThongTinPhieu(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/CapNhatThongTinPhieu',
      params
    );
  }

  xoaVanBanDi(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/XoaDuThao', params);
  }

  thuHoiVanBan(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/ThuHoiVanBanDaBanHanh',
      params
    );
  }

  capNhatThongTinSauBanHanh(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/CapNhatThongTinSauBanHanh',
      params
    );
  }

  chuyenListVanBanTuTramQuetCBChoVanThu(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/ChuyenListVanBanTuTramQuetCBChoVanThu',
      params
    );
  }

  /**
   * Cập nhật thông tin phiếu với logic mới:
   * 1. Nếu là bản ghi đầu tiên của phiếu thì mới cập nhật vào bảng T_DC_DOCUMENT_OUTGOING
   * 2. Cập nhật thông tin phiếu các vị trí
   * 3. Mỗi lần cập nhật thì thông tin đã có vào bảng T_DC_DOCUMENT_OUTGOING_PHIEU_HISTORY và T_DC_DOCUMENT_OUTGOING_PHIEU_VERSION
   * @param documentData Dữ liệu văn bản cần cập nhật
   * @returns Observable kết quả
   */
  updatePhieuWithNewLogic(documentData: any): Observable<any> {
    // Chuẩn bị dữ liệu cho API
    const requestData = {
      document: documentData.document || {},
      info: documentData.info || {},
      accountLoginInfo: documentData.accountLoginInfo || {},
      // Thêm các thông tin khác nếu cần
      listDuThao: documentData.listDuThao || [],
      listToTrinh: documentData.listToTrinh || [],
      files: documentData.files || [],
      donViNhanDeBiet: documentData.donViNhanDeBiet || [],
      donViNhanNoiNganh: documentData.donViNhanNoiNganh || [],
      donViNhanNgoaiNganh: documentData.donViNhanNgoaiNganh || [],
      donViNhanNoiBo: documentData.donViNhanNoiBo || [],
      nguoiNhanXuLy: documentData.nguoiNhanXuLy || [],
    };

    return this.capNhatThongTinPhieu(requestData);
  }

  updatePhieuAndSaveHistoryVersion(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/UpdatePhieuAndSaveHistoryVersion',
      params
    );
  }

  confirmDuThao(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/DongYDuThao', params);
  }

  confirmHoanThanhVB(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/HoanThanhVanBan', params);
  }

  confirmHoanThanhTT(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/HoanThanhToTrinh', params);
  }

  confirmXinYKien(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/YKien', params);
  }

  confirmChuyenChoYKien(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/ChuyenChoYKien', params);
  }

  create(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/TaoMoiThongTin', data);
  }

  update(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/CapNhatThongTin', data);
  }

  trinhKy(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/TrinhKyVanBan', data);
  }

  uploadFile(data: any): Observable<any> {
    return this.commonService.post('File/UploadMultiple', data);
  }

  // Bổ sung hàm uploadFileChoSo
  uploadFileChoSo(base64File: any, idPhieu: string): Observable<any> {
    return this.commonService.post(
      `VanBanDiDonVi/UploadFileChoSo?idPhieu=${idPhieu}`,
      base64File
    );
  }

  downloadFileBase64(data: any): Observable<any> {
    return this.commonService.get(`File/DownloadDirectBase64/${data}`);
  }

  downloadFile(data: any): Observable<any> {
    return this.http.get(`${this.env.getEnv('apiUrl')}/DownloadDirect/${data}`, {
      responseType: 'blob' as 'json',
      observe: 'response',
    });
  }

  getUserHandle(roleCode: any, orgCode: any, isTroLyGiamDoc?: boolean): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetUserHandle?roleCode=${roleCode}&orgCode=${orgCode}&isTroLyGiamDoc=${isTroLyGiamDoc}`
    );
  }

  getRoleFromWorkflowDieuHanh(
    orgCode: any,
    currentRole: any,
    documentId?: any
  ): Observable<any> {

    let url = `VanBanDiDonVi/GetRoleFromWorkflowDieuHanh?orgCode=${orgCode}&currentRole=${currentRole}`;

    if (documentId) {
      url += `&documentId=${documentId}`;
    }

    return this.commonService.get(url);
  }

  banHanhVanBan(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/BanHanhVanBan', params);
  }

  searchHoSoCongViec(params: any): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/GetHoSoCongViec', params);
  }

  searchVanBanDaBanHanh(params: any): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/GetVanBanDaBanHanh', params);
  }

  getSoVanBan(
    orgCode: string,
    userRoleCode: string,
    username?: string | null,
    linhVucId?: string,
    doMatCode?: string
  ): Observable<any> {
    let url = `VanBanDiDonVi/GetSoVanBan?orgCode=${orgCode}&userRoleCode=${userRoleCode}`;

    if (username != null) {
      url += `&username=${username}`;
    }

    if (linhVucId) {
      url += `&linhVucId=${linhVucId}`;
    }
    if (doMatCode) {
      url += `&doMatCode=${doMatCode}`;
    }
    return this.commonService.get(url);
  }

  getNextSoVanBan(
    bookId: string,
    documentId: string,
    isDuThao?: boolean,
    orgCode?: string
  ): Observable<any> {
    let url = `VanBanDiDonVi/GetNextSoVanBan?bookId=${bookId}&documentId=${documentId}&isDuThao=${isDuThao}`;
    if (orgCode) url += `&orgCode=${encodeURIComponent(orgCode)}`;
    return this.commonService.get(url);
  }

  checkSoVanBanTrung(
    bookId: string,
    soVanBan: string,
    soPhu?: string
  ): Observable<any> {
    let url = `VanBanDiDonVi/CheckSoVanBanTrung?bookId=${bookId}&soVanBan=${encodeURIComponent(
      soVanBan
    )}`;
    if (soPhu) url += `&soPhu=${encodeURIComponent(soPhu)}`;
    return this.commonService.get(url);
  }

  getOrganizes(): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/GetOrganizes');
  }

  kyVanBan(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/KyVanBan', params);
  }
  GetPdfMemoryStream(filePath: string, idPhieu: string): Observable<any> {
    const formData = new FormData();
    formData.append('filePath', filePath);
    formData.append('idPhieu', idPhieu);
    return this.commonService.post(
      'VanBanDiDonVi/GetPdfMemoryStream',
      formData
    );
  }

  searchThuHoi(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/SearchThuHoi', params);
  }

  searchVanBanPhucDap(params: any): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/GetVanBanDenPhucDap', params);
  }

  getLoaiCongViec(): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/GetLoaiCongViec');
  }

  getAllDocumentActive(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/GetAllDocumentActive',
      params
    );
  }

  // getDocumentActiveById(documentId: any): Observable<any> {
  //   return this.commonService.get(
  //     `VanBanDiDonVi/GetDocumentActiveById/${documentId}`,

  //   );
  // }
  getDocumentsActiveByIds(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/GetDocumentsActiveByIds', params);
  }

  getDanhSachNguoiTraLai(params: any): Observable<any> {
    return this.commonService.get('VanBanDiDonVi/DanhSachNguoiTraLai', params);
  }
  traLai(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/TraLaiVanBan', params);
  }

  thuHoi(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/ThuHoiVanBan', data);
  }

  lanhDaoThuHoi(data: any): Observable<any> {
    return this.commonService.put('VanBanDiDonVi/LanhDaoThuHoi', data);
  }

  GetDocumentOutgoingQuaTrinhXuLy(params: any): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/GetDocumentOutgoingQuaTrinhXuLy',
      params
    );
  }

  yeuCauBanHanh(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/DeXuatBanHanh', data);
  }

  trinhKyList(data: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/TrinhKyListVanBan', data);
  }

  resetChuKy(data: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/ResetChuKy`, data);
  }
  ResetChoSo(data: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/ResetChoSo`, data);
  }
  ResetChoSoOnError(data: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/ResetChoSoOnError`, data);
  }
  getThongTinPhieu(id: string): Observable<any> {
    return this.commonService.get(`VanBanDiDonVi/ThongTinPhieu/${id}`);
  }

  getPhieuDocumentOg(documentId: string): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetPhieuDocumentOutgoing?documentId=${documentId}`
    );
  }

  isDaXem(params: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/DocumentViewStatus`, params);
  }

  deleteFile(params: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/DeleteFile`, params);
  }

  deNghiRaSoatBanHanh(params: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/DeNghiRaSoatBanHanh`, params);
  }

  deletePhieu(params: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/DeletePhieu`, params);
  }

  xemChiTiet(documentId: any): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/XemChiTiet?documentId=${documentId}`
    );
  }
  // getNoiNhanDeBietNguoiNhanXuLy(nguoiKy: any): Observable<any> {
  //   return this.commonService.get(
  //     `VanBanDiDonVi/GetNoiNhanDeBietNguoiNhanXuLy?nguoiKy=${nguoiKy}`
  //   );
  // }
  getNoiNhanDeBietNguoiNhanXuLy(nguoiKy: any, userName?: any, isLuongBo: boolean = false): Observable<any> {
    let url = `VanBanDiDonVi/GetNoiNhanDeBietNguoiNhanXuLy?nguoiKy=${nguoiKy}&isLuongBo=${isLuongBo}`;

    // Nếu có userName thì thêm vào query string
    if (userName) {
      url += `&userName=${userName}`;
    }

    return this.commonService.get(url);
  }

  getCertificatesByDocumentId(documentId: any): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetCertificatesByDocumentId?documentId=${documentId}`
    );
  }

  GetPersonAndOrgActionsByDocumentId(documentId: any): Observable<any> {
    return this.commonService.get(
      `VanBanDiDonVi/GetPersonAndOrgActionsByDocumentId?documentId=${documentId}`
    );
  }

  updateCmFile(fileData: {
    oldRefrenceFileId: string;
    id: string;
    fileName: string;
    fileNameKhongDau: string;
    fileSize: number;
    fileType: string;
    path: string;
    documentId?: string;
  }): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/UpdateCmFile', fileData);
  }

  generateUpdatedPdfFromBase64(data: {
    base64File: string;
    phieu: any;
    ngayPhatHanh?: string;
  }): Observable<any> {
    return this.commonService.post(
      'VanBanDiDonVi/GenerateUpdatedPdfFromBase64',
      data
    );
  }

  CapNhatFileMaHoa(params: any): Observable<any> {
    return this.commonService.post('VanBanDiDonVi/CapNhatFileMaHoa', params);
  }

saveFileMatOutgoing(fileId: string, newFileDto: any): Observable<any> {
  return this.commonService.post(
    `VanBanDiDonVi/SaveFileMatOutgoing?fileId=${fileId}`,
    newFileDto
  );
}

GetActivitiesByDocumentId(id:string): Observable<any> {
  return this.commonService.get(
    `VanBanDiDonVi/GetActivitiesByDocumentId?documentId=${id}`
  );
}

HuyFileKySo(params: { phieuId: string }): Observable<any> {
  const url = `VanBanDiDonVi/HuyFileKySo?phieuId=${params.phieuId}`;
  return this.commonService.put(url, {}); // body rỗng vì API không cần body
}

FindPositionsSignFromSavedCoordinates(params:any): Observable<any> {
  const url = `VanBanDiDonVi/find-positions-from-saved-coordinates`;
  return this.commonService.post(url,params);
}

  getHoSoCongViecById(id: string): Observable<any> {
    return this.commonService.get(`VanBanDiDonVi/GetHoSoCongViecById?id=${id}`)
  }

  convertDocxToPdfMobile(params: any): Observable<any> {
    return this.commonService.post(`KySoMobile/ConvertDocxToPdfMobile/${params}`, {});
  }

  checkPermissionFile(docId: any): Observable<any> {
    return this.commonService.post(`VanBanDiDonVi/CheckPermissionFile?docId=${docId}`, {});
  }
}
