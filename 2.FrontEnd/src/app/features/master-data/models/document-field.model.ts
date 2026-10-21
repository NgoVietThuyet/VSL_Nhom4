import { BaseFilter } from '../../../shared/models';

export class DocumentFieldDto extends BaseFilter {
  code: string = '';
  name: string = '';
  notes: string = '';
  fieldsCode: string = '';
  orderNumber: number = 0;
}
