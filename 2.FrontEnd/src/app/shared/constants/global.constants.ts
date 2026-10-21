export const BO_CONG_AN_CODE = 'G01';
export const ORG_V01 = 'G01.501.000.000';
export const LOAI_VAN_BAN_CONG_VAN = 18;
export const LOAI_VAN_BAN_NGHI_DINH_CODE = 'NĐ';
export const LOAI_VAN_BAN_CONG_VAN_CODE = 'CV';

export class BUCKET_NAME {
  static readonly BUCKET_PHIEU = 'qlvb-template-files';
  static readonly BUCKET_TIN_TUC = 'qlvb-news-files';
}
export class SEARCH_TAB_PHIEU_VAN_BAN_DEN {
  static readonly CHO_XU_LY = 10;
  static readonly DA_XU_LY = 15;
  static readonly DA_TRINH_KY_TPSL = 20;
  static readonly DA_KY_NHAY = 30;
  static readonly DA_TRINH_KY_LANH_DAO = 40;
  static readonly CHO_BAN_HANH = 50;
  static readonly TRA_LAI = 60;
  static readonly TRA_CUU = 70;
}

export class LOAI_PHIEU_VAN_BAN_DEN {
  static readonly PHIEU_TRINH = 10;
  static readonly PHIEU_THONG_BAO = 20;
}

export class LOAI_XU_LY_VB {
  static readonly XIN_Y_KIEN = 'XIN_Y_KIEN';
  static readonly XU_LY_CHINH = 'XU_LY_CHINH';
  static readonly PHOI_HOP = 'PHOI_HOP';
  static readonly DANH_GIA = 'DANH_GIA';
  static readonly NHAN_DE_BIET = 'NHAN_DE_BIET';
  static readonly THEO_DOI = 'THEO_DOI';
  static readonly TRA_LAI = 'TRA_LAI';
  static readonly TRA_CUU = 'TRA_CUU';
}

export class TRANG_THAI_PHIEU_VAN_BAN_DEN {
  static readonly KHOI_TAO: any = 5;
  static readonly CHO_KY_SO: any = 10;
  static readonly DA_KY_NHAY: any = 20;
  static readonly DA_KY_SO: any = 30;
  static readonly DA_COP_DAU = 35;
  static readonly DA_BAN_HANH: any = 40;
  static readonly HUY_PHIEU: any = 50;
}

export class TRANG_THAI_PHIEU_VAN_BAN_DI {
  static readonly KHOI_TAO: any = 10;
  static readonly CHO_KY: any = 20;
  static readonly DA_KY_NHAY: any = 25;
  static readonly DA_KY_SO: any = 30;
  static readonly DONG_DAU: any = 35;
  static readonly CHO_BAN_HANH: any = 40;
  static readonly DA_BAN_HANH: any = 50;
  static readonly TRA_LAI: any = 60;
  static readonly HUY_PHIEU: any = 70;
}

export class TRANG_THAI_XU_LY_PHIEU_VAN_BAN_DEN {
  static readonly KHOI_TAO: any = 5;
  static readonly DA_TRINH_KY_TPSL: any = 10;
  static readonly DA_KY_NHAY: any = 20;
  static readonly DA_TRINH_KY_LANH_DAO: any = 30;
  static readonly CHO_BAN_HANH: any = 40;
  static readonly TPSL_TRA_LAI: any = 50;
  static readonly LANH_DAO_TRA_LAI: any = 60;
  static readonly DA_BAN_HANH: any = 70;
  static readonly THU_HOI: any = 80;
}

export class FILE_ACTION_TYPE {
  static readonly GIU_NGUYEN = 10;
  static readonly THEM_FILE = 20;
  static readonly XOA_FILE = 30;
}

export class TRANG_THAI_VAN_BAN_DEN {
  static readonly CHUA_TIEP_NHAN = 10;
  static readonly DA_TIEP_NHAN = 15;
  static readonly DANG_XU_LY = 20;
  static readonly HOAN_THANH = 30;
  static readonly THU_HOI = 40;
  static readonly TRA_LAI = 50;
  static readonly TRA_CUU = 60;
  static readonly TU_CHOI = 70;

  static listAll = [
    { id: this.CHUA_TIEP_NHAN, name: 'Chưa tiếp nhận' },
    { id: this.DA_TIEP_NHAN, name: 'Đã tiếp nhận' },
    { id: this.DANG_XU_LY, name: 'Đang xử lý' },
    { id: this.HOAN_THANH, name: 'Hoàn thành' },
    { id: this.THU_HOI, name: 'Thu hồi' },
    { id: this.TRA_LAI, name: 'Trả lại' },
    { id: this.TU_CHOI, name: 'Từ chối' },
  ];

  static listAllColor = [
    { id: this.CHUA_TIEP_NHAN, name: 'error' },
    { id: this.DANG_XU_LY, name: 'processing' },
    { id: this.HOAN_THANH, name: 'success' },
    { id: this.DA_TIEP_NHAN, name: 'success' },
    { id: this.THU_HOI, name: 'default' },
    { id: this.TRA_LAI, name: 'default' },
    { id: this.TU_CHOI, name: 'default' },
  ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

  static getColor(id: number): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class TAB_INDEX_VAN_BAN_DI {
  static readonly DU_THAO = 1;
  static readonly TRA_CUU_DU_THAO_DA_TRINH_KY = 2;
  static readonly TRA_CUU_DU_THAO_CHO_BAN_HANH = 3;
  static readonly TRA_CUU_DU_THAO_DA_BAN_HANH = 4;

  static readonly XU_LY = 10;
  static readonly Y_KIEN_XU_LY = 11;
  static readonly NHAN_DE_BIET_XU_LY = 12;

  static readonly TRA_CUU_DA_XU_LY = 13;
  static readonly TRA_CUU_VB_TRINH_BO = 14;
  static readonly TRA_CUU_VAN_BAN_TRA_LAI_XU_LY = 15;
  static readonly TRA_CUU_DA_BAN_HANH_XU_LY = 16;
  static readonly TRA_CUU_XU_LY = 17;

  static readonly BAN_HANH = 20;
  static readonly CHO_BAN_HANH_BO = 21;
  static readonly CHO_BAN_HANH_OCR = 22;
  static readonly TRA_CUU_BAN_HANH = 23;
  static readonly TRA_LAI_BAN_HANH = 24;

  static readonly XIN_Y_KIEN = 30;
  static readonly CHO_Y_KIEN = 31;
  static readonly CHO_CHO_Y_KIEN = 32;
  static readonly DA_CHO_Y_KIEN = 33;
  static readonly CHUYEN_CHO_Y_KIEN = 34;

  static readonly THU_HOI = 40;

  static listAll = [
    { id: this.DU_THAO, name: 'Dự thảo' },
    { id: this.TRA_CUU_DU_THAO_DA_TRINH_KY, name: 'Tra cứu dự thảo đã trình ký' },
    { id: this.TRA_CUU_DU_THAO_CHO_BAN_HANH, name: 'Tra cứu dự thảo chờ ban hành' },
    { id: this.TRA_CUU_DU_THAO_DA_BAN_HANH, name: 'Tra cứu dự thảo đã ban hành' },

    { id: this.XU_LY, name: 'Xử lý' },
    { id: this.Y_KIEN_XU_LY, name: 'Ý kiến xử lý' },
    { id: this.NHAN_DE_BIET_XU_LY, name: 'Nhận để biết xử lý' },

    { id: this.TRA_CUU_DA_XU_LY, name: 'Tra cứu đã xử lý' },
    { id: this.TRA_CUU_VB_TRINH_BO, name: 'Tra cứu VB trình Bộ' },
    { id: this.TRA_CUU_VAN_BAN_TRA_LAI_XU_LY, name: 'Tra cứu VB trả lại xử lý' },
    { id: this.TRA_CUU_DA_BAN_HANH_XU_LY, name: 'Tra cứu đã ban hành xử lý' },
    { id: this.TRA_CUU_XU_LY, name: 'Tra cứu xử lý' },

    { id: this.BAN_HANH, name: 'Ban hành' },
    { id: this.CHO_BAN_HANH_BO, name: 'Chờ ban hành Bộ' },
    { id: this.CHO_BAN_HANH_OCR, name: 'Chờ ban hành OCR' },
    { id: this.TRA_CUU_BAN_HANH, name: 'Tra cứu ban hành' },
    { id: this.TRA_LAI_BAN_HANH, name: 'Trả lại ban hành' },

    { id: this.XIN_Y_KIEN, name: 'Xin ý kiến' },
    { id: this.CHO_Y_KIEN, name: 'Chờ ý kiến' },
    { id: this.CHO_CHO_Y_KIEN, name: 'Chờ cho ý kiến' },
    { id: this.DA_CHO_Y_KIEN, name: 'Đã chờ ý kiến' },
    { id: this.CHUYEN_CHO_Y_KIEN, name: 'Chuyển chờ ý kiến' },

    { id: this.THU_HOI, name: 'Thu hồi' }
  ];


  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

}

export class TRANG_THAI_VAN_BAN_DI {
  static readonly DU_THAO = 10;
  static readonly CHO_XU_LY = 20;
  static readonly DANG_THUC_HIEN = 25;
  static readonly TRA_LAI = 30;
  static readonly CHO_BAN_HANH = 39;
  static readonly DA_PHAT_HANH = 40;
  static readonly CAP_NHAT = 45;
  static readonly THU_HOI = 50;
  static readonly CHO_BAN_HANH_TO_TRINH = 59;
  static readonly BAN_HANH_TO_TRINH = 60;
  static readonly THAY_THE = 70;


  static listAll =
    [
      { id: this.DU_THAO, name: 'Dự thảo' },
      { id: this.CHO_XU_LY, name: 'Chờ xử lý' },
      { id: this.DANG_THUC_HIEN, name: 'Đang thực hiện' },
      { id: this.TRA_LAI, name: 'Trả lại' },
      { id: this.CHO_BAN_HANH, name: 'Chờ ban hành' },
      { id: this.DA_PHAT_HANH, name: 'Đã ban hành' },
      { id: this.CAP_NHAT, name: 'Cập nhật' },
      { id: this.THU_HOI, name: 'Thu hồi' },
      { id: this.CHO_BAN_HANH_TO_TRINH, name: 'Chờ ban hành tờ trình' },
      { id: this.BAN_HANH_TO_TRINH, name: 'Ban hành tờ trình' },
      { id: this.THAY_THE, name: 'Thay thế' }
    ];

  static listAllColor =
    [
      { id: this.DU_THAO, name: 'error' },
      { id: this.CHO_XU_LY, name: 'processing' },
      { id: this.DANG_THUC_HIEN, name: 'processing' },
      { id: this.TRA_LAI, name: 'default' },
      { id: this.CHO_BAN_HANH, name: 'error' },
      { id: this.DA_PHAT_HANH, name: 'success' },
      { id: this.CAP_NHAT, name: 'processing' },
      { id: this.THU_HOI, name: 'default' },
      { id: this.CHO_BAN_HANH_TO_TRINH, name: 'processing' },
      { id: this.BAN_HANH_TO_TRINH, name: 'success' },
      { id: this.THAY_THE, name: 'error' }
    ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

  static getColor(id: number): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class TRANG_THAI_ACTIVITY_VAN_BAN_DI {
  static readonly KHOI_TAO = 10;
  static readonly TRINH_KY = 20;
  static readonly THU_HOI = 25;
  static readonly CHUA_XU_LY = 30;
  static readonly DA_XU_LY = 40;
  static readonly TRA_LAI = 50;
  static readonly CHO_KY_NHAY = 60;
  static readonly DA_KY_NHAY = 70;
  static readonly CHO_KY = 80;
  static readonly DA_KY = 90;
  static readonly YEU_CAU_KY_NHAY = 100;
  static readonly DONG_Y_TO_TRINH = 110;
  static readonly CHO_BAN_HANH_TO_TRINH = 120;
  static readonly HOAN_THANH_DU_THAO = 130;
  static readonly CHO_BAN_HANH = 140;
  static readonly DONG_DAU = 145;
  static readonly BAN_HANH = 150;
  static readonly DE_NGHI_RA_SOAT_VB_PHAT_HANH = 160;

  static listAll =
    [
      { id: this.KHOI_TAO, name: 'Dự thảo' },
      { id: this.TRINH_KY, name: 'Đã trình ký' },
      { id: this.THU_HOI, name: 'Thu hồi' },
      { id: this.CHUA_XU_LY, name: 'Chờ xử lý' },
      { id: this.DA_XU_LY, name: 'Đã xử lý' },
      { id: this.TRA_LAI, name: 'Trả lại' },
      { id: this.CHO_KY_NHAY, name: 'Chờ ký nháy' },
      { id: this.DA_KY_NHAY, name: 'Đã ký nháy' },
      { id: this.CHO_KY, name: 'Chờ ký' },
      { id: this.DA_KY, name: 'Đã ký' },
      { id: this.YEU_CAU_KY_NHAY, name: 'Yêu cầu ký nháy' },
      { id: this.DONG_Y_TO_TRINH, name: 'Hoàn thành tờ trình' },
      { id: this.CHO_BAN_HANH_TO_TRINH, name: 'Chờ ban hành tờ trình' },
      { id: this.HOAN_THANH_DU_THAO, name: 'Hoàn thành dự thảo' },
      { id: this.CHO_BAN_HANH, name: 'Chờ ban hành' },
      { id: this.DONG_DAU, name: 'Đóng dấu' },
      { id: this.BAN_HANH, name: 'Ban hành' },
      { id: this.DE_NGHI_RA_SOAT_VB_PHAT_HANH, name: 'Đề nghị yêu cầu rà soát phát hành' },
    ];


  static listAllColor =
    [
      { id: this.KHOI_TAO, name: 'default' },
      { id: this.TRINH_KY, name: 'processing' },
      { id: this.THU_HOI, name: 'error' },
      { id: this.CHUA_XU_LY, name: 'processing' },
      { id: this.DA_XU_LY, name: 'success' },
      { id: this.TRA_LAI, name: 'error' },
      { id: this.CHO_KY_NHAY, name: 'processing' },
      { id: this.DA_KY_NHAY, name: 'success' },
      { id: this.CHO_KY, name: 'processing' },
      { id: this.DA_KY, name: 'success' },
      { id: this.YEU_CAU_KY_NHAY, name: 'success' },
      { id: this.DONG_Y_TO_TRINH, name: 'success' },
      { id: this.CHO_BAN_HANH_TO_TRINH, name: 'processing' },
      { id: this.HOAN_THANH_DU_THAO, name: 'success' },
      { id: this.CHO_BAN_HANH, name: 'processing' },
      { id: this.DONG_DAU, name: 'error' },
      { id: this.BAN_HANH, name: 'success' },
    ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }
  static getColor(id: number): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class LOAI_Y_KIEN {
  static readonly XIN_Y_KIEN = 10;
  static readonly CHO_Y_KIEN = 20;
  static readonly CHO_Y_KIEN_TU_DO = 30;
  static readonly CHUYEN_CHO_Y_KIEN = 40;
}

export class LOAI_VAN_BAN_BO {
  static readonly BO_VBT = 10;
  static readonly BO_THEO_DOI = 15;
  static readonly BO_VBTH = 20;
  static readonly BO_VBNDB = 30;
  static readonly BO_VBCT = 35;
  static readonly TRA_LAI = 39;
  static readonly TRA_CUU = 40;

  static listAll = [
    { id: 0, name: 'Chưa phân loại' },
    { id: this.BO_VBT, name: 'VB Trình' },
    { id: this.BO_VBTH, name: 'VB Thực hiện' },
    { id: this.BO_VBNDB, name: 'VB Nhận để biết' },
    { id: this.BO_VBCT, name: 'VB Chuyển tiếp' },
    // TRA_CUU không có trong danh sách hiển thị theo code gốc
  ];

  static getText(id: number): string {
    const found = this.listAll.find((x) => x.id === id);
    return found ? found.name : 'Chưa phân loại';
  }
}

export class LOAI_VAN_BAN_DON_VI {
  static readonly DV_VBNDB = 10;
  static readonly DV_VBXYK = 20;
  static readonly TRA_LAI = 25;
  static readonly TRA_CUU = 30;

  static listAll = [
    { id: 0, name: 'Chưa phân loại' },
    { id: this.DV_VBXYK, name: 'Văn bản xin ý kiến' },
    { id: this.DV_VBNDB, name: 'Văn bản nhận để biết' },
  ];

  static getText(id: number): string {
    const found = this.listAll.find((x) => x.id === id);
    return found ? found.name : '';
  }
}

export class LINH_VUC {
  static readonly QUY_PHAM_PHAP_LUAT = 10;
  static readonly HANH_CHINH = 20;
  static readonly VAN_BAN_DANG = 30;


  static listAll = [
    { id: this.QUY_PHAM_PHAP_LUAT, name: 'Quy phạm pháp luật' },
    { id: this.HANH_CHINH, name: 'Văn bản hành chính' },
    { id: this.VAN_BAN_DANG, name: 'Văn bản Đảng' },
  ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class PHUONG_THUC_NHAN {
  static readonly DIEN_TU = 10;
  static readonly GIAY = 20;

  static listAll = [
    { id: this.DIEN_TU, name: 'Điện tử' },
    { id: this.GIAY, name: 'Giấy' },
  ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class DO_MAT {
  static readonly THUONG = 10;
  static readonly MAT = 20;
  static readonly TOI_MAT = 30;
  static readonly TUYET_MAT = 40;

  static listAll = [
    { id: this.THUONG, name: 'Thường' },
    { id: this.MAT, name: 'Mật' },
    { id: this.TOI_MAT, name: 'Tối mật' },
    { id: this.TUYET_MAT, name: 'Tuyệt mật' },
  ];

  static listForBook = [
    { id: this.THUONG, name: 'Thường' },
    { id: this.MAT, name: 'Mật' }
  ];

  static getText(id: number): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class DO_KHAN {
  static readonly THUONG = 10;
  static readonly KHAN = 20;
  static readonly THUONG_KHAN = 30;
  static readonly HOA_TOC = 40;
  static readonly HOA_TOC_HEN_GIO = 50;

  static listAll = [
    { id: this.THUONG, name: 'Thường' },
    { id: this.KHAN, name: 'Khẩn' },
    { id: this.THUONG_KHAN, name: 'Thượng khẩn' },
    { id: this.HOA_TOC, name: 'Hỏa tốc' },
    { id: this.HOA_TOC_HEN_GIO, name: 'Hỏa tốc hẹn giờ' },
  ];

  static getText(id: number): string {
    const found = this.listAll.find((x) => x.id === id);
    return found ? found.name : '';
  }
}

export class HISTORY_ACTION_TYPE_VAN_BAN_DEN{
  static readonly TAO_MOI = 'TAO_MOI';
  static readonly HOAN_THANH = 'HOAN_THANH';
  static readonly XAC_NHAN_HOAN_THANH = 'XAC_NHAN_HOAN_THANH';
  static readonly THU_HOI = 'THU_HOI';
  static readonly KHOI_PHUC = 'KHOI_PHUC';
  static readonly TRA_LAI = 'TRA_LAI';
  static readonly TRA_LAI_VAN_THU = 'TRA_LAI_VAN_THU';
  static readonly NHAN_TRA_LAI = 'NHAN_TRA_LAI';
  static readonly XU_LY_LAI = 'XU_LY_LAI';
  static readonly CAP_NHAT_THONG_TIN = 'CAP_NHAT_THONG_TIN';
  static readonly DUYET_PHUONG_AN = 'DUYET_PHUONG_AN';
  static readonly CHI_DAO = 'CHI_DAO';
  static readonly Y_KIEN = 'Y_KIEN';
  static readonly CHUYEN_XIN_Y_KIEN = 'CHUYEN_XIN_Y_KIEN';
  static readonly CHUYEN_CAP_DUOI_XU_LY = 'CHUYEN_CAP_DUOI_XU_LY';
  static readonly DA_XEM = 'DA_XEM'; // Người dùng tích Đã xem trên công việc
  static readonly VAO_XEM_CHI_TIET = 'VAO_XEM_CHI_TIET'; // Lưu trữ trạng thái các lần vào xem chi tiết một văn bản
  static readonly CHUYEN_TIEP_VAN_BAN = 'CHUYEN_TIEP_VAN_BAN'; // Chuyển tiếp văn bản
}

export class VAI_TRO {
  // Lãnh đạo cấp Bộ
  static readonly BO_TRUONG = 'BO_TRUONG'; // Bộ trưởng
  static readonly THU_TRUONG = 'THU_TRUONG'; // Thứ trưởng
  static readonly THU_TRUONG_PHU_TRACH = 'THU_TRUONG_PHU_TRACH'; // Thứ trưởng phụ trách
  static readonly THU_KY_LANH_DAO_BO = 'THU_KY_LANH_DAO_BO'; // Thư ký lãnh đạo bộ

  // Tổng cục
  static readonly TONG_CUC_TRUONG = 'TONG_CUC_TRUONG'; // Tổng cục trưởng
  static readonly PHO_TONG_CUC_TRUONG = 'PHO_TONG_CUC_TRUONG'; // Phó Tổng cục trưởng
  static readonly VU_TRUONG = 'VU_TRUONG'; // Vụ trưởng
  static readonly PHO_VU_TRUONG = 'PHO_VU_TRUONG'; // Phó Vụ trưởng

  // Cục
  static readonly CUC_TRUONG = 'CUC_TRUONG'; // Cục trưởng
  static readonly PHO_CUC_TRUONG = 'PHO_CUC_TRUONG'; // Phó Cục trưởng
  static readonly PHO_CUC_TRUONG_PHU_TRACH = 'PHO_CUC_TRUONG_PHU_TRACH'; // Phó Cục trưởng phụ trách

  // Công an tỉnh/thành
  static readonly GIAM_DOC = 'GIAM_DOC'; // Giám đốc
  static readonly PHO_GIAM_DOC = 'PHO_GIAM_DOC'; // Phó Giám đốc
  static readonly PHO_GIAM_DOC_PHU_TRACH = 'PHO_GIAM_DOC_PHU_TRACH'; // Phó Giám đốc phụ trách


  static readonly HIEU_TRUONG = 'HIEU_TRUONG';
  static readonly PHO_HIEU_TRUONG = 'PHO_HIEU_TRUONG';
  static readonly PHO_HIEU_TRUONG_PHU_TRACH = 'PHO_HIEU_TRUONG_PHU_TRACH'; // Phó Hiệu trưởng Phụ trách

  static readonly TU_LENH = 'TU_LENH';
  static readonly PHO_TU_LENH = 'PHO_TU_LENH';
  static readonly PHO_TU_LENH_PHU_TRACH = 'PHO_TU_LENH_PHU_TRACH'; // Phó Tư lệnh phụ trách

  static readonly VIEN_TRUONG = 'VIEN_TRUONG';
  static readonly PHO_VIEN_TRUONG = 'PHO_VIEN_TRUONG';
  static readonly PHO_VIEN_TRUONG_PHU_TRACH = 'PHO_VIEN_TRUONG_PHU_TRACH'; // Phó Viện trưởng phụ trách

  // Cấp phòng
  static readonly CHANH_VAN_PHONG = 'CHANH_VAN_PHONG'; // Chánh Văn phòng
  static readonly PHO_CHANH_VAN_PHONG = 'PHO_CHANH_VAN_PHONG'; // Phó Chánh Văn phòng
  static readonly PHO_CHANH_VAN_PHONG_PHU_TRACH = 'PHO_CHANH_VAN_PHONG_PHU_TRACH'; // Phó Chánh Văn Phòng Phụ Trách

  static readonly GIAM_DOC_CONG = 'GIAM_DOC_CONG';
  static readonly PHO_GIAM_DOC_CONG = 'PHO_GIAM_DOC_CONG';

  static readonly GIAM_DOC_TTTTCH = 'GIAM_DOC_TTTTCH';
  static readonly PHO_GIAM_DOC_TTTTCH = 'PHO_GIAM_DOC_TTTTCH';


  static readonly TRUONG_PHONG = 'TRUONG_PHONG'; // Trưởng phòng
  static readonly PHO_TRUONG_PHONG = 'PHO_TRUONG_PHONG'; // Phó Trưởng phòng
  static readonly PHO_TRUONG_PHONG_PHU_TRACH = 'PHO_TRUONG_PHONG_PHU_TRACH'; // Phó Trưởng phòng phụ trách

  static readonly GIAM_THI = 'GIAM_THI'; // Giám thị
  static readonly PHO_GIAM_THI = 'PHO_GIAM_THI'; // Phó Giám thị
  static readonly PHO_GIAM_THI_PHU_TRACH = 'PHO_GIAM_THI_PHU_TRACH'; // Phó Giám thị phụ trách

  static readonly TRUONG_KHOA = 'TRUONG_KHOA'; // Trưởng khoa
  static readonly PHO_TRUONG_KHOA = 'PHO_TRUONG_KHOA'; // Phó Trưởng khoa
  static readonly PHO_TRUONG_KHOA_PHU_TRACH = 'PHO_TRUONG_KHOA_PHU_TRACH'; // Phó Trưởng khoa phụ trách

  static readonly TRUONG_CONG_AN_XA = 'TRUONG_CONG_AN_XA'; // Trưởng công an xã
  static readonly PHO_TRUONG_CONG_AN_XA = 'PHO_TRUONG_CONG_AN_XA'; // Phó Trưởng công an xã
  static readonly PHO_TRUONG_CAX_PHU_TRACH = 'PHO_TRUONG_CAX_PHU_TRACH'; // Phó Trưởng CAX Phụ trách
  static readonly PHO_TRUONG_CAP_PHU_TRACH = 'PHO_TRUONG_CAP_PHU_TRACH'; // Phó Trưởng CAP phụ trách

  static readonly DOI_TRUONG = 'DOI_TRUONG'; // Đội trưởng
  static readonly PHO_DOI_TRUONG = 'PHO_DOI_TRUONG'; // Phó Đội trưởng
  static readonly PHO_DOI_TRUONG_PHU_TRACH = 'PHO_DOI_TRUONG_PHU_TRACH'; // Phó Đội trưởng phụ trách

  // Cấp đội
  static readonly TRUONG_BAN = 'TRUONG_BAN'; // Đội trưởng
  static readonly PHO_TRUONG_BAN = 'PHO_TRUONG_BAN'; // Phó Đội trưởng
  static readonly PHO_TRUONG_BAN_PHU_TRACH = 'PHO_TRUONG_BAN_PHU_TRACH'; // Phó Trưởng ban phụ trách

  // Cấp tổ, xã
  static readonly TO_TRUONG = 'TO_TRUONG'; // Tổ trưởng
  static readonly PHO_TO_TRUONG = 'PHO_TO_TRUONG'; // Phó Tổ trưởng


  // Cán bộ, chiến sĩ, hỗ trợ
  static readonly CAN_BO = 'CAN_BO'; // Cán bộ
  static readonly CHIEN_SI = 'CHIEN_SI'; // Chiến sĩ
  static readonly VAN_THU = 'VAN_THU'; // Văn thư
  static readonly THU_KY = 'THU_KY'; // Thư ký
  static readonly KE_TOAN = 'KE_TOAN'; // Kế toán
  static readonly TRO_LY = 'TRO_LY'; // Trợ lý
  static readonly NHAN_VIEN = 'NHAN_VIEN'; // Nhân viên

  // Hệ thống
  static readonly ADMIN = 'ADMIN'; // Quản trị hệ thống
  static readonly SUPER_ADMIN = 'SUPER_ADMIN'; // Quản trị cấp cao nhất


  static listAll(): { id: string; name: string }[] {
    return [
      { id: this.BO_TRUONG, name: 'Bộ trưởng' },
      { id: this.THU_TRUONG, name: 'Thứ trưởng' },
      { id: this.THU_TRUONG_PHU_TRACH, name: 'Thứ trưởng phụ trách' },
      { id: this.THU_KY_LANH_DAO_BO, name: 'Thư ký lãnh đạo bộ' },

      { id: this.TONG_CUC_TRUONG, name: 'Tổng cục trưởng' },
      { id: this.PHO_TONG_CUC_TRUONG, name: 'Phó Tổng cục trưởng' },
      { id: this.VU_TRUONG, name: 'Vụ trưởng' },
      { id: this.PHO_VU_TRUONG, name: 'Phó Vụ trưởng' },

      { id: this.CUC_TRUONG, name: 'Cục trưởng' },
      { id: this.PHO_CUC_TRUONG, name: 'Phó Cục trưởng' },
      { id: this.PHO_CUC_TRUONG_PHU_TRACH, name: 'Phó Cục trưởng phụ Trách' },

      { id: this.GIAM_DOC, name: 'Giám đốc' },
      { id: this.PHO_GIAM_DOC, name: 'Phó Giám đốc' },
      { id: this.PHO_GIAM_DOC_PHU_TRACH, name: 'Phó Giám đốc phụ trách' },

      { id: this.HIEU_TRUONG, name: 'Hiệu trưởng' },
      { id: this.PHO_HIEU_TRUONG, name: 'Phó Hiệu trưởng' },
      { id: this.PHO_HIEU_TRUONG_PHU_TRACH, name: 'Phó Hiệu trưởng Phụ trách' },

      { id: this.TU_LENH, name: 'Tư lệnh' },
      { id: this.PHO_TU_LENH, name: 'Phó Tư lệnh' },
      { id: this.PHO_TU_LENH_PHU_TRACH, name: 'Phó Tư lệnh phụ trách' },

      { id: this.VIEN_TRUONG, name: 'Viện trưởng' },
      { id: this.PHO_VIEN_TRUONG, name: 'Phó Viện trưởng' },
      { id: this.PHO_VIEN_TRUONG_PHU_TRACH, name: 'Phó Viện trưởng phụ trách' },

      { id: this.CHANH_VAN_PHONG, name: 'Chánh Văn phòng' },
      { id: this.PHO_CHANH_VAN_PHONG, name: 'Phó Chánh Văn phòng' },
      { id: this.PHO_CHANH_VAN_PHONG_PHU_TRACH, name: 'Phó Chánh Văn Phòng Phụ Trách' },

      { id: this.GIAM_DOC_CONG, name: 'Giám Đốc CTTDT' },
      { id: this.PHO_GIAM_DOC_CONG, name: 'Phó Giám Đốc CTTDT' },

      { id: this.GIAM_DOC_TTTTCH, name: 'Giám đốc TTTTCH' },
      { id: this.PHO_GIAM_DOC_TTTTCH, name: 'Phó Giám đốc TTTTCH' },

      { id: this.GIAM_DOC_TTTTCH, name: 'Giám đốc Trung tâm' },
      { id: this.PHO_GIAM_DOC_TTTTCH, name: 'Phó Giám đốc Trung tâm' },

      { id: this.TRUONG_CONG_AN_XA, name: 'Trưởng Công an xã/phường' },
      { id: this.PHO_TRUONG_CONG_AN_XA, name: 'Phó Trưởng Công an xã/phường' },
      { id: this.PHO_TRUONG_CAX_PHU_TRACH, name: 'Phó Trưởng CAX Phụ trách' },
      { id: this.PHO_TRUONG_CAP_PHU_TRACH, name: 'Phó Trưởng CAP phụ trách' },

      { id: this.TRUONG_PHONG, name: 'Trưởng phòng' },
      { id: this.PHO_TRUONG_PHONG, name: 'Phó Trưởng phòng' },
      { id: this.PHO_TRUONG_PHONG_PHU_TRACH, name: 'Phó Trưởng phòng phụ trách' },

      { id: this.DOI_TRUONG, name: 'Đội trưởng' },
      { id: this.PHO_DOI_TRUONG, name: 'Phó Đội trưởng' },
      { id: this.PHO_DOI_TRUONG_PHU_TRACH, name: 'Phó Đội trưởng phụ trách' },

      { id: this.TRUONG_BAN, name: 'Trưởng ban' },
      { id: this.PHO_TRUONG_BAN, name: 'Phó Trưởng ban' },
      { id: this.PHO_TRUONG_BAN_PHU_TRACH, name: 'Phó Trưởng ban phụ trách' },

      { id: this.TO_TRUONG, name: 'Tổ trưởng' },
      { id: this.PHO_TO_TRUONG, name: 'Phó Tổ trưởng' },

      { id: this.GIAM_THI, name: 'Giám thị' },
      { id: this.PHO_GIAM_THI, name: 'Phó Giám thị' },
      { id: this.PHO_GIAM_THI_PHU_TRACH, name: 'Phó Giám thị phụ trách' },


      { id: this.CAN_BO, name: 'Cán bộ' },
      { id: this.CHIEN_SI, name: 'Chiến sĩ' },
      { id: this.VAN_THU, name: 'Văn thư' },
      { id: this.THU_KY, name: 'Thư ký' },
      { id: this.KE_TOAN, name: 'Kế toán' },
      { id: this.TRO_LY, name: 'Trợ lý' },
      { id: this.NHAN_VIEN, name: 'Nhân viên' },

      { id: this.ADMIN, name: 'Quản trị hệ thống' },
      { id: this.SUPER_ADMIN, name: 'Quản trị cấp cao nhất' },
      { id: this.TRUONG_KHOA, name: 'Trưởng khoa' },
      { id: this.PHO_TRUONG_KHOA, name: 'Phó Trưởng khoa' },
      { id: this.PHO_TRUONG_KHOA_PHU_TRACH, name: 'Phó Trưởng khoa phụ trách' },
      { id: this.GIAM_THI, name: 'Giám thị' },
      { id: this.PHO_GIAM_THI, name: 'Phó Giám thị' },
      { id: this.PHO_GIAM_THI_PHU_TRACH, name: 'Phó Giám thị phụ trách' },
    ];
  }

  static getText(id: string): string {
    const item = this.listAll().find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class FILTER_TAG_VAN_BAN_DEN {
  static readonly KHAN = 10;
  static readonly CO_HAN = 20;
  static readonly CON_HAN = 21;
  static readonly SAP_DEN_HAN = 22;
  static readonly HET_HAN = 23;
  static readonly DANG_XU_LY = 24;
  static readonly CHO_DANH_GIA = 25;
  static readonly KHAC = 30;
  static readonly CON_3_NGAY = 3;
  static readonly CON_5_NGAY = 5;
  static readonly CON_7_NGAY = 7;


  static listAll(): { id: number; name: string }[] {
    return [
      { id: this.KHAN, name: 'Văn bản khẩn' },
      { id: this.CO_HAN, name: 'Văn bản có hạn' },
      { id: this.CON_HAN, name: 'Văn bản còn hạn' },
      { id: this.SAP_DEN_HAN, name: 'Văn bản đến hạn' },
      { id: this.HET_HAN, name: 'Văn bản hết hạn' },
      { id: this.KHAC, name: 'Văn bản khác' },
      { id: this.CON_3_NGAY, name: 'Văn bản còn hạn 3 ngày' },
      { id: this.CON_5_NGAY, name: 'Văn bản còn hạn 5 ngày' },
      { id: this.CON_7_NGAY, name: 'Văn bản còn hạn 7 ngày' },
    ];
  }

  static getText(id: number): string {
    const item = this.listAll().find((x) => x.id === id);
    return item ? item.name : '';
  }
}
export class FILTER_LOAI_PHIEU
{
  static readonly PHIEU_TRINH_LANH_DAO_BO = 1;
  static readonly PHIEU_CHUYEN = 2;
  static readonly PHIEU_SAO_Y = 3;
  static readonly VB_NHAN_DE_BIET = 4;
}
export class ACTIVITY_TYPE_VAN_BAN_DEN {
  static readonly TIEP_NHAN = 10;
  static readonly DIEU_HANH = 20;
  static readonly CHI_DAO = 25;
  static readonly XU_LY_CV = 30;
  static readonly THEO_DOI = 40;
  static readonly LUU_TRA_CUU = 60;

  static listAll(): { id: number; name: string }[] {
    return [
      { id: this.TIEP_NHAN, name: 'Tiếp nhận' },
      { id: this.DIEU_HANH, name: 'Điều hành' },
      { id: this.XU_LY_CV, name: 'Xử lý công việc' },
      { id: this.THEO_DOI, name: 'Theo dõi' },
      { id: this.LUU_TRA_CUU, name: 'Lưu tra cứu' },
    ];
  }

  static getText(id: number): string {
    const item = this.listAll().find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export enum TAB_INDEX {
  BAN_HANH = 20,
  VAN_BAN_TRINH_BO = 21,
  CHO_BAN_HANH_TRAM_QUET = 22,
  DA_BAN_HANH = 23,
  VAN_BAN_TRA_LAI = 24,
  CHO_SO_NHANH = 25
}

export class TRANG_THAI_TRUC_LGSP {
  static readonly CHO_GUI_TRANG_THAI = "CHO_GUI_TRANG_THAI";
  static readonly DA_GUI_TRANG_THAI = "DA_GUI_TRANG_THAI";
  static readonly DA_TIEP_NHAN = "DA_TIEP_NHAN";
  static readonly CHUA_TIEP_NHAN = "CHUA_TIEP_NHAN";
  static readonly CHO_GUI_DI = "CHO_GUI_DI";
  static readonly DA_GUI_LEN_TRUC = "DA_GUI_LEN_TRUC";
  static listAll = [
    { id: this.CHO_GUI_TRANG_THAI, name: 'Chờ gửi trạng thái' },
    { id: this.DA_GUI_TRANG_THAI, name: 'Đã gửi trạng thái' },
    { id: this.DA_TIEP_NHAN, name: 'Đã tiếp nhận' },
    { id: this.CHUA_TIEP_NHAN, name: 'Chưa tiếp nhận' },
    { id: this.CHO_GUI_DI, name: 'Chờ gửi đi' },
    { id: this.DA_GUI_LEN_TRUC, name: 'Đã gửi lên trục' },

  ];

  static listAllColor = [
    { id: this.CHO_GUI_TRANG_THAI, name: 'processing' },
    { id: this.DA_GUI_TRANG_THAI, name: 'success' },
    { id: this.DA_TIEP_NHAN, name: 'success' },
    { id: this.CHUA_TIEP_NHAN, name: 'error' },
    { id: this.CHO_GUI_DI, name: 'processing' },
    { id: this.DA_GUI_LEN_TRUC, name: 'success' },
  ];

  static getText(id: string): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

  static getColor(id: string): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}


export class ACTION_TYPE_PHIEU_VERSION {
  static readonly TAO_MOI = 10;
  static readonly CHINH_SUA = 20;
  static readonly KY_SO = 30;
  static readonly HOAN_THANH_DU_THAO = 40;
  static readonly DONG_DAU = 50;
}


export class TRANG_THAI_VAN_BAN_LOG_LGSP {
  static readonly CHUA_TIEP_NHAN = "CHUA_TIEP_NHAN";
  static readonly DA_TIEP_NHAN = "DA_TIEP_NHAN";
  static readonly DANG_XU_LY = "DANG_XU_LY";
  static readonly HOAN_THANH = "HOAN_THANH";
  static readonly TU_CHOI = "TU_CHOI";
  static readonly TRA_LAI = "TRA_LAI";
  static listAll =
    [
      { id: this.CHUA_TIEP_NHAN, name: 'Chưa tiếp nhận' },
      { id: this.DA_TIEP_NHAN, name: 'Đã tiếp nhận' },
      { id: this.DANG_XU_LY, name: 'Đang xử lý' },
      { id: this.HOAN_THANH, name: 'Hoàn thành' },
      { id: this.TU_CHOI, name: 'Từ chối' },
      { id: this.TRA_LAI, name: 'Trả lại' },

    ];

  static listAllColor =
    [
      { id: this.CHUA_TIEP_NHAN, name: 'error' },
      { id: this.DA_TIEP_NHAN, name: 'success' },
      { id: this.DANG_XU_LY, name: 'processing' },
      { id: this.HOAN_THANH, name: 'success' },
      { id: this.TU_CHOI, name: 'default' },
      { id: this.TRA_LAI, name: 'default' },
    ];

  static getText(id: string): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

  static getColor(id: string): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}


export class LOAI_NGHIEP_VU_LGSP {
  static readonly GUI_NHAN = "GUI_NHAN";
  static readonly CAP_NHAT = "CAP_NHAT";
  static readonly LAY_LAI = "LAY_LAI";
  static readonly THU_HOI = "THU_HOI";
  static readonly THAY_THE = "THAY_THE";
  static readonly TU_CHOI = "TU_CHOI";
  static readonly GUI_NHAN_TRANG_THAI = "GUI_NHAN_TRANG_THAI";

  static listAll =
    [
      { id: this.GUI_NHAN, name: 'Gửi nhận' },
      { id: this.CAP_NHAT, name: 'Cập nhật' },
      { id: this.LAY_LAI, name: 'Lấy lại' },
      { id: this.THU_HOI, name: 'Thu hồi' },
      { id: this.THAY_THE, name: 'Thay thế' },
      { id: this.TU_CHOI, name: 'Từ chối' },
      { id: this.GUI_NHAN_TRANG_THAI, name: 'Gửi nhận trạng thái' },
    ];

  static listAllColor =
    [
      { id: this.GUI_NHAN, name: 'success' },
      { id: this.CAP_NHAT, name: 'processing' },
      { id: this.LAY_LAI, name: 'default' },
      { id: this.THU_HOI, name: 'default' },
      { id: this.THAY_THE, name: 'processing' },
      { id: this.TU_CHOI, name: 'default' },
      { id: this.GUI_NHAN_TRANG_THAI, name: 'success' },
    ];

  static getText(id: string): string {
    const item = this.listAll.find((x) => x.id === id);
    return item ? item.name : '';
  }

  static getColor(id: string): string {
    const item = this.listAllColor.find((x) => x.id === id);
    return item ? item.name : '';
  }
}

export class TRANG_THAI_XU_LY_LGSP {
  static readonly CHUA_TIEP_NHAN = "CHUA_TIEP_NHAN";
  static readonly DA_TIEP_NHAN = "DA_TIEP_NHAN";
  static readonly DA_TAO_FILE_EDXML = "DA_TAO_FILE_EDXML";
  static readonly CHUA_TAO_FILE_EDXML = "CHUA_TAO_FILE_EDXML";
  static readonly DA_TIEP_NHAN_VAN_BAN = "DA_TIEP_NHAN_VAN_BAN";
  static readonly DA_TIEP_NHAN_MOT_PHAN = "DA_TIEP_NHAN_MOT_PHAN";
  static readonly DA_GUI_LEN_TRUC = "DA_GUI_LEN_TRUC";
  static readonly TIEP_NHAN_THANH_CONG = "TIEP_NHAN_THANH_CONG";
  static readonly GUI_THAT_BAI = "GUI_THAT_BAI";

  static listAll =
    [
      { id: this.CHUA_TIEP_NHAN, name: 'Chưa tiếp nhận' },
      { id: this.DA_TIEP_NHAN, name: 'Đã tiếp nhận' },
      { id: this.DA_TAO_FILE_EDXML, name: 'Đã tạo file EDXML' },
      { id: this.CHUA_TAO_FILE_EDXML, name: 'Chưa tạo file EDXML' },
      { id: this.DA_TIEP_NHAN_VAN_BAN, name: 'Đã tiếp nhận văn bản' },
      { id: this.DA_TIEP_NHAN_MOT_PHAN, name: 'Đã tiếp nhận một phần' },
      { id: this.DA_GUI_LEN_TRUC, name: 'Đã gửi lên trục' },
      { id: this.TIEP_NHAN_THANH_CONG, name: 'Tiếp nhận thành công' },
      { id: this.GUI_THAT_BAI, name: 'Gửi thất bại' },
    ];
}


export class TRANG_THAI_NOI_NHAN_XU_LY {
  static readonly CHUA_TIEP_NHAN = 0;
  static readonly DA_TIEP_NHAN = 1;
  static readonly TRA_LAI = 2;
  static readonly LAY_LAI = 3;
  static readonly THU_HOI = 4;
  static readonly TU_CHOI_TIEP_NHAN = 5;
  static readonly THAY_THE = 6;
  static readonly DA_DEN = 7;
}

export class LOAI_VAN_BAN_LOG {
  static readonly VAN_BAN_DEN = 2;
  static readonly VAN_BAN_DI = 3;
  static readonly VAN_BAN_CHUYEN_TIEP = 4;
  static readonly VAN_BAN_DI_CHUA_TAO_EDXML = 6;
  static readonly VAN_BAN_CHUYEN_TIEP_CHUA_TAO_EDXML = 7;
}

export class DO_MAT_LOAI_VAN_BAN {
  static readonly VAN_BAN_THUONG = 1;
  static readonly VAN_BAN_MAT = 2;

  static listAll =
    [
      { id: this.VAN_BAN_THUONG, name: 'Văn bản thường' },
      { id: this.VAN_BAN_MAT, name: 'Văn bản mật' },
    ];
}

export class VAI_TRO_XU_LY {
  static readonly XU_LY_CHINH = "XU_LY_CHINH";
  static readonly NHAN_DE_BIET = "NHAN_DE_BIET";
  static readonly PHOI_HOP = "PHOI_HOP";


  static listAll = [
    { id: this.XU_LY_CHINH, name: 'Chỉ đạo/Xử lý chính' },
    { id: this.PHOI_HOP, name: 'Phối hợp' },
    { id: this.NHAN_DE_BIET, name: 'Nhận để biết' }
  ];
}
export const QUYEN_XEM_CAP_CUC = 'R5.1.12';
