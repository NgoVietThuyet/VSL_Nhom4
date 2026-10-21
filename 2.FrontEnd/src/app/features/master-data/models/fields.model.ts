import { BaseFilter } from '../../../shared/models';

export class FieldsDto extends BaseFilter {
  code: string = '';
  name: string = '';
  orderNumber: number = 0;
}
