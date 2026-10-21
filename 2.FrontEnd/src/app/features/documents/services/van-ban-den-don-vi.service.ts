import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from '../../../core';


@Injectable({
    providedIn: 'root',
})
export class VanBanDenDonViService {
    constructor(private commonService: CommonService,
        private http: HttpClient,
        private env : EnvironmentService
    ) { }

    searchTiepNhan(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/SearchTiepNhan',
            params
        );
    }
    daXem(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenBo/DaXem',
            params
        );
    }

    searchSoLoai(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/SearchSoLoai',
            params
        );
    }

    tuChoi(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/TuChoi ',
            params
        );
    }

    searchXuLy(params: any): Observable<any> {
        return this.commonService.post('VanBanDenDonVi/SearchXuLy', params);
    }

    quaTrinhGuiNhan(documentId: any, activityId: any, currentId: any): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/QuaTrinhGuiNhan?documentId=${documentId}&activityId=${activityId}&currentId=${currentId}`,
        );
    }

    thongTinChiTiet(actId: any, trangThaiUyQuyen: any = "0"): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/ThongTinChiTiet?actId=${actId}&trangThaiUyQuyen=${trangThaiUyQuyen}`,
        );
    }

    getListYKien(actId: any): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/getListYKien?actId=${actId}`,
        );
    }

    getListYKienByDocId(docId: any): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/getListYKienByDocId?docId=${docId}`,
        );
    }

    xemChiTiet(documentId: any): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/XemChiTiet?documentId=${documentId}`,
        );
    }

    repareCert(params: any): Observable<any> {
        return this.commonService.get('VanBanDenDonVi/RepareCert?documentId=' + params);
    }

    chuyenXuLy(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/ChuyenXuLy',
            params, true, true
        );
    }

    hoanThanhXuLy(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/HoanThanhXuLy',
            params
        );
    }



    buildTreePlan(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/BuildTreePlan',
            params
        );
    }

    phanLoaiMultil(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenBo/PhanLoaiMultil',
            params
        );
    }

    chuyenCapDuoiXuLy(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/ChuyenCapDuoiXuLy',
            params
        );
    }

    chuyenTiepVanBan(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/ChuyenTiepVanBan',
            params, true, true
        );
    }

    duyetPhuongAn(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/DuyetPhuongAn',
            params, true, true
        );
    }

    taoMoiThongTin(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/TaoMoiThongTin',
            params
        );
    }

    capNhatThongTin(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/CapNhatThongTin',
            params
        );
    }

    getMasterData(orgCode: any, username: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/GetMasterData?orgCode=${orgCode}&username=${username}`);
    }

    getInfoOrgOfDocument(orgId: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/getInfoOrgOfDocument?orgId=${orgId}`);
    }

    getRoleFromWorkflowDieuHanh(orgCode: any, currentRole: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/GetRoleFromWorkflowDieuHanh?orgCode=${orgCode}&currentRole=${currentRole}`);
    }

    getUserFromWorkflowXuLyCongViec(orgCode: any, currentRole: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/GetUserFromWorkflowXuLyCongViec?orgCode=${orgCode}&currentRole=${currentRole}`);
    }

    uploadFile(data: any): Observable<any> {
        return this.commonService.post(
            'File/UploadMultiple', data
        );
    }

    uploadFileBase64(data: any): Observable<any> {
        return this.commonService.post(
            'File/UploadBase64', data
        );
    }

    downloadFileBase64(data: any): Observable<any> {
        return this.commonService.get(
            `File/DownloadDirectBase64/${data}`,
        );
    }

    downloadFile(data: any): Observable<any> {

        return this.http.get(`${this.env.getEnv('apiUrl')}/DownloadDirect/${data}`, {
            responseType: 'blob' as 'json',
            observe: 'response'
        });
    }

    getUserHandle(roleCode: any, orgCode: any, isSoLoaiVanBan: boolean): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/GetUserHandle?roleCode=${roleCode}&orgCode=${orgCode}&isSoLoaiVanBan=${isSoLoaiVanBan ? true : false}`,
        );
    }

    thuHoi(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/ThuHoi',
            params
        );
    }

    khoiPhuc(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/KhoiPhuc',
            params
        );
    }

    lanhDaoChiDao(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/lanhDaoChiDao',
            params
        );
    }

    traLai(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/TraLai',
            params
        );
    }

    luuTraCuu(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/LuuTraCuu',
            params, true, true
        );
    }

    luuSo(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/LuuSo',
            params
        );
    }


    xuLyLai(params: any): Observable<any> {
        return this.commonService.put(
            'VanBanDenDonVi/XuLyLai',
            params
        );
    }
    getAllDocumentActive(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/GetAllDocumentActive',
            params
        );
    }

    getDocumentsActiveByIds(params: any): Observable<any> {
        return this.commonService.post('VanBanDenDonVi/GetDocumentsActiveIncomingByIds', params);
    }

    taoMoiYKien(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/TaoMoiYKien',
            params
        );
    }

    laySoVanBanDen(bookId: any): Observable<any> {
        return this.commonService.get(
            `VanBanDenDonVi/LaySoVanBan?bookId=${bookId}`,
        );
    }

    xacNhanHoanThanh(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/XacNhanHoanThanh',
            params
        );
    }

    updateFileDefault(documentId: any, fileId: any): Observable<any> {
        return this.commonService.post(`File/UpdateFileDefault?documentId=${documentId}&fileId=${fileId}`, {});
    }

    xoaVanBan(documentId: string): Observable<any> {
        return this.commonService.delete(`VanBanDenBo/XoaVanBan?documentId=${documentId}`);
    }

    danhGiaHoanThanh(actId: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/TheoDoiDanhGia?activityId=${actId}`);
    }

    theoDoiCapTrenXuLy(actId: any): Observable<any> {
        return this.commonService.get(`VanBanDenDonVi/TheoDoiCapTrenXuLy?activityId=${actId}`);
    }

    convertDocxToPdfMobile(params: any): Observable<any> {
    return this.commonService.post(`KySoMobile/ConvertDocxToPdfMobile/${params}`, {});
  }

    themLyXuLy(params: any): Observable<any> {
        return this.commonService.post(
            'VanBanDenDonVi/ThemXuLy',
            params
        );
    }
}
