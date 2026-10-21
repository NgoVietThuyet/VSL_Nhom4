import { BaseFilter } from '../../../shared/models';

export class MainTaskDto extends BaseFilter {
  id: string = '';
  level: number = 0;
  parentId: string = '';
  name: string = '';
  description: string = '';
  startDate?: Date | string | null;
  deadline?: Date | string | null;
  endDate?: Date | string | null;
  status: number = 1;
  progress: number = 0;
  issuedByUnit: string = '';
  responsiblePerson: string = '';
  refrenceFileId: string = '';
  children?: MainTaskDto[];
  childrenCount?: number;
  hasChildren?: boolean;
  totalChildTaskCount?: number;
  expanded?: boolean;
}

export const MAIN_TASK_STATUS: Record<number, { label: string; color: string }> = {
  1: { label: 'Chưa thực hiện', color: 'default' },
  2: { label: 'Đang thực hiện', color: 'processing' },
  3: { label: 'Hoàn thành', color: 'success' },
};
