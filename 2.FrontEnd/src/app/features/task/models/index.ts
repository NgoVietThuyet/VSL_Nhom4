export class TaskWorkspaceDto {
  id: string = '';
  name: string = '';
  description?: string = '';
  ownerId?: string = '';
  isPublic?: boolean = false;
  createDate?: string;
}

export class TaskBoardDto {
  id: string = '';
  workspaceId: string = '';
  name: string = '';
  description?: string = '';
  isPublic?: boolean = false;
  backgroundColor?: string = '#0079BF';
  createDate?: string;
  lists?: TaskListDto[] = [];
  labels?: TaskLabelDto[] = [];
  members?: TaskBoardMemberDto[] = [];
}

export class TaskBoardMemberDto {
  id: string = '';
  boardId: string = '';
  userId: string = '';
  role?: string = 'member';
  userName?: string = '';
  fullName?: string = '';
  avatarFileId?: string | null;
}

export class TaskListDto {
  id: string = '';
  boardId: string = '';
  name: string = '';
  orderIndex?: number = 0;
  cards?: TaskCardDto[] = [];
}

export class TaskCardDto {
  id: string = '';
  listId: string = '';
  title: string = '';
  description?: string = '';
  startDate?: string;
  dueDate?: string;
  priority?: number;
  orderIndex?: number = 0;
  isArchived?: boolean = false;
  isCompleted?: boolean = false;
  createDate?: string;
  labels?: TaskCardLabelDto[] = [];
  members?: TaskCardMemberDto[] = [];
  checklists?: TaskChecklistDto[] = [];
  comments?: TaskCommentDto[] = [];
  files?: any[] = [];
}

export class TaskLabelDto {
  id: string = '';
  boardId: string = '';
  name: string = '';
  color: string = '#61BD4F';
  labelId?: string = '';
}

export class TaskCardLabelDto {
  id: string = '';
  cardId: string = '';
  labelId: string = '';
  name?: string = '';
  color?: string = '';
  taskCardLabelId?: string = '';
}

export class TaskCardMemberDto {
  id: string = '';
  cardId: string = '';
  userId: string = '';
  fullName?: string = '';
  avatarFileId?: string = '';
}

export class TaskChecklistDto {
  id: string = '';
  cardId: string = '';
  title: string = '';
  items?: TaskChecklistItemDto[] = [];
}

export class TaskChecklistItemDto {
  id: string = '';
  checklistId: string = '';
  content: string = '';
  isDone?: boolean = false;
  orderIndex?: number;
}

export class TaskCommentDto {
  id: string = '';
  cardId: string = '';
  userId: string = '';
  content: string = '';
  createDate?: string;
  userName?: string = '';
  fullName?: string = '';
}

export class TaskActivityDto {
  id: string = '';
  cardId: string = '';
  action: string = '';
  content: string = '';
  createDate?: string;
  userName?: string = '';
}

export const BOARD_BACKGROUNDS = [
  '#0079BF', '#D29034', '#519839', '#B04632',
  '#89609E', '#CD5A91', '#4BBF6B', '#00AECC',
  '#838C91', '#e74c3c', '#2ecc71', '#3498db',
];

export const LABEL_COLORS = [
  { color: '#61BD4F', name: 'Xanh lá' },
  { color: '#F2D600', name: 'Vàng' },
  { color: '#FF9F1A', name: 'Cam' },
  { color: '#EB5A46', name: 'Đỏ' },
  { color: '#C377E0', name: 'Tím' },
  { color: '#0079BF', name: 'Xanh dương' },
  { color: '#00C2E0', name: 'Xanh nhạt' },
  { color: '#51E898', name: 'Xanh mint' },
  { color: '#FF78CB', name: 'Hồng' },
  { color: '#344563', name: 'Đen' },
];

export const PRIORITY_LIST = [
  { value: 1, label: 'Thấp', color: '#52c41a' },
  { value: 2, label: 'Trung bình', color: '#faad14' },
  { value: 3, label: 'Cao', color: '#f5222d' },
  { value: 4, label: 'Khẩn cấp', color: '#722ed1' },
];
