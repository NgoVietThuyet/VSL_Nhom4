
export class OrganizeModel {
  isNgoaiNganh?: any;
  isTrucThuoc? : any;
  id? : any;
  khoiDonViId?: any[] | any;
  khoiNgoaiNganhId?: any[] | any;
}

export class OrganizeFilter {
    CurrentPage: number = 1;
    PageSize: number = 50;
    KeyWord: string = '';
    DataFilter: OrganizeModel = new OrganizeModel()
}
