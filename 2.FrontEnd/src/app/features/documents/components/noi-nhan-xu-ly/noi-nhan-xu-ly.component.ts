import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, debounceTime, firstValueFrom } from 'rxjs';
import { GlobalService } from '../../../../core';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { CollapseTypeEnum, TrangThaiNoiNhanXuLyEnum, ViewMode } from '../../../../shared/enums/view-mode.enum';
import * as GlobalConstants from '../../../../shared/constants/global.constants';
import { OrganizationalUnitService } from '../../../master-data/services/organizational-unit.service';
import { OrganizationalOutService } from '../../../master-data/services/organizational-out.service';

@Component({
  selector: 'app-noi-nhan-xu-ly',
  imports: [SharedModules],
  templateUrl: './noi-nhan-xu-ly.component.html',
  styleUrls: [],
})
export class NoiNhanXuLyComponent implements OnInit {
  @Input() organizes: any[] = [];
  @Input() viewModeSelect: string = '';
  @Input() viewMode = ViewMode;
  @Input() globalService!: GlobalService;
  @Input() initialSelectedItems: any[] = [];
  @Input() collapseType: string = '';
  @Input() tabIndex: any = '';
  @Input() nguoiKyDuThao: any = '';
  @Input() nguoiKyToTrinh: any = '';
  @Input() disableNoiNhanDeBietOrNguoiNhanXuLy: any[] = [];

  @Output() selectedItemsChange = new EventEmitter<any[]>();

  tableKey = CollapseTypeEnum.noiNhanDeBiet.toString();

  // Internal data structures
  planFilteredMap: { [key: string]: any[] } = {};
  mapOfExpandedDataPlanMap: { [tableKey: string]: { [key: string]: any[] } } = {};
  listOfMapDataPlanMap: { [tableKey: string]: any[] } = {};
  searchPlansMap: { [tableKey: string]: string } = {};
  selectedXuLyChinhMap: { [key: string]: any[] } = {};
  planMap: { [tableKey: string]: any[] } = {};

  // Ensure initial selections are applied only once per tableKey
  hasAppliedInitialSelectedItemsMap: { [tableKey: string]: boolean } = {};

  // Store original data for reset functionality
  originalOrganizes: any[] = [];

  // Store all loaded data for ngoaiNganh to prevent losing selected items
  allLoadedOrganizes: any[] = [];

  // Flag to prevent duplicate updateTree calls during initialization
  isInitialized = false;

  // Flag to track if collapseType has changed to prevent duplicate updateTree calls
  hasCollapseTypeChanged = false;

  // Drawer properties
  isDrawerVisible = false;
  drawerSearchText = '';

  // Pagination properties
  drawerPageIndex = 1;
  drawerPageSize = 20;
  drawerTotal = 0;

  // Server pagination properties for ngoaiNganh
  serverPageIndex = 1;
  serverPageSize = 100;
  serverTotal = 0;
  serverLoading = false;

  // Select all properties for drawer
  isAllSelected = false;
  isSelectAllDrawerDisabled = false;

  // Select all properties for selected items table
  isAllSelectedSelected = false;
  isThuHoiThayThe = false;
  // Disable flag for select-all in selected list
  isSelectAllSelectedDisabled = false;

  // Search for selected items
  selectedItemsSearchText = '';
  searchTextChanged$ = new Subject<string>();
  selectedItemsSearchTextChanged$ = new Subject<string>();
  private isComponentInitializing = true;

  // Organizational unit data
  organizationalUnitDataOrgin: any[] = [];
  organizationalUnitData: any[] = [];
  lstPopupData: any[] = [];
  selectedOrganizationalUnitId: string = '';
  readonly globalConstants = GlobalConstants;
  collapseTypeEnum = CollapseTypeEnum;
  trangThaiNoiNhanXuLyEnum = TrangThaiNoiNhanXuLyEnum;
  organizationalUnitDataNgoaiNganh: any[] = [];
  organizationalUnitDataNgoaiNganhOrgin: any[] = [];

  constructor(
    private organizeService: OrganizeService,
    private organizationalUnitService: OrganizationalUnitService,
    private message: NzMessageService,
    private cd: ChangeDetectorRef,
    private _serviceNgoaiNganh: OrganizationalOutService,
  ) { }

  ngOnInit(): void {

    this.initializeData();
    this.isInitialized = true;
    this.hasCollapseTypeChanged = true;
    this.tableKey = this.collapseType;
    // Debounce cho drawer search
    this.searchTextChanged$.pipe(debounceTime(500)).subscribe((text) => {
      this.onDrawerFilterPlanByName();
    });
    // Debounce cho selected table search
    this.selectedItemsSearchTextChanged$
      .pipe(debounceTime(500))
      .subscribe((text) => {
        this.onSelectedItemsSearch();
      });
    //this.updateTree();

    setTimeout(() => {
      this.isComponentInitializing = false;
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {

    this.addIntialListDataNotExistForDisplay();

    // if (this.originalOrganizes != this.organizes) {
    //   this.originalOrganizes = [...this.organizes];
    // }
  }
  private addIntialListDataNotExistForDisplay()
  {
    // if(this.collapseType == CollapseTypeEnum.ngoaiNganh)
    // {
    //    let lstNotExist: any[] = this.initialSelectedItems.filter(item1 => !this.findExistData(this.organizes,item1));
    //   lstNotExist.forEach(item2 =>{
    //           let objOrg = {
    //                 "id": item2.key,
    //                 "name": item2.name,
    //                 "shortName": item2.shortName,
    //                 "code": item2.key,
    //                 "pId": item2.keyParent,
    //                 "orderNumber": (this.organizes.length + 1),
    //                 "isNgoaiNganh": true,
    //                 "key": item2.key,
    //                 "fullName": item2.name,
    //                 "children": null,
    //                 "listUserRoleLanhDao": [],
    //                 "listOrganizationalUnitOrg": [],
    //                 "isActive": true
    //             };
    //             this.organizes.push(objOrg);
    //       });
    // }
    // else
    if(this.collapseType == CollapseTypeEnum.donViNoiBo || this.collapseType == CollapseTypeEnum.noiNganh)
    {
      let lstNotExist: any[] = this.initialSelectedItems.filter(item1 => !this.findExistData(this.organizes,item1));
      lstNotExist.forEach(item2 =>{
        let objOrg = {
          "id": item2.key,
          "name": item2.name,
          "shortName": item2.shortName,
          "code": item2.key,
          "pId": item2.keyParent,
          "orderNumber": (this.organizes.length + 1),
          "isNgoaiNganh": false,
          "isOnlyChuyenXuLy": false,
          "khoiDonViId": null,
          "title": null,
          "key": item2.key,
          "expanded": true,
          "codeLGSPQuocGia": item2.key,
          "fullName": item2.name,
          "isActive": true
        };
        this.organizes.push(objOrg);
      });
    }
    else if(this.collapseType == CollapseTypeEnum.noiNhanDeBiet || this.collapseType == CollapseTypeEnum.nguoiNhanXuLy){
      //Người nhận xử lý, nhận để biết

      let lstNotExist: any[] = this.initialSelectedItems.filter(item1 => !this.findExistData(this.organizes,item1));

      lstNotExist.forEach(item2 =>{
        let objPerson = {
          "userName": item2.key,
          "fullName": item2.name,
          "userRoleCode": item2.userRoleCode,
          "userRoleName": item2.userRoleName,
          "userCurrentIsLanhDaoCaoNhat": false,
          "userCurrentIsLanhDao": false,
          "capBacName": item2.capBacName,
          "isActive": true
        };
        this.organizes.push(objPerson);
      });
    }
  }
//Hàm đệ quy kiểm tra xem có tồn tại bản ghi của tất cả trong cây
  private findExistData(organizes: any[],item1: any):  boolean{
    var isOk = false;
    if(organizes.length > 0)
    {
      if(this.collapseType == CollapseTypeEnum.noiNhanDeBiet || this.collapseType == CollapseTypeEnum.nguoiNhanXuLy)
      {
        organizes.forEach(item2 =>{
          let lstChild: any[] = item2.children || [];
          if(item2.userName === item1.key || this.findExistData(lstChild,item1))
          {
            isOk = true;
          }

        });
      }
        // else  if(this.collapseType == CollapseTypeEnum.ngoaiNganh){
        //     organizes.forEach(item2 =>{
        //     let lstChild: any[] = item2.children || [];
        //     if(item2.id === item1.key || this.findExistData(lstChild,item1))
        //     {
        //       isOk = true;
        //     }

        //   });
      // }
      else{
        organizes.forEach(item2 =>{
          let lstChild: any[] = item2.children || [];
          if(item2.id === item1.key || this.findExistData(lstChild,item1))
          {
            isOk = true;
          }

        });
      }

    }
    return isOk;
  }
  // Hàm lấy fullName từ organizationalUnitData dựa trên KhoiDonViId
  // Hàm lấy fullName từ organizationalUnitData dựa trên KhoiDonViId
  private getOrganizationalUnitFullName(khoiDonViId: string): string {
    // ✅ THÊM: Chọn đúng data source dựa vào collapseType
    const unitDataSource = this.collapseType === CollapseTypeEnum.ngoaiNganh
      ? this.organizationalUnitDataNgoaiNganh
      : this.organizationalUnitData;

    if (!unitDataSource || !khoiDonViId) {
      return '';
    }

    const unit = unitDataSource.find(
      (item) => item.id === khoiDonViId
    );
    return unit?.fullName || '';
  }

  // Hàm tạo tên hiển thị cho đơn vị với khối đơn vị
  getDisplayNameWithOrganizationalUnit(item: any): string {
    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      return (item.capBacName || '') + ' ' + item.fullName + ' - ' + (item.userRoleName || '');
    }

    // Nếu là node cha (khối đơn vị), hiển thị tên khối đơn vị
    if (item.isParent) {
      return item.name || '';
    }

    const nameWithShort =
      this.collapseType === CollapseTypeEnum.noiNganh
        ? `${item.shortName !== null ? item.shortName + ' ' : ''}${item.name || ''
        }`.trim()
        : item.name || '';

    // Với các đơn vị khác, kiểm tra xem có listOrganizationalUnitOrg không
    if (
      item.listOrganizationalUnitOrg &&
      item.listOrganizationalUnitOrg.length > 0 &&
      this.collapseType === CollapseTypeEnum.ngoaiNganh
    ) {
      const organizationalUnitNames = item.listOrganizationalUnitOrg
        .map((org: any) => this.getOrganizationalUnitFullName(org.khoiDonViId))
        .filter((name: string) => name) // Lọc bỏ các tên rỗng
        .join(', ');

      if (organizationalUnitNames) {
        return `${organizationalUnitNames} - ${nameWithShort}`;
      }
    }

    return nameWithShort;
  }

  private async loadOrganizeDataWithServerPagination(): Promise<void> {
    const filter = {
      CurrentPage: this.serverPageIndex,
      PageSize: this.serverPageSize,
      DataFilter: {
        id: '',
        isNgoaiNganh: false,
        name: this.drawerSearchText || '',
        ...(this.selectedOrganizationalUnitId && {
          khoiNgoaiNganhId: this.selectedOrganizationalUnitId
        })
      },
    };

    this.serverLoading = true;
    const response = await firstValueFrom(this.organizeService.search(filter));
    let organizesData = response.data || [];

    // ✅ THÊM: So sánh với initialSelectedItems và tự động add vào selectedXuLyChinhMap
    if (this.initialSelectedItems.length > 0) {
      const initialSelectedIds = new Set(
        this.initialSelectedItems.map(item => item.key || item.id)
      );

      organizesData.forEach((org: any) => {
        if (initialSelectedIds.has(org.id)) {
          const initialItem = this.initialSelectedItems.find(
            item => (item.key || item.id) === org.id
          );

          if (initialItem) {
            const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
            const alreadySelected = selected.some(s => (s.key === org.id || s.id === org.id));

            // ✅ Chỉ add nếu chưa có trong selected
            if (!alreadySelected) {
              const selectedItem = {
                id: org.id,
                name: org.name,
                shortName: org.shortName,
                key: org.id,
                keyParent: org.pId,
                level: org.level || 0,
                personAction: null,
                orgActionId: org.id,
                organizeCode: org.id,
                type: 'org' as const,
                isXuLyChinh: true,
                isPhoiHop: false,
                isNhanDeBiet: false,
                isChuyenTruoc: false,
                listOrganizationalUnitOrg: org.listOrganizationalUnitOrg || [],
                // Giữ thông tin từ initialSelectedItems
                isThuHoiThayThe: initialItem.isThuHoiThayThe || false,
                status: initialItem.status,
                statusName: initialItem.statusName,
                ghiChu: initialItem.ghiChu || '',
                isInitiallySelected: initialItem.isInitiallySelected || false,
                wasInitiallyChecked: true,
                wasLayLai: false
              };

              selected.push(selectedItem);
              this.selectedXuLyChinhMap[this.tableKey] = selected;
            }
          }
        }
      });

      this.serverLoading = false;
      this.updateDrawerPagination();

      // ✅ Gọi updateTree TRƯỚC getDrawerPaginatedData
      this.updateTree(CollapseTypeEnum.ngoaiNganh);

      this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);

      this.cd.detectChanges();
    }

    // Lưu dữ liệu như cũ
    if (this.serverPageIndex === 1) {
      this.allLoadedOrganizes = [...organizesData];
    } else {
      this.allLoadedOrganizes = [
        ...this.allLoadedOrganizes.filter(
          (o) => !organizesData.some((n: any) => n.id === o.id)
        ),
        ...organizesData,
      ];
    }

    this.organizes = organizesData;
    this.serverTotal = response.totalRecord || 0;

    this.serverLoading = false;
    this.updateDrawerPagination();
    this.lstPopupData = this.getDrawerPaginatedData(organizesData);
    this.cd.detectChanges();
  }

  private async initializeData(): Promise<void> {
    // Initialize data structures
    this.planFilteredMap[this.tableKey] = [];
    this.mapOfExpandedDataPlanMap[this.tableKey] = {};
    this.listOfMapDataPlanMap[this.tableKey] = [];
    this.searchPlansMap[this.tableKey] = '';
    this.selectedXuLyChinhMap[this.tableKey] = [];
    this.planMap[this.tableKey] = [];
    this.hasAppliedInitialSelectedItemsMap[this.tableKey] = false;
    //Kiểm tra set không cho xóa các người/ đơn vị đã ban hành
    if(this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH)
    {
      this.initialSelectedItems.forEach(
        (item ) => {
          item.isInitiallySelected = item.id != item.key
        }
      );
    }

    // Load organizational unit data
    await this.loadOrganizationalUnitData();

    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      await this.loadOrganizeDataWithServerPagination();
    }

    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      await this.loadOrganizationalUnitDataNgoaiNganh();
    }

    //Khởi tạo dữ liệu cho nơi nhận xử lý
    this.updateTree(this.collapseType);
    //check xem có dữ liệu thu hồi, thay thế không
    this.isThuHoiThayThe = this.selectedXuLyChinhMap[this.tableKey]?.some((item) => item.isThuHoiThayThe === true) ?? false;
  }

  async loadOrganizationalUnitData(): Promise<void> {
    const response = await firstValueFrom(
      this.organizationalUnitService.getAll()
    );

    this.organizationalUnitData = response || [];
    this.organizationalUnitDataOrgin = response || [];
  }

  async loadOrganizationalUnitDataNgoaiNganh(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this._serviceNgoaiNganh.getAllOrgNgoaiNganh()
      );

      this.organizationalUnitDataNgoaiNganh = response || [];
      this.organizationalUnitDataNgoaiNganhOrgin = response || [];
    } catch (error) {
      this.organizationalUnitDataNgoaiNganh = [];
      this.organizationalUnitDataNgoaiNganhOrgin = [];
    }
  }

  private updateTree(collapseType: string): void {

    let treeNodes: any[] = [];

    if (collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Thay đổi từ map đơn giản sang build tree theo khối
      treeNodes = this.buildTreeByOrganizationalUnit(this.organizes || []);

      this.planMap[this.tableKey] = [...treeNodes];
      this.planFilteredMap[this.tableKey] = treeNodes;

      // Apply initial selected items only once per tableKey
      if (
        this.initialSelectedItems.length > 0 &&
        !this.hasAppliedInitialSelectedItemsMap[this.tableKey]
      ) {
        this.applyInitialSelectedItems(treeNodes);
        this.hasAppliedInitialSelectedItemsMap[this.tableKey] = true;
      }

      // Update isXuLyChinh status based on current selected items
      const selectedKeySet = new Set(treeNodes.map((n) => n.key));

      treeNodes.forEach((node) => {
        node.isXuLyChinh = selectedKeySet.has(this.getItemKeyByCollapseType(node));
      });

      // Build tree structure cho ngoaiNganh với unit hierarchy
      let unitHierarchyNodes = this.attachUnassignedLeavesToUnitEnds(treeNodes);
      this.listOfMapDataPlanMap[this.tableKey] = this.globalService.buildTree(unitHierarchyNodes);
      this.mapOfExpandedDataPlanMap[this.tableKey] = {};

      this.listOfMapDataPlanMap[this.tableKey].forEach((item) => {
        this.mapOfExpandedDataPlanMap[this.tableKey][item.key] =
          this.globalService.convertTreeToList(item);
      });
    }  else if (
      collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      let organizesFiltered = this.organizes.filter((org) => org.userName !== this.nguoiKyDuThao) || [];
      if (this.nguoiKyToTrinh || this.nguoiKyToTrinh !== '') {
        organizesFiltered = organizesFiltered.filter((org) => org.userName !== this.nguoiKyToTrinh) || [];
      }
      treeNodes = (organizesFiltered || []).map((account) => ({
        id: account.userName || account.personAction,
        name: account.fullName || account.personAction,
        capBacName: account.capBacName,
        userRoleName: account.userRoleName,
        key: account.userName || account.personAction,
        keyParent: account.organizeCode || account.receiveOrgId,
        level: account.level || 0,
        personAction: account.userName || account.personAction,
        orgActionId: null,
        organizeCode: account.organizeCode || account.receiveOrgId,
        type: 'person' as const,
        isXuLyChinh: false,
        isPhoiHop: false,
        isNhanDeBiet: false,
        isChuyenTruoc: false,
        isThuHoiThayThe: account.isThuHoiThayThe || false,
        listOrganizationalUnitOrg: account.listOrganizationalUnitOrg || [],
        isInitiallySelected: account.isInitiallySelected || false,
      }));

      this.planMap[this.tableKey] = [...treeNodes];
      this.planFilteredMap[this.tableKey] = treeNodes;

      // Apply initial selected items only once per tableKey (avoid resetting on search/filter)
      if (
        this.initialSelectedItems.length > 0 &&
        !this.hasAppliedInitialSelectedItemsMap[this.tableKey]
      ) {

        this.applyInitialSelectedItems(treeNodes);
        this.hasAppliedInitialSelectedItemsMap[this.tableKey] = true;
      }

      //const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
      const selectedKeySet = new Set(treeNodes.map((n) => n.key));

      treeNodes.forEach((node) => {
        node.isXuLyChinh = selectedKeySet.has(node.key);
      });

      // For person data, we don't need to build tree since it's flat
      this.listOfMapDataPlanMap[this.tableKey] = treeNodes;
      this.mapOfExpandedDataPlanMap[this.tableKey] = {
        root: treeNodes,
      };

    } else if (
      collapseType === CollapseTypeEnum.donViNoiBo ||
      collapseType === CollapseTypeEnum.noiNganh
    ) {
      treeNodes = this.buildTreeByOrganizationalUnit(
        this.organizes || []
      );

      this.planMap[this.tableKey] = [...treeNodes];
      this.planFilteredMap[this.tableKey] = treeNodes;

      // Apply initial selected items only once per tableKey
      if (
        this.initialSelectedItems.length > 0 &&
        !this.hasAppliedInitialSelectedItemsMap[this.tableKey]
      ) {

        this.applyInitialSelectedItems(treeNodes);
        this.hasAppliedInitialSelectedItemsMap[this.tableKey] = true;
      }

      //const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
      const selectedKeySet = new Set(treeNodes.map((n) => n.key));

      treeNodes.forEach((node) => {
        node.isXuLyChinh = selectedKeySet.has(node.key);
      });

      let unitHierarchyNodes = this.attachUnassignedLeavesToUnitEnds(treeNodes);
      this.listOfMapDataPlanMap[this.tableKey] = this.globalService.buildTree(unitHierarchyNodes);
      this.mapOfExpandedDataPlanMap[this.tableKey] = {};

      this.listOfMapDataPlanMap[this.tableKey].forEach((item) => {
        this.mapOfExpandedDataPlanMap[this.tableKey][item.key] = this.globalService.convertTreeToList(item);
      });

    }
    //Lấy build danh sách màn hình ngoài
    this.sortSelectedByDrawerOrder();
    let selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    const keyword = this.selectedItemsSearchText?.trim().toLowerCase() || '';

    if (keyword) {
      const filteredSelected = selected.filter((item) =>
        item.name?.toLowerCase().includes(keyword)
      );
      this.buildSelectedTreeFromItems(filteredSelected);
    } else {
      const selectedTree =
        this.collapseType === CollapseTypeEnum.noiNganh
          ? selected.map((item: any) => ({
            ...item,
            isInitiallySelected: item.isInitiallySelected
          }))
          : this.globalService.buildTree(selected);
      this.listOfMapDataPlanMap[`selected-${this.tableKey}`] = selectedTree;
      this.mapOfExpandedDataPlanMap[`selected-${this.tableKey}`] = {};

      selectedTree.forEach((item) => {
        const list = this.globalService.convertTreeToList(item);

        list.forEach((node) => {
          var objIntial = this.initialSelectedItems.filter(x=>x.id == node.id)[0];
          node.expand = true;
          node.isXuLyChinh = true;

          // ✅ CHỈ lấy status từ initialSelectedItems nếu item CÓ wasInitiallyChecked = true
          if (node.wasInitiallyChecked === true && objIntial) {
            // Item đã có sẵn từ đầu → giữ nguyên status từ initial
            node.isThuHoiThayThe = objIntial?.isThuHoiThayThe || node.isThuHoiThayThe || false;
            node.status = objIntial?.status || node.status || item.status;
            node.statusName = objIntial?.statusName || node.statusName || item.statusName;
            node.isInitiallySelected = objIntial?.isInitiallySelected ?? false;
          } else {
            // Item mới được chọn hoặc được chọn lại → GIỮ NGUYÊN status hiện tại, KHÔNG lấy từ initial
            node.isThuHoiThayThe = node.isThuHoiThayThe || false;
            node.status = node.status || TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN;
            node.statusName = node.statusName || 'Chưa tiếp nhận';
            node.isInitiallySelected = false;
          }

          node.wasInitiallyChecked = node.wasInitiallyChecked ?? false;
        });
        this.mapOfExpandedDataPlanMap[`selected-${this.tableKey}`][item.key] = list;
      });
    }

    this.updateSelectedItemsSelectAllStatus();

    this.cd.detectChanges();
  }

  private applyInitialSelectedItems(treeNodes: any[]): void {

    const selected: any[] = [];
    this.initialSelectedItems.forEach((item) => {

      if (item.status === TrangThaiNoiNhanXuLyEnum.LAY_LAI) {
        return; // Không thêm vào selected
      }
      selected.push({
        ...item,
        isXuLyChinh: true,
        isThuHoiThayThe: item.isThuHoiThayThe ?? false,
        status: item.status ?? TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN,
        statusName: item.statusName ?? 'Chưa tiếp nhận',
        ghiChu: item.ghiChu ?? '',
        isInitiallySelected: item.isInitiallySelected ?? false,
        wasInitiallyChecked: true,
        wasLayLai: false
      });
    });
    if(this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH)
    {
      selected.forEach(
        (item ) => {
          item.isInitiallySelected = item.id != item.key
        }
      );
    }

    this.selectedXuLyChinhMap[this.tableKey] = selected;
    // Emit selected items to parent
    //this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
  }

  private updateSelectedItemsSelectAllStatus(): void {
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    const totalCount = selected.length;
    this.isAllSelectedSelected = totalCount > 0;

    // Compute if the header "select all" should be disabled: only when ALL selected rows are disabled
    const isRowDisabled = (item: any): boolean => {
      if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
        const status = item?.status;
        return item.wasInitiallyChecked === true && (
          item?.isInitiallySelected === true ||
          item?.isThuHoiThayThe === true ||
          status === this.trangThaiNoiNhanXuLyEnum.TRA_LAI ||
          // status === this.trangThaiNoiNhanXuLyEnum.LAY_LAI ||
          status === this.trangThaiNoiNhanXuLyEnum.TU_CHOI ||
          this.viewModeSelect === this.viewMode.VIEW
        );
      }
      return (
        this.viewModeSelect === this.viewMode.VIEW ||
        item?.isThuHoiThayThe === true
      );
    };

    this.isSelectAllSelectedDisabled = selected.length === 0 || selected.every(isRowDisabled);
  }

  private buildTreeByOrganizationalUnit(orgs: any[]): any[] {
    const result: any[] = [];

    // Chọn danh sách khối đơn vị phù hợp
    let unitDataSource: any[] = [];

    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      unitDataSource = [...this.organizationalUnitDataNgoaiNganh];
    } else if (this.collapseType === CollapseTypeEnum.donViNoiBo) {
      unitDataSource = this.organizationalUnitData.filter(x => x.isActive != false);
    } else {
      unitDataSource = structuredClone(this.organizationalUnitDataOrgin);
    }

    // Tập hợp các unitId theo thứ tự
    const orderedUnitIds: string[] = [];
    if (Array.isArray(unitDataSource) && unitDataSource.length > 0) {
      unitDataSource.forEach((u) => {
        orderedUnitIds.push(u.id);
      });
    }

    // Tạo tree nodes cho từng khối đơn vị theo đúng thứ tự
    orderedUnitIds.forEach((unitId) => {
      let anyFoundForUnit = false;
      const unitName = unitDataSource.find((u) => u.id === unitId)?.fullName || `Khối ${unitId}`;

      // Thu thập các node con
      let tempChildren: any[] = [];
      (orgs || []).forEach((root) => {
        tempChildren.push(
          ...this.filterAndFlattenByUnit(root, unitId, `unit_${unitId}`, 1)
        );
      });

      if (tempChildren.length > 0) {
        anyFoundForUnit = true;
      }

      if (anyFoundForUnit) {
        // Node cha cho khối
        const parentNode = {
          id: `unit_${unitId}`,
          name: unitName,
          key: `unit_${unitId}`,
          keyParent: null,
          level: 0,
          keyParent_Unit: null,
          level_Unit: 0,
          personAction: null,
          orgActionId: null,
          organizeCode: null,
          type: 'unit' as const,
          isXuLyChinh: false,
          isPhoiHop: false,
          isNhanDeBiet: false,
          isChuyenTruoc: false,
          isThuHoiThayThe: false,
          listOrganizationalUnitOrg: [],
          isParent: true
        };
        result.push(parentNode);
        result.push(...tempChildren);
      }
    });

    // Thêm các đơn vị không thuộc khối nào
    (orgs || []).forEach((root) => {
      result.push(...this.filterAndFlattenUnassigned(root));
    });

    return result;
  }

  private filterAndFlattenByUnit(
    org: any,
    unitId: string,
    attachParentKey: string | null,
    baseLevel: number
  ): any[] {
    const nodes: any[] = [];
    const belongs =
      Array.isArray(org.listOrganizationalUnitOrg) &&
      org.listOrganizationalUnitOrg.some((u: any) => u.khoiDonViId === unitId);

    if (belongs) {
      nodes.push({
        id: org.id,
        name: org.name,
        shortName: org.shortName || null,
        key: org.id,
        keyParent: org.pId,
        keyParentOriginal: org.pId,
        level: org.level || 0,
        levelOriginal: org.level || 0,
        keyParent_Unit: attachParentKey,
        level_Unit: baseLevel || 0,
        personAction: null,
        orgActionId: org.id,
        organizeCode: org.id,
        type: 'org' as const,
        isXuLyChinh: false,
        isPhoiHop: false,
        isNhanDeBiet: false,
        isChuyenTruoc: false,
        isThuHoiThayThe: false,
        listOrganizationalUnitOrg: org.listOrganizationalUnitOrg || [],
        isInitiallySelected: this.isItemInitiallySelected(org),
        isParent: false
      });
    }

    const nextAttachParentKey = belongs ? org.id : attachParentKey;
    const nextLevel = belongs ? baseLevel + 1 : baseLevel;

    if (Array.isArray(org.children) && org.children.length > 0) {
      org.children.forEach((child: any) => {
        nodes.push(
          ...this.filterAndFlattenByUnit(
            child,
            unitId,
            nextAttachParentKey,
            nextLevel
          )
        );
      });
    }

    return nodes;
  }

  private filterAndFlattenUnassigned(
    org: any
  ): any[] {
    const nodes: any[] = [];
    const hasUnit =
      Array.isArray(org.listOrganizationalUnitOrg) &&
      org.listOrganizationalUnitOrg.length > 0;

    if (!hasUnit) {
      nodes.push({
        id: org.id,
        name: org.name,
        shortName: org.shortName || null,
        key: org.id,
        keyParent: org.pId,
        keyParentOriginal: org.pId,
        level: org.level || 0,
        levelOriginal: org.level || 0,
        keyParent_Unit: null,
        level_Unit: 0,
        personAction: null,
        orgActionId: org.id,
        organizeCode: org.id,
        type: 'org' as const,
        isXuLyChinh: false,
        isPhoiHop: false,
        isNhanDeBiet: false,
        isChuyenTruoc: false,
        isThuHoiThayThe: false,
        listOrganizationalUnitOrg: org.listOrganizationalUnitOrg || [],
        isInitiallySelected: this.isItemInitiallySelected(org),
        isParent: false
      });
    }

    if (Array.isArray(org.children) && org.children.length > 0) {
      org.children.forEach((child: any) => {
        nodes.push(...this.filterAndFlattenUnassigned(child));
      });
    }

    return nodes;
  }

  onFilterPlanByName(): void {
    const keyword =
      this.searchPlansMap[this.tableKey]?.trim().toLowerCase() || '';

    if (!keyword) {
      this.planFilteredMap[this.tableKey] = this.planMap[this.tableKey];
    } else {
      this.planFilteredMap[this.tableKey] = this.planMap[this.tableKey].filter(
        (item) => item.name?.toLowerCase().includes(keyword)
      );
    }

    this.updateTreeAfterFilter();
  }

  // Gộp các hàm search/filter thành một hàm duy nhất
  private updateTreeAfterFilter(): void {
    const sourceNodes = this.planFilteredMap[this.tableKey];

    if (
      this.collapseType === CollapseTypeEnum.noiNganh ||
      this.collapseType === CollapseTypeEnum.donViNoiBo
    ) {
      // Với noiNganh và donViNoiBo, cần đảm bảo các khối đơn vị cha được hiển thị
      const nodesForBuild = this.attachUnassignedLeavesToUnitEnds(
        this.mapNodesToUnitHierarchy(sourceNodes)
      );

      // Đảm bảo các khối đơn vị cha có thể mở rộng
      nodesForBuild.forEach((node) => {
        if (node.isParent) {
          node.expand = true; // Mở rộng khối đơn vị cha khi có kết quả tìm kiếm
        }
      });

      this.listOfMapDataPlanMap[this.tableKey] =
        this.globalService.buildTree(nodesForBuild);
    } else {
      this.listOfMapDataPlanMap[this.tableKey] =
        this.globalService.buildTree(sourceNodes);
    }

    this.mapOfExpandedDataPlanMap[this.tableKey] = {};
    this.listOfMapDataPlanMap[this.tableKey].forEach((item) => {
      const list = this.globalService.convertTreeToList(item);
      list.forEach((node) => {
        node.isXuLyChinh = this.checkIsChecked(node);
        node.isInitiallySelected = node.isInitiallySelected || item.isInitiallySelected;
        // Đảm bảo các khối đơn vị cha được mở rộng khi có kết quả tìm kiếm
        if (node.isParent && this.drawerSearchText?.trim()) {
          node.expand = true;
        }
      });
      this.mapOfExpandedDataPlanMap[this.tableKey][item.key] = list;
    });
  }

  // Remap nodes to use unit hierarchy fields when available
  private mapNodesToUnitHierarchy(nodes: any[]): any[] {
    if (!Array.isArray(nodes)) {
      return [];
    }
    return nodes.map((n: any) => {
      const hasUnitHierarchy = n.keyParent_Unit !== null;
      if (!hasUnitHierarchy) {
        return n;
      }
      // For unit parent nodes, keep original keyParent/level
      if (n.isParent) {
        return n;
      }
      return {
        ...n,
        keyParent: n.keyParent_Unit,
        level: n.level_Unit,
        isInitiallySelected: n.isInitiallySelected || false
      };
    });
  }

  // Gắn các đơn vị không thuộc khối và là lá vào nút cuối cùng thuộc khối (nếu có quan hệ cha-con)
  private attachUnassignedLeavesToUnitEnds(nodes: any[]): any[] {
    if (!Array.isArray(nodes) || nodes.length === 0) return nodes;

    const nodeMap = new Map<string, any>();
    nodes.forEach((n) => nodeMap.set(n.key, n));

    // Tập các key được tham chiếu làm cha để xác định lá trong danh sách phẳng
    const referencedAsParent = new Set<string>();
    nodes.forEach((n) => {
      if (n.keyParent_Unit !== null) referencedAsParent.add(n.keyParent_Unit);
    });

    const isUnitParent = (n: any) => n && n.isParent === true;

    // Lá không thuộc khối: không có keyParent_Unit và không bị tham chiếu làm cha
    const unassignedLeaves = nodes.filter(
      (n) =>
        !isUnitParent(n) &&
        n.keyParent_Unit === null &&
        !referencedAsParent.has(n.key)
    );

    if (unassignedLeaves.length === 0) return nodes;

    // Tìm tổ tiên gần nhất đã nằm trong khối (là node khối hoặc node đã có level_Unit)
    const findNearestUnitAncestor = (
      start: any
    ): { key: string | null; level: number } | null => {
      let current = start;
      while (current && current.keyParent) {
        const parent = nodeMap.get(current.keyParent);
        if (!parent) break;

        // Nếu cha là khối hoặc đã thuộc khối thì dừng
        if (isUnitParent(parent) || parent.keyParent_Unit !== null) {
          if (isUnitParent(parent)) {
            return { key: parent.key, level: 1 };
          }
          const baseLevel =
            parent.level_Unit !== null ? parent.level_Unit : parent.level ?? 0;
          return { key: parent.key, level: baseLevel + 1 };
        }

        current = parent;
      }
      return null;
    };

    // Tìm tổ tiên gần nhất KHÔNG thuộc khối (keyParent_Unit === null)
    const findNearestNonUnitAncestor = (
      start: any
    ): { key: string; level: number } | null => {
      let current = start;
      while (current && current.keyParent) {
        const parent = nodeMap.get(current.keyParent);
        if (!parent) break;

        if (parent.keyParent_Unit === null) {
          // dựa vào level thường (ngoài khối không có level_Unit)
          const baseLevel = typeof parent.level === 'number' ? parent.level : 0;
          return { key: parent.key, level: baseLevel + 1 };
        }
        current = parent;
      }
      return null;
    };

    unassignedLeaves.forEach((leaf) => {
      const target = findNearestUnitAncestor(leaf);
      const hasChildren = nodes.some((n) => n.keyParent === leaf.key);

      const siblings = nodes.filter(
        (n) => n.keyParent === leaf.keyParent && n.key !== leaf.key
      );
      const hasSiblingWithChildren = siblings.some((sib) =>
        nodes.some((n) => n.keyParent === sib.key)
      );

      if (target && !hasChildren && !hasSiblingWithChildren) {
        // Trường hợp chuẩn: gắn vào tổ tiên thuộc khối
        leaf.keyParent = target.key;
        leaf.level = target.level;
      } else if (!target) {
        // KHÔNG tìm thấy cha gần nhất trong khối -> fallback sang tổ tiên ngoài khối
        const fallback = findNearestNonUnitAncestor(leaf);
        if (fallback) {
          leaf.keyParent = fallback.key;
          leaf.level = fallback.level;
        } else {
          leaf.keyParent = null;
        }
      } else {
        leaf.keyParent = null;
      }
    });

    return nodes;
  }

  // Search for selected items
  onSelectedItemsSearch(): void {
    const keyword = this.selectedItemsSearchText?.trim().toLowerCase() || '';

    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];

    if (!keyword) {
      // Reset to show all selected items
      this.updateTree(this.collapseType);
    } else {
      // Filter selected items based on search
      const matchingItems = selected.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.shortName?.toLowerCase().includes(keyword)
      );

      if (matchingItems.length > 0) {
        const itemsToShow = new Set<string>();

        matchingItems.forEach((item) => {
          itemsToShow.add(item.key);
          this.collectAncestors(item.key, itemsToShow, selected);
          this.collectDescendants(item.key, itemsToShow, selected);
        });

        const filteredSelected = selected.filter((item) =>
          itemsToShow.has(item.key)
        );

        this.buildSelectedTreeFromItems(filteredSelected);
      } else {
        // Không có kết quả thì cho trống
        this.buildSelectedTreeFromItems([]);
      }
    }

    // Update selected items select all status
    this.updateSelectedItemsSelectAllStatus();
  }

  private buildSelectedTreeFromItems(selectedItems: any[]): void {
    // For donViNoiBo, restore original hierarchy to avoid display distortion
    let items = selectedItems;
    if (this.collapseType === CollapseTypeEnum.donViNoiBo) {
      items = selectedItems.map((item: any) => ({
        ...item,
        keyParent: item.keyParentOriginal !== undefined
          ? item.keyParentOriginal
          : item.keyParent,
        level: item.levelOriginal !== undefined ? item.levelOriginal : item.level,
        isInitiallySelected: item.isInitiallySelected || false
      }));
    }

    const selectedTree =
      this.collapseType === CollapseTypeEnum.noiNganh
        ? items.map((item: any) => ({
          ...item,
          isInitiallySelected: item.isInitiallySelected || false
        }))
        : this.globalService.buildTree(items);
    this.listOfMapDataPlanMap[`selected-${this.tableKey}`] = selectedTree;
    this.mapOfExpandedDataPlanMap[`selected-${this.tableKey}`] = {};

    selectedTree.forEach((item) => {
      const list = this.globalService.convertTreeToList(item);
      list.forEach((node) => {
        node.expand = true;
        node.isXuLyChinh = true;
        node.isThuHoiThayThe = node.isThuHoiThayThe || false;
        node.status = node.status ?? item.status;
        node.statnusName = node.statusName ?? item.statusName;
        node.isInitiallySelected = node.isInitiallySelected ?? item.isInitiallySelected;
      });
      this.mapOfExpandedDataPlanMap[`selected-${this.tableKey}`][item.key] =
        list;
    });
  }

  isItemInitiallySelected(item: any): boolean {
    if (!item) return false;

    // Nếu object đã mang cờ thì trả theo cờ (nên ưu tiên)
    if (typeof item.isInitiallySelected === 'boolean') {
      return item.isInitiallySelected;
    }

    // Nếu chưa có cờ, fallback so sánh với initialSelectedItems
    if (!this.initialSelectedItems || this.initialSelectedItems.length === 0) return false;

    // Trường hợp node cha (khối đơn vị)
    if (item.isParent) {
      const unitId = item.key.replace('unit_', '');

      // Lấy tất cả các đơn vị con của khối này trong planMap
      const allUnitsInThisOrganizationalUnit =
        this.planMap[this.tableKey]?.filter((orgItem: any) => {
          if (orgItem.isParent) return false;
          return orgItem.listOrganizationalUnitOrg?.some(
            (org: any) => org.khoiDonViId === unitId
          );
        }) || [];

      if (allUnitsInThisOrganizationalUnit.length === 0) return false;

      // Kiểm tra xem tất cả các đơn vị con có thuộc initialSelectedItems không
      return allUnitsInThisOrganizationalUnit.every((orgItem: any) =>
        this.isItemInitiallySelected(orgItem) // gọi đệ quy cho từng đơn vị con
      );
    }

    // Lấy các khóa có thể so sánh
    const uname = item.userName || item.personAction || item.key || item.id;
    const id = item.id || item.receiveOrgId || item.organizeCode || item.key;

    if (this.collapseType === CollapseTypeEnum.nguoiNhanXuLy || this.collapseType === CollapseTypeEnum.noiNhanDeBiet) {
      return this.initialSelectedItems.some(
        (sel: any) => sel.personAction === uname || sel.id === id
      );
    }

    return this.initialSelectedItems.some(
      (sel: any) => sel.receiveOrgId === id || sel.id === id
    );
  }

  checkIsChecked(item: any): boolean {
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];

    // Nếu là node cha (khối đơn vị)
    if (item.isParent) {
      const unitId = item.key.replace('unit_', '');
      const allUnitsInThisOrganizationalUnit = this.planMap[this.tableKey]?.filter((orgItem: any) => {
        if (orgItem.isParent) return false;
        return orgItem.listOrganizationalUnitOrg?.some((org: any) => org.khoiDonViId === unitId);
      }) || [];

      if (allUnitsInThisOrganizationalUnit.length === 0) return false;

      const selectedKeySet = new Set(selected.map((n) => this.getItemKeyByCollapseType(n)));
      return allUnitsInThisOrganizationalUnit.every((orgItem: any) => {
        const itemKey = this.getItemKeyByCollapseType(orgItem);
        return selectedKeySet.has(itemKey);
      });
    }

    // ✅ Kiểm tra trong selectedXuLyChinhMap
    return selected.some(
      (n) =>
        n.key === item.key ||
        n.id === item.id ||
        n.key === item.id ||  // ← Thêm case này cho ngoaiNganh
        n.id === item.key ||
        n.key === item.userName ||
        n.id === item.userName
    );
  }
  checkIsCheckedNguoiNhanXuLy(item: any): boolean {
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    return selected.some(
      (n) => n.key === item.userName || n.id === item.userName
    );
  }

  onCheckboxChange(item: any, checked: boolean,isBuilTree: boolean = true): void {
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];

    const keySet = new Map(selected.map((n) => [this.getItemKeyByCollapseType(n), n]));

    let itemKey = this.getItemKeyByCollapseType(item);

    if (checked) {
      if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
        keySet.set(itemKey, { ...item, key: itemKey, isInitiallySelected: this.IsKeepInitial(item) });
      } else {
        keySet.set(itemKey, { ...item, key: itemKey });
      }
    } else {
      keySet.delete(itemKey);
      //Xóa tất cả các con nếu uncheck cha
      var objParent = structuredClone(this.lstPopupData.filter(x=>x.key == item.key)[0]);
      this.deleteAllChild(objParent,keySet);
      //Set lại trạng thái check all cho popup
      this.isAllSelected =  false;
    }

    this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());
    //Thiết lập lại trạng thái cho những bản ghi mới được thêm
    var lstNotMapStatus = this.selectedXuLyChinhMap[this.tableKey].filter((item: any) => item.statusName == null);
    for (var i = 0; i < lstNotMapStatus.length; i++) {
      lstNotMapStatus[i].statusName = 'Chưa tiếp nhận';
      lstNotMapStatus[i].status = TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN;
      lstNotMapStatus[i].level = lstNotMapStatus[i].levelOriginal !== undefined ? lstNotMapStatus[i].levelOriginal : lstNotMapStatus[i].level;
      lstNotMapStatus[i].keyParent = lstNotMapStatus[i].keyParentOriginal !== undefined ? lstNotMapStatus[i].keyParentOriginal : lstNotMapStatus[i].keyParent;
    }
    this.cd.detectChanges();
    if (isBuilTree) {
      //this.buildSelectedTree();
      this.updateTree(this.collapseType);
    }
    // Emit selected items to parent
    if (!this.isComponentInitializing) {
      this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
    }
  }
  private deleteAllChild(item: any,keySet: any)
  {
    let itemKey = '';
    if(item!= null && item!= undefined && item.children.length > 0)
    {
      let lstChild: any[] = item.children;
      lstChild.forEach((node) => {

        if (node.children?.length > 0) {
          this.deleteAllChild(node,keySet);
        }
        else{
          itemKey = this.getItemKeyByCollapseType(node);
          keySet.delete(itemKey);
        }
      });
    }
  }

  private getItemKeyByCollapseType(item: any): string {
    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      return item.id;
    }
    return item.key;
  }

  // Select all for selected items table
  onSelectAllSelectedChange(checked: boolean): void {
    //const visibleItems = this.getVisibleSelectedItems();
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    const keySet = new Map(selected.map((n) => [n.key, n]));

    // check giữ lại những bản ghi đã bị lấy lại TrangThgai = 3, isThuHoiThayThe= true, isInitiallySelected = true
    let shouldKeep = false;
    selected.forEach((item) => {
      shouldKeep = false;
      if (item.status === TrangThaiNoiNhanXuLyEnum.LAY_LAI) {
        keySet.delete(item.key);
        return; // Bỏ qua các kiểm tra khác
      }

      if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
        shouldKeep = this.IsKeepInitial(item);
      }
      else {
        shouldKeep = item.isThuHoiThayThe === true;
      }
      if (!shouldKeep) {
        keySet.delete(item.key);
      }
    });

    this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());
    this.cd.detectChanges();
    //this.sortSelectedByDrawerOrder(); // <-- Sắp xếp lại selected
    // this.buildSelectedTree();
    this.updateTree(this.collapseType);
    this.updateSelectedItemsSelectAllStatus();

    // Emit selected items to parent
    if (!this.isComponentInitializing) {
      this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
    }
  }

  // Drawer methods
  async openDrawer(): Promise<void> {

    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      if (!this.nguoiKyDuThao) {
        this.message.warning('Vui lòng chọn Người ký dự thảo!');
        return;
      }
      if (this.nguoiKyToTrinh) {
        this.organizes = this.organizes.filter((x) => x.userName !== this.nguoiKyToTrinh);
      }
      this.organizes = this.organizes.filter((x) => x.userName !== this.nguoiKyDuThao);
    }
    this.isDrawerVisible = true;
    this.drawerSearchText = '';
    this.selectedOrganizationalUnitId = '';
    this.hasCollapseTypeChanged = true;

    // Store original data for reset functionality
    this.originalOrganizes = [...this.organizes];

    // Reset pagination based on collapse type
    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Load khối đơn vị ngoài ngành nếu chưa load
      if (this.organizationalUnitDataNgoaiNganh.length === 0) {
        await this.loadOrganizationalUnitDataNgoaiNganh();
      }

      this.serverPageIndex = 1;
      this.serverPageSize = 100;
      this.drawerPageIndex = 1;
      this.drawerPageSize = 100;
      await this.loadOrganizeDataWithServerPagination();
      this.updateTree(CollapseTypeEnum.ngoaiNganh);
    } else if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      // For person data, update tree structure first
      // this.updateTree(this.collapseType);
      this.updateDrawerPagination();
    }
    else {
      this.onDrawerFilterPlanByName();
    }

    //check xem có dữ liệu thu hồi, thay thế không
    var lstDataNotUnCheck = this.selectedXuLyChinhMap[this.tableKey]?.filter(x => this.IsKeepInitial(x))
    // this.isThuHoiThayThe = lstDataNotUnCheck?.length > 0;
    //Lấy danh sách dữ liệu popup
    this.lstPopupData = this.getDrawerPaginatedData(lstDataNotUnCheck);
    // Gọi setDrawerDisabledFlags sau khi đã cập nhật lstPopupData
    ;
    // this.setDrawerDisabledFlags();
    this.updateSelectAllStatus();
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.drawerSearchText = '';

    // Reset search and restore original data for person data types
    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      //Reset lại giá trị ban đầu cho trường hợp search
      this.organizes = [...this.originalOrganizes];

    } else if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Reset ngoaiNganh state so list reloads fresh next open
      this.selectedOrganizationalUnitId = '';
      this.serverPageIndex = 1;
      this.drawerPageIndex = 1;
      //this.allLoadedOrganizes = [];
      // this.organizes = [];
      this.serverTotal = 0;
    }

    this.updateTree(this.collapseType);
  }

  onDrawerFilterPlanByName(): void {

    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Server-side search for ngoaiNganh
      this.serverPageIndex = 1;
      this.drawerPageIndex = 1; // Reset drawer page index for new search
      this.allLoadedOrganizes = []; // Reset all loaded data for new search
      this.loadOrganizeDataWithServerPagination();
      this.updateTree(CollapseTypeEnum.ngoaiNganh);
    } else if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      // Client-side search for nguoiNhanXuLy (person data)
      this.filterPersonData();
    } else if (
      this.collapseType === CollapseTypeEnum.noiNganh ||
      this.collapseType === CollapseTypeEnum.donViNoiBo
    ) {
      // Client-side search for noiNganh and donViNoiBo (organization data grouped by unit)
      this.filterOrganizationData();

      // Đảm bảo các khối đơn vị cha được mở rộng khi có kết quả tìm kiếm
      if (this.drawerSearchText?.trim()) {
        const sourceNodes = this.planFilteredMap[this.tableKey];
        if (sourceNodes && sourceNodes.length > 0) {
          sourceNodes.forEach((node) => {
            if (node.isParent) {
              node.expand = true;
            }
          });
        }
      }
    }
    this.updateSelectAllStatus();
  }

  private filterPersonData(): void {
    const keyword = this.drawerSearchText?.trim().toLowerCase() || '';

    if (!keyword) {
      // Reset to show all person data - restore original data
      this.organizes = [...this.originalOrganizes];
    } else {
      // Filter person data based on search
      const filteredData = this.originalOrganizes.filter(
        (person) =>
          person.fullName?.toLowerCase().includes(keyword) ||
          person.userName?.toLowerCase().includes(keyword)
      );
      this.organizes = filteredData;
    }

    // Update tree structure after filtering
    // this.updateTree(this.collapseType);
    this.planFilteredMap[this.tableKey] = this.organizes;

    // Update pagination and reset to first page
    this.updateDrawerPagination();
    this.drawerPageIndex = 1;
    this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
    this.setDrawerDisabledFlags();
  }

  private filterOrganizationData(): void {
    const keyword = this.drawerSearchText?.trim().toLowerCase() || '';

    // Lọc theo từ khóa tìm kiếm
    let filteredData = this.planMap[this.tableKey];
    if (keyword) {
      // Tìm các đơn vị khớp với từ khóa
      const matchingItems = filteredData.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.shortName?.toLowerCase().includes(keyword)
      );

      // Nếu có kết quả tìm kiếm, thêm cả khối đơn vị cha
      if (matchingItems.length > 0) {
        const itemsToShow = new Set<string>();

        // Thêm các item khớp với từ khóa
        matchingItems.forEach((item) => {
          itemsToShow.add(item.key);

          // Lấy toàn bộ cha của item
          this.collectAncestors(item.key, itemsToShow, filteredData);

          // lấy tất cả node con nếu có
          this.collectDescendants(item.key, itemsToShow, filteredData);
        });

        // Lọc dữ liệu để chỉ hiển thị các item cần thiết
        filteredData = filteredData.filter((item) => itemsToShow.has(item.key));
      } else {
        // Nếu không có kết quả, trả về mảng rỗng
        filteredData = [];
      }
    }

    // Lọc theo khối đơn vị nếu có chọn (chỉ áp dụng cho noiNganh và donViNoiBo)
    if (
      this.selectedOrganizationalUnitId &&
      (this.collapseType === CollapseTypeEnum.noiNganh || this.collapseType === CollapseTypeEnum.donViNoiBo)
    ) {
      const itemsToShow = new Set<string>();

      // chọn các node thuộc khối
      const unitItems = filteredData.filter((item) => {
        if (item.isParent) {
          return item.key === `unit_${this.selectedOrganizationalUnitId}`;
        }
        return false;
        // return item.listOrganizationalUnitOrg?.some(
        //   (org: any) => org.khoiDonViId === this.selectedOrganizationalUnitId
        // );
      });

      unitItems.forEach((item) => {
        itemsToShow.add(item.key);

        // nếu là node con thuộc khối → add toàn bộ con cháu
        this.collectDescendants(item.key, itemsToShow, filteredData);

        // nếu là cha khối → giữ lại chính nó
        if (item.isParent) {
          itemsToShow.add(item.key);
        }
      });

      filteredData = filteredData.filter((item) => itemsToShow.has(item.key));
    } else if (this.selectedOrganizationalUnitId) {
      // Xử lý cho các loại collapse khác
      filteredData = filteredData.filter((item) => {
        if (
          !item.listOrganizationalUnitOrg ||
          item.listOrganizationalUnitOrg.length === 0
        ) {
          return false;
        }
        return item.listOrganizationalUnitOrg.some(
          (org: any) => org.khoiDonViId === this.selectedOrganizationalUnitId
        );
      });
    }

    this.planFilteredMap[this.tableKey] = filteredData;
    this.updateTreeAfterFilter();

    // Update pagination and reset to first page
    this.updateDrawerPagination();
    this.drawerPageIndex = 1;
    this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
    this.setDrawerDisabledFlags();
  }

  // Lấy tất cả node cha nếu có
  private collectAncestors(nodeKey: string, itemsToShow: Set<string>, allItems: any[]): void {
    const node = allItems.find((n) => n.key === nodeKey);
    if (node) {
      if (node.keyParent_Unit && !itemsToShow.has(node.keyParent_Unit)) {
        itemsToShow.add(node.keyParent_Unit);
        this.collectAncestors(node.keyParent_Unit, itemsToShow, allItems);
      }
      if (node.keyParent && !itemsToShow.has(node.keyParent)) {
        itemsToShow.add(node.keyParent);
        this.collectAncestors(node.keyParent, itemsToShow, allItems);
      }
    }
  }

  // Lấy tất cả node con nếu có
  private collectDescendants(nodeKey: string, itemsToShow: Set<string>, allItems: any[]): void {
    const children = allItems.filter(
      (n) => n.keyParent_Unit === nodeKey || n.keyParent === nodeKey
    );
    children.forEach((child) => {
      if (!itemsToShow.has(child.key)) {
        itemsToShow.add(child.key);
        this.collectDescendants(child.key, itemsToShow, allItems);
      }
    });
  }

  private updateDrawerPagination(): void {
    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Use server total for ngoaiNganh to show correct pagination
      this.drawerTotal = this.serverTotal;
    } else if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      // Use total from organizes (person data) for nguoiNhanXuLy
      this.drawerTotal = this.organizes?.length || 0;
    } else if (
      this.collapseType === CollapseTypeEnum.noiNganh ||
      this.collapseType === CollapseTypeEnum.donViNoiBo
    ) {
      // For noiNganh and donViNoiBo, calculate total from all tree nodes since no pagination
      let total = 0;
      Object.values(this.mapOfExpandedDataPlanMap[this.tableKey] || {}).forEach(
        (itemList: any[]) => {
          total += itemList.length;
        }
      );
      this.drawerTotal = total;
    } else {
      // Calculate total from tree structure for other collapse types
      let total = 0;
      Object.values(this.mapOfExpandedDataPlanMap[this.tableKey] || {}).forEach(
        (itemList: any[]) => {
          total += itemList.length;
        }
      );
      this.drawerTotal = total;
    }

  }

  // Get paginated data for drawer
  getDrawerPaginatedData(lstDataNotUnCheck: any[]): any[] {
    const selectedKey = 'selected-' + this.tableKey;
    const selectedItemsMap = this.mapOfExpandedDataPlanMap[selectedKey] || {};
    const selectedFlat: any[] = [];
    Object.values(selectedItemsMap).forEach((arr: any[]) =>
      selectedFlat.push(...arr)
    );

    // For noiNganh and donViNoiBo, return all data without pagination
    if (
      this.collapseType === CollapseTypeEnum.noiNganh ||
      this.collapseType === CollapseTypeEnum.donViNoiBo
    ) {
      const allItems: any[] = [];
      Object.values(this.mapOfExpandedDataPlanMap[this.tableKey] || {}).forEach(
        (itemList: any[]) => {
          allItems.push(...itemList);
        }
      );
      ;
      allItems.forEach((item) => {
        item.expand = true;
        if (!item.children) item.children = [];

        const matched = selectedFlat.find(
          (sel) => sel.receiveOrgId === item.organizeCode
        );

        var objDataUncheck = lstDataNotUnCheck.filter(x => x.key == item.id);
        if (objDataUncheck == null || objDataUncheck.length == 0) {
          item.isInitiallySelected = false;
        }
        else {
          item.isInitiallySelected = objDataUncheck[0].isInitiallySelected;
        }

        item.isThuHoiThayThe = matched?.isThuHoiThayThe ?? false;
        //item.isInitiallySelected = this.IsKeepInitial(item);
      });

      return allItems;
    }

    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      const allItems = this.organizes || [];

      allItems.forEach((item) => {
        const matched = selectedFlat.find(
          (sel) => sel.personAction === item.userName
        );
        item.isThuHoiThayThe = matched?.isThuHoiThayThe ?? false;
        // var objDataUncheck = lstDataNotUnCheck.filter(x => x.id == item.id);
        // if (objDataUncheck == null || objDataUncheck.length == 0) {
        //   item.isInitiallySelected = false;
        // }
        // else {
        //   item.isInitiallySelected = objDataUncheck[0].isInitiallySelected;
        // }

        item.isInitiallySelected = this.IsKeepInitial(item);
      });

      const startIndex = (this.drawerPageIndex - 1) * this.drawerPageSize;
      const endIndex = startIndex + this.drawerPageSize;

      return allItems.slice(startIndex, endIndex);
    }

    // For ngoaiNganh
    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      const allItems = this.organizes || [];

      // ✅ Map trạng thái từ selectedXuLyChinhMap
      const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
      const selectedMap = new Map(selected.map(s => [s.key || s.id, s]));

      allItems.forEach((item) => {
        const matched = selectedMap.get(item.id); // ← So sánh bằng item.id

        if (matched) {
          // Copy trạng thái từ selected
          item.isThuHoiThayThe = matched.isThuHoiThayThe || false;
          item.status = matched.status;
          item.statusName = matched.statusName;
          item.isInitiallySelected = matched.isInitiallySelected || false;
        } else {
          // Không có trong selected
          item.isThuHoiThayThe = false;
          item.isInitiallySelected = false;
        }
      });

      return allItems;
    }

    return [];
  }

  onDrawerPageIndexChange(pageIndex: number): void {
    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Server-side pagination: chỉ tải trang được chọn
      this.drawerPageIndex = pageIndex;
      this.serverPageIndex = pageIndex;

      //load đồng bộ
      this.loadOrganizeDataWithServerPagination().then(()=>{
        this.updateTree(CollapseTypeEnum.ngoaiNganh);
        this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
        this.setDrawerDisabledFlags();
        this.updateSelectAllStatus();
      });
    } else {
      // Client-side pagination for other collapse types
      this.drawerPageIndex = pageIndex;
      this.updateSelectAllStatus();
      // this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
      // this.setDrawerDisabledFlags();
    }
  }

  onDrawerPageSizeChange(pageSize: number): void {

    if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Server-side pagination
      this.drawerPageSize = pageSize;
      this.serverPageSize = pageSize;
      this.drawerPageIndex = 1;
      this.serverPageIndex = 1;
      this.allLoadedOrganizes = [];
      //load đồng bộ
      this.loadOrganizeDataWithServerPagination().then(()=>{
        this.updateTree(CollapseTypeEnum.ngoaiNganh);
        this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
        this.setDrawerDisabledFlags();
        this.updateSelectAllStatus();
      });
    } else {
      // Client-side pagination for other collapse types
      this.drawerPageSize = pageSize;
      this.drawerPageIndex = 1;
      this.updateSelectAllStatus();
    }
  }
  onDrawerCheckboxChange(item: any, checked: boolean): void {
    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      const treeNode = this.convertPersonToTreeNode(item);
      this.onCheckboxChange(treeNode, checked, false);
    }
    else if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // ✅ Xử lý trực tiếp cho ngoaiNganh thay vì gọi onCheckboxChange
      const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
      const keySet = new Map(selected.map((n) => [n.key || n.id, n]));

      if (checked) {
        // Thêm vào selected
        const selectedItem = {
          id: item.id,
          name: item.name,
          shortName: item.shortName,
          key: item.id, // ✅ Quan trọng: key = id cho ngoaiNganh
          keyParent: item.pId,
          level: item.level || 0,
          personAction: null,
          orgActionId: item.id,
          organizeCode: item.id,
          type: 'org' as const,
          isXuLyChinh: true,
          isPhoiHop: false,
          isNhanDeBiet: false,
          isChuyenTruoc: false,
          listOrganizationalUnitOrg: item.listOrganizationalUnitOrg || [],
          isThuHoiThayThe: item.isThuHoiThayThe || false,
          status: item.status || TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN,
          statusName: item.statusName || 'Chưa tiếp nhận',
          isInitiallySelected: this.IsKeepInitial(item),
          ghiChu: item.ghiChu || '',
          wasInitiallyChecked: false // Item mới thêm từ drawer
        };
        keySet.set(item.id, selectedItem); // ✅ Set bằng item.id
      } else {
        // ✅ Xóa khỏi selected - dùng item.id
        keySet.delete(item.id);
      }

      this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());

      // Thiết lập lại trạng thái cho những bản ghi mới được thêm
      var lstNotMapStatus = this.selectedXuLyChinhMap[this.tableKey].filter((item: any) => item.statusName == null);
      for (var i = 0; i < lstNotMapStatus.length; i++) {
        lstNotMapStatus[i].statusName = 'Chưa tiếp nhận';
        lstNotMapStatus[i].status = TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN;
        lstNotMapStatus[i].level = lstNotMapStatus[i].levelOriginal !== undefined ? lstNotMapStatus[i].levelOriginal : lstNotMapStatus[i].level;
        lstNotMapStatus[i].keyParent = lstNotMapStatus[i].keyParentOriginal !== undefined ? lstNotMapStatus[i].keyParentOriginal : lstNotMapStatus[i].keyParent;
      }

      this.cd.detectChanges();

      // ✅ GỌI updateTree để cập nhật selected table bên ngoài
      this.updateTree(this.collapseType);

      // Emit thay đổi
      if (!this.isComponentInitializing) {
        this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
      }
    }
    else if (
      this.collapseType === CollapseTypeEnum.noiNganh
    ) {
      if (item.isParent) {
        this.onOrganizationalUnitCheckboxChange(item, checked);
      } else {
        if (checked) {
          var objParent = structuredClone(this.lstPopupData.filter(x=>x.key == item.keyParent)[0]);
          if(objParent != null && objParent != undefined) {
            objParent.children = [];
            if(objParent.id.indexOf("unit") == -1) {
              const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
              const keySet = new Map(selected.map((n) => [this.getItemKeyByCollapseType(n), n]));
              const itemKey = this.getItemKeyByCollapseType(objParent);
              if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
                keySet.set(itemKey, { ...objParent, key: itemKey, isInitiallySelected: this.IsKeepInitial(objParent) });
              } else {
                keySet.set(itemKey, { ...objParent, key: itemKey });
              }
              this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());
            }
          }
        }
        this.onCheckboxChange(item, checked, false);
      }
    }
    else if(this.collapseType === CollapseTypeEnum.donViNoiBo){
      if (item.isParent) {
        this.onOrganizationalUnitCheckboxChange(item, checked);
      } else {
        this.onCheckboxChange(item, checked, false);
      }
    }
    else {
      this.onCheckboxChange(item, checked, false);
    }

    this.updateSelectAllStatus();
  }

  private convertPersonToTreeNode(person: any): any {
    return {
      id: person.userName,
      name: person.fullName,
      capBacName: person.capBacName,
      userRoleName: person.userRoleName,
      key: person.userName,
      keyParent: person.organizeCode,
      level: person.level || 0,
      personAction: person.userName,
      orgActionId: null,
      organizeCode: person.organizeCode,
      type: 'person' as const,
      isXuLyChinh: false,
      isPhoiHop: false,
      isNhanDeBiet: false,
      isChuyenTruoc: false,
      isThuHoiThayThe: person.isThuHoiThayThe,
      listOrganizationalUnitOrg: person.listOrganizationalUnitOrg || [],
      isInitiallySelected: person.isInitiallySelected
    };
  }

  // Xử lý chọn/bỏ chọn tất cả các đơn vị thuộc khối đơn vị
  private onOrganizationalUnitCheckboxChange(unitItem: any, checked: boolean): void {
    const unitId = unitItem.key.replace('unit_', '');
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    const keySet = new Map(selected.map((n) => [this.getItemKeyByCollapseType(n), n]));

    // Lấy tất cả các đơn vị thuộc khối này từ planMap
    const allUnitsInThisOrganizationalUnit = this.planMap[this.tableKey]?.filter((item: any) => {
      // Bỏ qua node cha (khối đơn vị)
      if (item.isParent) {
        return false;
      }
      // Kiểm tra xem đơn vị có thuộc khối được chọn không
      return item.listOrganizationalUnitOrg?.some((org: any) => org.khoiDonViId === unitId);
    }) || [];

    if (checked) {
      let isInitial = false;
      // Chọn tất cả các đơn vị thuộc khối
      allUnitsInThisOrganizationalUnit.forEach((item: any) => {
        // const itemKey = this.getItemKeyByCollapseType(item);
        // keySet.set(itemKey, { ...item, key: itemKey, isInitiallySelected: this.isItemInitiallySelected(item) });
        const ik = this.getItemKeyByCollapseType(item);
        const existing = keySet.get(ik);
        if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
          isInitial = this.IsKeepInitial(item);
        }
        else {
          isInitial = false;
        }
        //const isInitial = existing != null && existing != undefined ? this.IsKeepInitial(existing) : false;
        if (isInitial) {
          keySet.set(ik, { ...existing, key: ik,isInitiallySelected: isInitial });
        } else {
          keySet.set(ik, { ...item, key: ik, isInitiallySelected: isInitial });
        }
      });
    } else {
      let isInitial = false;
      // Bỏ chọn tất cả các đơn vị thuộc khối
      allUnitsInThisOrganizationalUnit.forEach((item: any) => {
        const itemKey = this.getItemKeyByCollapseType(item);
        if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
          isInitial = this.IsKeepInitial(item);
        }
        else {
          isInitial = item.isThuHoiThayThe == true;
        }
        if (!isInitial) {
          keySet.delete(itemKey);
        }
      });
    }

    this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());
    //Thiết lập lại trạng thái cho những bản ghi mới được thêm
    var lstNotMapStatus = this.selectedXuLyChinhMap[this.tableKey].filter((item: any) => item.statusName == null);
    for (var i = 0; i < lstNotMapStatus.length; i++) {
      lstNotMapStatus[i].statusName = 'Chưa tiếp nhận';
      lstNotMapStatus[i].status = TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN;
      lstNotMapStatus[i].level = lstNotMapStatus[i].levelOriginal !== undefined ? lstNotMapStatus[i].levelOriginal : lstNotMapStatus[i].level;
      lstNotMapStatus[i].keyParent = lstNotMapStatus[i].keyParentOriginal !== undefined ? lstNotMapStatus[i].keyParentOriginal : lstNotMapStatus[i].keyParent;
    }
    this.cd.detectChanges();
    this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
  }

  IsKeepInitial(candidate: any): boolean {
    return (candidate.isInitiallySelected === true || this.isItemInitiallySelected(candidate) || candidate.isThuHoiThayThe === true || candidate.status === TrangThaiNoiNhanXuLyEnum.TRA_LAI || candidate.status === TrangThaiNoiNhanXuLyEnum.TU_CHOI);
  }

  onSelectAllChange(checked: boolean): void {
    this.isAllSelected = checked;

    let selected = this.selectedXuLyChinhMap[this.tableKey] || [];

    const currentPageItems = this.getDrawerPaginatedData(selected);
    const effectiveItems =
      this.collapseType === CollapseTypeEnum.donViNoiBo
        ? currentPageItems.filter((item: any) => (item.level ?? 0) < 2)
        : currentPageItems;

    // Map key khác nhau theo collapseType
    const getItemKey = (item: any): string => {
      if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
        return item.id;
      }
      return item.key;
    };
    const keySet = new Map(selected.map((n) => [n.key, n]));

    if (checked) {
      let isInitial = false;
      // Add all items from current page
      effectiveItems.forEach((item) => {
        // nếu item bị disable thì bỏ qua
        if (this.computeBaseItemDisabled(item, selected)) {
          return;
        }
        if (this.collapseType === CollapseTypeEnum.ngoaiNganh && !item.code) {
          return;
        }
        if (this.collapseType === CollapseTypeEnum.nguoiNhanXuLy || this.collapseType === CollapseTypeEnum.noiNhanDeBiet) {
          const treeNode = this.convertPersonToTreeNode(item);
          const ik = getItemKey(treeNode);
          const existing = keySet.get(ik);
          if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
            isInitial = existing != null && existing != undefined ? this.IsKeepInitial(existing) : false;
          }
          else {
            isInitial = false;
          }

          if (isInitial) {
            keySet.set(ik, { ...existing, isInitiallySelected: isInitial });
          }
          else {
            keySet.set(ik, { ...treeNode, isInitiallySelected: isInitial });
          }
        } else {
          if (this.collapseType === CollapseTypeEnum.noiNganh || this.collapseType === CollapseTypeEnum.donViNoiBo) {
            if (!item.isParent) {
              const ik = getItemKey(item);
              const existing = keySet.get(ik);

              if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
                isInitial = existing != null && existing != undefined ? this.IsKeepInitial(existing) : false;
              }
              else {
                isInitial = false;
              }

              if (isInitial) {
                keySet.set(ik, { ...existing, key: ik, isInitiallySelected: isInitial });
              } else {
                keySet.set(ik, { ...item, key: ik, isInitiallySelected: isInitial });
              }
            }
          } else {
            const ik = getItemKey(item);
            const existing = keySet.get(ik);
            if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
              isInitial = existing != null && existing != undefined ? this.IsKeepInitial(existing) : false;
            }
            else {
              isInitial = false;
            }
            if (isInitial) {
              keySet.set(ik, { ...existing, key: ik, isInitiallySelected: isInitial });
            }
            else {
              keySet.set(ik, { ...item, key: ik, isInitiallySelected: isInitial });
            }
          }
        }
      });
    } else {
      let isInitial = false;
      // Remove all items from current page, but keep initially selected in TRA_CUU_BAN_HANH
      currentPageItems.forEach((item) => {
        if (
          this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
          this.collapseType === CollapseTypeEnum.noiNhanDeBiet
        ) {
          const treeNode = this.convertPersonToTreeNode(item);
          if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
            isInitial = this.IsKeepInitial(treeNode);
          }
          else {
            isInitial = treeNode.isThuHoiThayThe == true;
          }

          if (!isInitial) {
            keySet.delete(getItemKey(treeNode));
          }
          return;
        } else if (this.collapseType === CollapseTypeEnum.noiNganh || this.collapseType === CollapseTypeEnum.donViNoiBo) {
          // Chỉ bỏ chọn các đơn vị con, không bỏ chọn khối đơn vị
          if (!item.isParent) {
            if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
              isInitial = this.IsKeepInitial(item);
            }
            else {
              isInitial = item.isThuHoiThayThe == true;
            }

            if (!isInitial) {
              keySet.delete(getItemKey(item));
            }
          }
        } else {
          if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {
            isInitial = this.IsKeepInitial(item);
          }
          else {
            isInitial = item.isThuHoiThayThe == true;
          }
          if (!isInitial) {
            keySet.delete(getItemKey(item));
          }
        }
      });
    }
    this.selectedXuLyChinhMap[this.tableKey] = Array.from(keySet.values());
    //Thiết lập lại trạng thái cho những bản ghi mới được thêm
    var lstNotMapStatus = this.selectedXuLyChinhMap[this.tableKey].filter((item: any) => item.statusName == null);
    for (var i = 0; i < lstNotMapStatus.length; i++) {
      lstNotMapStatus[i].statusName = 'Chưa tiếp nhận';
      lstNotMapStatus[i].status = TrangThaiNoiNhanXuLyEnum.CHUA_TIEP_NHAN;
      lstNotMapStatus[i].level = lstNotMapStatus[i].levelOriginal !== undefined ? lstNotMapStatus[i].levelOriginal : lstNotMapStatus[i].level;
      lstNotMapStatus[i].keyParent = lstNotMapStatus[i].keyParentOriginal !== undefined ? lstNotMapStatus[i].keyParentOriginal : lstNotMapStatus[i].keyParent;
    }

    this.cd.detectChanges();
    // Emit selected items to parent
    if (!this.isComponentInitializing) {
      this.selectedItemsChange.emit(this.selectedXuLyChinhMap[this.tableKey]);
    }
  }

  private updateSelectAllStatus(): void {
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];

    const currentPageItems = this.getDrawerPaginatedData(selected);
    const effectiveItems =
      this.collapseType === CollapseTypeEnum.donViNoiBo
        ? currentPageItems.filter((item: any) => (item.level ?? 0) < 2)
        : currentPageItems;

    const selectedKeySet = new Set(
      selected.map((n) => this.getItemKeyByCollapseType(n))
    );

    const pageKeys = effectiveItems
      .filter((item) => {
        if (this.collapseType === CollapseTypeEnum.noiNganh || this.collapseType === CollapseTypeEnum.donViNoiBo) {
          return !item.isParent; // bỏ qua node cha
        }
        return true;
      })
      .map((item) => {
        if (this.collapseType === CollapseTypeEnum.nguoiNhanXuLy || this.collapseType === CollapseTypeEnum.noiNhanDeBiet) {
          return item.userName;
        }
        return this.getItemKeyByCollapseType(item);
      });

    const checkedCount = pageKeys.filter((k) => selectedKeySet.has(k)).length;
    const totalCount = pageKeys.length;

    this.isAllSelected = totalCount > 0 && checkedCount === totalCount;
    this.lstPopupData = currentPageItems;

    // Gọi setDrawerDisabledFlags sau khi đã cập nhật lstPopupData
    this.setDrawerDisabledFlags();

    // Disable "select all" in drawer only if no actionable items or all actionable items are disabled
    const actionable = effectiveItems.filter((item: any) => {
      if (this.collapseType === CollapseTypeEnum.noiNganh || this.collapseType === CollapseTypeEnum.donViNoiBo) {
        return item?.isParent !== true;
      }
      return true;
    });

    this.isSelectAllDrawerDisabled = actionable.length === 0 || actionable.every((it: any) => it?.isDisabledDrawer === true);
  }

  onExpandChange(item: any, expanded: boolean): void {
    // Update expand state on the clicked item
    const collapseDescendants = (node: any) => {
      node.expand = true;
      if (node.children.length > 0) {
        node.children.forEach((child: any) => collapseDescendants(child));
      }
    };

    if (expanded) {
      item.expand = true;
    } else {
      collapseDescendants(item);
    }

    // Find root node of the current tree branch without affecting siblings
    const findRoot = (node: any): any => {
      // Prefer using existing parent links if available
      let current = node;
      while (current && current.parent) {
        current = current.parent;
      }
      if (current && current.key) {
        return current;
      }
      // Fallback: locate the root that currently contains the node in the flat map
      const flatMap = this.mapOfExpandedDataPlanMap[this.tableKey] || {};
      let rootKeyContaining: string | null = null;
      for (const [rootKey, list] of Object.entries(flatMap)) {
        if ((list as any[]).some((n) => n.key === node.key)) {
          rootKeyContaining = rootKey;
          break;
        }
      }
      if (!rootKeyContaining) {
        return null;
      }
      // Retrieve the actual root node object from the tree list to preserve identities
      const roots = this.listOfMapDataPlanMap[this.tableKey] || [];
      return roots.find((r: any) => r.key === rootKeyContaining) || null;
    };

    const rootNode = findRoot(item);

    // Update only the affected root's flat list in-place to avoid touching siblings
    if (!this.mapOfExpandedDataPlanMap[this.tableKey]) {
      this.mapOfExpandedDataPlanMap[this.tableKey] = {};
    }

    if (!rootNode) {
      return;
    }

    const flatList: any[] = this.mapOfExpandedDataPlanMap[this.tableKey][rootNode.key] || [];

    // Ensure parent pointers exist for traversal
    const attachParents = (node: any, parent: any | null) => {
      node.parent = parent || null;
      const children = Array.isArray(node.children) ? node.children : [];
      children.forEach((child: any) => attachParents(child, node));
    };
    attachParents(rootNode, null);

    const collectDescendantsVisible = (node: any, acc: any[]) => {
      const children = Array.isArray(node.children) ? node.children : [];
      children.forEach((child: any) => {
        acc.push(child);
        if (child.expand) {
          collectDescendantsVisible(child, acc);
        }
      });
    };

    const collectDescendantsAll = (node: any, acc: any[]) => {
      const children = Array.isArray(node.children) ? node.children : [];
      children.forEach((child: any) => {
        acc.push(child);
        collectDescendantsAll(child, acc);
      });
    };

    const idx = flatList.findIndex((n: any) => n.key === item.key);
    if (idx === -1) {
      return;
    }

    if (expanded) {
      // Insert visible descendants right after the item
      const toInsert: any[] = [];
      collectDescendantsVisible(item, toInsert);
      flatList.splice(idx + 1, 0, ...toInsert);
      this.mapOfExpandedDataPlanMap[this.tableKey][rootNode.key] = flatList;
    } else {
      // Remove all descendants from the flat list
      const toRemove: any[] = [];
      collectDescendantsAll(item, toRemove);
      const removeKeys = new Set(toRemove.map((n: any) => n.key));
      const newFlat = flatList.filter((n: any) => !removeKeys.has(n.key));
      this.mapOfExpandedDataPlanMap[this.tableKey][rootNode.key] = newFlat;
    }
    this.updateDrawerPagination();

    this.lstPopupData = this.getDrawerPaginatedData(this.selectedXuLyChinhMap[this.tableKey] || []);
    this.setDrawerDisabledFlags();
  }

  onDrawerSearchChange(value: string) {
    this.searchTextChanged$.next(value);
  }

  onSelectedItemsSearchChange(value: string) {
    this.selectedItemsSearchTextChanged$.next(value);
  }

  // Đánh dấu disabled cho từng item trong lstPopupData để template dùng biến, không gọi hàm
  private setDrawerDisabledFlags(): void {
    const isOrgGrouping =
      this.collapseType === CollapseTypeEnum.noiNganh ||
      this.collapseType === CollapseTypeEnum.donViNoiBo;

    const items = Array.isArray(this.lstPopupData) ? this.lstPopupData : [];
    const selected = this.selectedXuLyChinhMap[this.tableKey] || [];
    // Tạo nhanh map unitId -> danh sách con để đỡ tính lặp lại
    let unitIdToChildren: Map<string, any[]> | null = null;
    if (isOrgGrouping) {
      unitIdToChildren = new Map<string, any[]>();
      items.forEach((n: any) => {
        if (n?.isParent === true) {
          const unitId = (n.key || '').toString().replace('unit_', '');
          const children = items.filter((c: any) => {
            if (c?.isParent) return false;
            const orgs = Array.isArray(c.listOrganizationalUnitOrg)
              ? c.listOrganizationalUnitOrg
              : [];
            return orgs.some((o: any) => o?.khoiDonViId === unitId);
          });
          unitIdToChildren!.set(unitId, children);
        }
      });
    }

    items.forEach((item: any) => {

      const baseDisabled = this.computeBaseItemDisabled(item,selected);

      if (
        isOrgGrouping &&
        item?.isParent === true
      ) {
        const unitId = (item.key || '').toString().replace('unit_', '');
        const children = unitIdToChildren?.get(unitId) || [];
        if (children.length > 0) {
          const allChildrenDisabled = children.every((c: any) => this.computeBaseItemDisabled(c,selected));
          item.isDisabledDrawer = allChildrenDisabled;
        } else {
          item.isDisabledDrawer = baseDisabled;
        }
      } else {
        item.isDisabledDrawer = baseDisabled;
      }
    });

  }

  // Điều kiện disabled cơ bản
  private computeBaseItemDisabled(item: any,selected:any[]): boolean {
    if (this.viewModeSelect === this.viewMode.VIEW) {
      return true;
    }

    // Nếu item nằm trong danh sách disable được truyền từ cha
    if (this.disableNoiNhanDeBietOrNguoiNhanXuLy?.length > 0) {
      const isDisabledExternal = this.disableNoiNhanDeBietOrNguoiNhanXuLy
        .some(x => {
          if (this.collapseType === CollapseTypeEnum.noiNhanDeBiet || this.collapseType === CollapseTypeEnum.nguoiNhanXuLy) {
            return x.key === item.userName;
          }
          return x.key === item.id;
        });
      if (isDisabledExternal) {
        return true;
      }
    }

    if (this.tabIndex === this.globalConstants.TAB_INDEX_VAN_BAN_DI.TRA_CUU_BAN_HANH) {

      let objCheck;
      if(this.collapseType === CollapseTypeEnum.noiNhanDeBiet || this.collapseType === CollapseTypeEnum.nguoiNhanXuLy)
      {
        objCheck = selected.filter(x=>x.key == item.userName)[0];
      }
      else{
        objCheck = selected.filter(x=>x.key == item.id)[0];
      }

      if (!objCheck || !objCheck.wasInitiallyChecked) {
        return false; // Item chưa được chọn HOẶC mới được chọn trong drawer → không disable
      }

      const status = objCheck?.status;
      return (
        objCheck?.isInitiallySelected === true ||
        objCheck?.isThuHoiThayThe === true ||
        status === this.trangThaiNoiNhanXuLyEnum.TRA_LAI ||
        // status === this.trangThaiNoiNhanXuLyEnum.LAY_LAI ||
        status === this.trangThaiNoiNhanXuLyEnum.TU_CHOI

      );
    }

    return item?.isThuHoiThayThe === true;
  }

  onOrganizationalUnitChange(value: string) {
    this.selectedOrganizationalUnitId = value;

    // Only apply organizational unit filter for non-person data types
    if (
      this.collapseType !== CollapseTypeEnum.nguoiNhanXuLy &&
      this.collapseType !== CollapseTypeEnum.noiNhanDeBiet
    ) {
      if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
        // ✅ THÊM: Reset và reload data từ server với khoiNgoaiNganhId
        this.drawerPageIndex = 1;
        this.serverPageIndex = 1;
        this.allLoadedOrganizes = [];
        this.loadOrganizeDataWithServerPagination(); // ← Gọi lại API với filter mới
      } else {
        this.onDrawerFilterPlanByName();
      }
    }
  }

  private sortSelectedByDrawerOrder() {
    let orderList: any[] = [];
    if (
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy ||
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet
    ) {
      // Use originalOrganizes to keep a stable order independent of drawer filtering
      orderList = this.originalOrganizes && this.originalOrganizes.length > 0 ? this.originalOrganizes : this.organizes || [];
      this.selectedXuLyChinhMap[this.tableKey] = (
        this.selectedXuLyChinhMap[this.tableKey] || []
      ).sort((a, b) => {
        const idxA = orderList.findIndex(
          (item) => item.userName === a.key || item.userName === a.id
        );
        const idxB = orderList.findIndex(
          (item) => item.userName === b.key || item.userName === b.id
        );
        const safeIdxA = idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA;
        const safeIdxB = idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB;
        return safeIdxA - safeIdxB;
      });
    } else if (this.collapseType === CollapseTypeEnum.ngoaiNganh) {
      // Với ngoaiNganh, luôn dùng allLoadedOrganizes làm chuẩn

      orderList = this.allLoadedOrganizes || [];
      this.selectedXuLyChinhMap[this.tableKey] =
        (this.selectedXuLyChinhMap[this.tableKey] || []).sort((a, b) => {
          const idxA = orderList.findIndex((item) => item.id === a.key);
          const idxB = orderList.findIndex((item) => item.id === b.key);
          return (idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA) -
            (idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB);
        });
    } else {
      orderList = this.planMap[this.tableKey] || [];
      this.selectedXuLyChinhMap[this.tableKey] = (
        this.selectedXuLyChinhMap[this.tableKey] || []
      ).sort((a, b) => {
        const idxA = orderList.findIndex((item) => item.key === a.key);
        const idxB = orderList.findIndex((item) => item.key === b.key);
        return idxA - idxB;
      });
    }
  }

  getItemStatus(item: any): number {
    if (!this.initialSelectedItems || this.initialSelectedItems.length === 0) {
      return 0;
    }

    // Tìm status từ initialSelectedItems dựa vào collapseType
    let foundItem: any = null;

    if (
      this.collapseType === CollapseTypeEnum.noiNhanDeBiet ||
      this.collapseType === CollapseTypeEnum.nguoiNhanXuLy
    ) {
      // Tìm theo personAction (cho người nhận)
      foundItem = this.initialSelectedItems.find(
        (x) =>
          x.personAction === item.key ||
          x.personAction === item.id ||
          x.personAction === item.userName
      );
    } else {
      // Tìm theo receiveOrgId (cho đơn vị)
      foundItem = this.initialSelectedItems.find(
        (x) =>
          x.receiveOrgId === item.key ||
          x.receiveOrgId === item.id ||
          x.receiveOrgId === item.organizeCode
      );
    }

    return foundItem ? foundItem.status : 0;
  }

  // hasThuHoiThayThe(items: any[]): boolean {
  //   return
  // }
}
