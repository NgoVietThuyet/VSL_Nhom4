export class NoteNotebookDto {
  id: string = '';
  workspaceId?: string = '';
  name?: string = '';
  description?: string = '';
  color?: string = '#189AD6';
  icon?: string = '';
  ownerId?: string = '';
  sections?: NoteSectionDto[] = [];
  updateDate?: Date
  createDate?: Date
  isShared?: boolean;
}

export class NoteShareDto {
  id: string = '';
  notebookId?: string = '';
  userId?: string = '';
  role?: string = 'view';
  status?: string = 'Pending';
  createBy?: string = '';
  notebook?: NoteNotebookDto;
}

export class NoteSectionDto {
  id: string = '';
  notebookId?: string = '';
  name?: string = '';
  orderNumber?: number = 0;
  color?: string = '#189AD6';
  pages?: NotePageDto[] = [];
  updateDate?: Date;
  createDate?: Date;
}

export class NotePageDto {
  id: string = '';
  sectionId?: string = '';
  title?: string = '';
  icon?: string = '';
  coverImage?: string = '';
  orderNumber?: number = 0;
  isPinned?: boolean = false;
  blocks?: NotePageBlockDto[] = [];
  updateDate?: Date;
  createDate?: Date;
}

export class NotePageBlockDto {
  id: string = '';
  pageId?: string = '';
  parentBlockId?: string = '';
  type?: string = 'paragraph';
  content?: string = '';
  orderNumber?: number = 0;
  depth?: number = 0;
  children?: NotePageBlockDto[] = [];
}

export const NOTEBOOK_COLORS = [
  { value: '#189AD6', label: 'Xanh dương' },
  { value: '#52c41a', label: 'Xanh lá' },
  { value: '#faad14', label: 'Vàng' },
  { value: '#f5222d', label: 'Đỏ' },
  { value: '#722ed1', label: 'Tím' },
  { value: '#13c2c2', label: 'Xanh lam' },
  { value: '#eb2f96', label: 'Hồng' },
  { value: '#fa541c', label: 'Cam' },
  { value: '#2f54eb', label: 'Indigo' },
  { value: '#595959', label: 'Xám' },
];

export const BLOCK_TYPES = [
  { value: 'paragraph',     label: 'Đoạn văn',        icon: 'align-left' },
  { value: 'heading1',      label: 'Tiêu đề 1',        icon: 'font-size' },
  { value: 'heading2',      label: 'Tiêu đề 2',        icon: 'font-size' },
  { value: 'heading3',      label: 'Tiêu đề 3',        icon: 'font-size' },
  { value: 'bulletList',    label: 'Danh sách',         icon: 'unordered-list' },
  { value: 'numberedList',  label: 'Danh sách số',      icon: 'ordered-list' },
  { value: 'todo',          label: 'Công việc',         icon: 'check-square' },
  { value: 'quote',         label: 'Trích dẫn',         icon: 'message' },
  { value: 'code',          label: 'Code',              icon: 'code' },
  { value: 'divider',       label: 'Đường phân cách',   icon: 'minus' },
];
