import { BaseFilter } from '../../../shared/models';

export class OrganizeGroupOrgDto {
  id: string = '';
  groupCode: string = '';
  orgId: string = '';
  orgName: string = '';
}

export class OrganizeGroupDto extends BaseFilter {
  code: string = '';
  name: string = '';
  orgId: string = '';
  orgName: string = '';
  notes: string = '';
  orderNumber: number = 0;
  orgCount: number = 0;
  organizeGroupOrgs: OrganizeGroupOrgDto[] = [];
}
