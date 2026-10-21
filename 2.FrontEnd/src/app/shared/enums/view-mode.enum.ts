export enum ViewMode {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  VIEW = 'VIEW'
} 

//#region Nơi nhận xử lý 
export enum CollapseTypeEnum {
  ngoaiNganh = 'ngoaiNganh',    
  noiNganh = 'noiNganh',         
  noiNhanDeBiet = 'noiNhanDeBiet',   
  nguoiNhanXuLy = 'nguoiNhanXuLy',         
  donViNoiBo = 'donViNoiBo'             
}

export enum TrangThaiNoiNhanXuLyEnum {
  CHUA_TIEP_NHAN = 0,
  DA_TIEP_NHAN = 1,
  TRA_LAI = 2,
  LAY_LAI = 3,
  THU_HOI = 4,
  THAY_THE = 5,
  TU_CHOI = 6
}
//#endregion