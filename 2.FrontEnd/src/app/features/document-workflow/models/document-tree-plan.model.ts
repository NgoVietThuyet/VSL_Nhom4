export interface DocumentTreePlanNode {
  id: string;
  pId?: string | null;
  name?: string;
  nameKhongDau?: string;
  type: 'ORG' | 'USER' | string;
  isDisabled?: boolean;
  isNotCreatePlan?: boolean;
  isLanhDao?: boolean;
  isChuTri?: boolean;
  isChuTriDisabled?: boolean;
  isXuLyChinh?: boolean;
  isXuLyChinhDisabled?: boolean;
  isPhoiHop?: boolean;
  isPhoiHopDisabled?: boolean;
  isNhanDeBiet?: boolean;
  isNhanDeBietDisabled?: boolean;
  isShowCheckbox?: boolean;
  color?: string;
  kieuXuLyChecked?: string;
  orderNumber?: number;
  expand?: boolean;
  level?: number;
  key?: string;
  children?: DocumentTreePlanNode[];
  parent?: DocumentTreePlanNode;
}

export interface BuildTreePlanRequest {
  phanLoai?: number | null;
  rootOrgId?: string | null;
  deXuatLanhDaoXuLy?: string | null;
}

export interface DcPlanSelection {
  planPreview: DocumentTreePlanNode[];
  toOrganizationIds: string[];
  toUsernames: string[];
  leaderUsername?: string;
  deXuatLanhDaoXuLy?: string;
}
