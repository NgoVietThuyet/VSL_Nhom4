import { BaseFilter } from '../../../shared/models';

export class DocumentTypeDto extends BaseFilter {
  code: string = '';
  name: string = '';
  notes: string = '';
  orderNumber: number = 0;
}
