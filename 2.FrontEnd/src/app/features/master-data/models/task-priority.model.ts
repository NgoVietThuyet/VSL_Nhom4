import { BaseFilter } from '../../../shared/models';

export class TaskPriorityDto extends BaseFilter {
  code: string = '';
  name: string = '';
  color: string = '#c82527';
  notes: string = '';
  orderNumber: number = 0;
}
