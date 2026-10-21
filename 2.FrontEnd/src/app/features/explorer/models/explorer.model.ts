export interface ExplorerItem {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
  path?: string | null;
  size?: number | null;
  sizeText?: string | null;
  ownerId?: string | null;
  isFolder?: boolean | null;
  isFavorite?: boolean | null;
  isShared?: boolean | null;
  isDeleted?: boolean | null;
  color?: string | null;
  tagId?: string | null;
  childCount?: number | null;
  createDate?: string | Date | null;
  updateDate?: string | Date | null;
  viewDate?: string | Date | null;
  isActive?: boolean | null;
  checked?: boolean;
}

export interface ExplorerShareItem {
  id?: string;
  itemId?: string;
  userId?: string;
  role?: 'view' | 'edit' | 'admin' | string;
}

export interface ExplorerShareLinkItem {
  id?: string;
  itemId?: string;
  shareCode?: string;
  isEnabled?: boolean;
  expiredDate?: string | Date;
}

export interface ExplorerTagItem {
  id?: string;
  name?: string;
  color?: string;
}

export interface ExplorerActivityItem {
  id?: string;
  itemId?: string;
  action?: string;
  description?: string;
  userId?: string;
  createDate?: string | Date;
}
