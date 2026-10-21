import { BaseFilter } from '../../../shared/models';

// ─── Customer ───────────────────────────────────────────────────
export class CrmCustomerDto extends BaseFilter {
    id = '';
    code = '';
    customerType = '';
    name = '';
    shortName = '';
    taxCode = '';
    industry = '';
    website = '';
    email = '';
    phone = '';
    address = '';
    groupId = '';
    ownerUser = '';
    status = '';
    leadSource = '';
    convertedFromLeadId = '';
    totalRevenue: number | null = null;
    lastActivityDate?: string = '';
    note = '';
    createdBy = '';
    updatedBy = '';
    contacts: CrmContactDto[] = [];
    addresses: CrmCustomerAddressDto[] = [];
    opportunities: CrmOpportunityFullDto[] = [];
    activities: CrmActivityFullDto[] = [];
}

export class CrmContactDto {
    id = '';
    customerId = '';
    fullName = '';
    title = '';
    phone = '';
    email = '';
    department = '';
    role = '';
    ownerUser = '';
    note = '';
}

export class CrmCustomerAddressDto {
    id = '';
    customerId = '';
    addressType = '';
    street = '';
    city = '';
    province = '';
    country = '';
    postalCode = '';
    note = '';
}

export class CrmCustomerMergeDto {
    sourceCustomerId = '';
    targetCustomerId = '';
}

export class CrmCustomerAssignDto {
    customerId = '';
    ownerUser = '';
}

// ─── Lead ───────────────────────────────────────────────────────
export class CrmLeadDto extends BaseFilter {
    id = '';
    code = '';
    fullName = '';
    company = '';
    email = '';
    phone = '';
    sourceCode = '';
    status = '';
    ownerUser = '';
    campaignId = '';
    score: number | null = null;
    convertedCustomerId = '';
    convertedOpportunityId = '';
    expectedCloseDate?: string = '';
    amount: number | null = null;
    note = '';
    createdBy = '';
    updatedBy = '';
}

// ─── Opportunity ────────────────────────────────────────────────
export class CrmOpportunityFullDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    customerId = '';
    stageCode = '';
    amount: number | null = null;
    probability: number | null = null;
    expectedRevenue: number | null = null;
    closeDate = '';
    actualCloseDate = '';
    ownerUser = '';
    lossReason = '';
    competitorId = '';
    quotationId = '';
    products: CrmOpportunityProductDto[] = [];
}

export class CrmOpportunityStageDto {
    id = '';
    code = '';
    name = '';
    sortOrder: number | null = null;
}

export class CrmOpportunityProductDto {
    id = '';
    opportunityId = '';
    productId = '';
    quantity: number | null = null;
    unitPrice: number | null = null;
    discount: number | null = null;
    amount: number | null = null;
}

export class CrmChangeStageDto {
    stageCode = '';
}

export class CrmOpportunityPipelineDto {
    stageCode = '';
    stageName = '';
    count = 0;
    opportunities: CrmOpportunityFullDto[] = [];
}

export class CrmOpportunityForecastDto {
    totalExpectedRevenue = 0;
    totalWonRevenue = 0;
    totalLostRevenue = 0;
}

// ─── Quotation ──────────────────────────────────────────────────
export class CrmQuotationDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    customerId = '';
    opportunityId = '';
    status = '';
    totalAmount: number | null = null;
    discountAmount: number | null = null;
    netAmount: number | null = null;
    validUntil = '';
    ownerUser = '';
    note = '';
    currency = '';
    sentDate = '';
    items: CrmQuotationItemDto[] = [];
}

export class CrmQuotationItemDto {
    id = '';
    quotationId = '';
    productId = '';
    description = '';
    quantity: number | null = null;
    unitPrice: number | null = null;
    discount: number | null = null;
    amount: number | null = null;
}

export class CrmQuotationActionDto {
    note = '';
}

// ─── Activity ───────────────────────────────────────────────────
export class CrmActivityFullDto extends BaseFilter {
    id = '';
    activityType = '';
    subject = '';
    description = '';
    relatedType = '';
    relatedId = '';
    ownerUser = '';
    startTime = '';
    endTime = '';
    status = '';
    calendarEventId = '';
}

// ─── Campaign ───────────────────────────────────────────────────
export class CrmCampaignDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    ownerUser = '';
    startDate = '';
    endDate = '';
    budget: number | null = null;
    status = '';
    members: CrmCampaignMemberDto[] = [];
}

export class CrmCampaignMemberDto {
    id = '';
    campaignId = '';
    leadId = '';
    role = '';
}

export class CrmCampaignMemberAddDto {
    campaignId = '';
    leadIds: string[] = [];
}

export class CrmCampaignRoiDto {
    campaignId = '';
    budget = 0;
    totalWonAmount = 0;
    roi = 0;
}

// ─── Product ────────────────────────────────────────────────────
export class CrmProductDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    unitPrice: number | null = null;
    unitOfMeasure = '';
    isService: boolean | null = null;
}

// ─── Master Data ────────────────────────────────────────────────
export class CrmLeadSourceDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
}

export class CrmCustomerGroupDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    category = '';
}

export class CrmPriceListDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    customerGroupId = '';
    currency = '';
    note = '';
}

export class CrmCompetitorDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
}

export class CrmCustomerStatusDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    sortOrder: number | null = null;
}

export class CrmCustomerTypeDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    sortOrder: number | null = null;
}

export class CrmIndustryDto extends BaseFilter {
    id = '';
    code = '';
    name = '';
    description = '';
    sortOrder: number | null = null;
}

// ─── Backward compat aliases ────────────────────────────────────
/** @deprecated Use CrmContactDto */
export { CrmContactDto as CrmCustomerContactDto };

/** @deprecated Use CrmOpportunityFullDto for full opportunity */
export class CrmOpportunityDto {
    id = '';
    code = '';
    name = '';
    stage = '';
    amount: number | null = null;
    expectedCloseDate = '';
}

/** @deprecated Use CrmActivityFullDto for full activity */
export class CrmActivityDto {
    id = '';
    subject = '';
    type = '';
    status = '';
    dueDate = '';
    ownerUser = '';
}

// ─── Common response types ──────────────────────────────────────
export interface ApiResponse<T> {
    status: boolean;
    data: T;
    messageObject?: {
        code?: string;
        message?: string;
        messageDetail?: string;
        logId?: string;
    };
}

export interface PagedResult<T> {
    data: T[];
    totalRecord: number;
}
