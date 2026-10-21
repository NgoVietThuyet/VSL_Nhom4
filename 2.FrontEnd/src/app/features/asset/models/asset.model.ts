import { BaseFilter } from '../../../shared/models';

export class AstCategoryDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    pId: string = '';
    assetType: string = 'TSCD';
    defaultUsefulLifeMonths: number | null = null;
    defaultDepreciationMethod: string = 'STRAIGHT';
    icon: string = '';
    color: string = '';
    orderNumber: number = 0;
    description: string = '';
}

export class AstAssetDto extends BaseFilter {
    id: string = '';
    code: string = '';
    barcode: string = '';
    name: string = '';
    categoryId: string = '';
    categoryName?: string = '';
    assetType: string = 'TSCD';
    brand: string = '';
    model: string = '';
    serial: string = '';
    specification: string = '';
    purchaseDate?: string = '';
    purchasePrice: number | null = null;
    supplier: string = '';
    invoiceCode: string = '';
    warrantyEnd?: string = '';
    usefulLifeMonths: number | null = null;
    depreciationMethod: string = 'STRAIGHT';
    depreciationStartDate?: string = '';
    accumulatedDepreciation: number = 0;
    bookValue: number | null = null;
    salvageValue: number | null = null;
    currency: string = 'VND';
    location: string = '';
    organizeId: string = '';
    organizeName?: string = '';
    currentHolder: string = '';
    currentHolderName?: string = '';
    status: string = 'AVAILABLE';
    condition: string = 'GOOD';
    imagePath: string = '';
    note: string = '';
    statusFilter?: string = '';
    categoryIdFilter?: string = '';
    organizeIdFilter?: string = '';
    holderFilter?: string = '';
}

export class AstAssetHistoryDto extends BaseFilter {
    id: string = '';
    assetId: string = '';
    action: string = '';
    fromValue: string = '';
    toValue: string = '';
    note: string = '';
    actionBy: string = '';
    actionDate?: string = '';
}

export class AstAssignmentDto extends BaseFilter {
    id: string = '';
    code: string = '';
    assetId: string = '';
    assetCode?: string = '';
    assetName?: string = '';
    assigneeUser: string = '';
    assigneeUserName?: string = '';
    assigneeOrg: string = '';
    assigneeOrgName?: string = '';
    assignedDate?: string = '';
    returnedDate?: string = '';
    condition: string = 'GOOD';
    returnCondition: string = '';
    handoverFilePath: string = '';
    returnFilePath: string = '';
    status: string = '';
    note: string = '';
}

export class AstTransferDto extends BaseFilter {
    id: string = '';
    code: string = '';
    assetId: string = '';
    assetCode?: string = '';
    assetName?: string = '';
    fromUser: string = '';
    toUser: string = '';
    fromOrg: string = '';
    toOrg: string = '';
    fromLocation: string = '';
    toLocation: string = '';
    transferDate?: string = '';
    reason: string = '';
    status: string = '';
    documentFilePath: string = '';
    note: string = '';
}

export class AstMaintenanceDto extends BaseFilter {
    id: string = '';
    code: string = '';
    assetId: string = '';
    assetCode?: string = '';
    assetName?: string = '';
    maintenanceType: string = 'PREVENTIVE';
    title: string = '';
    description: string = '';
    scheduledDate?: string = '';
    startedDate?: string = '';
    completedDate?: string = '';
    cost: number | null = null;
    currency: string = 'VND';
    vendor: string = '';
    performedBy: string = '';
    result: string = '';
    status: string = 'SCHEDULED';
    attachmentPath: string = '';
    nextDueDate?: string = '';
}

export class AstDepreciationDto extends BaseFilter {
    id: string = '';
    assetId: string = '';
    assetCode?: string = '';
    assetName?: string = '';
    periodCode: string = '';
    periodYear: number | null = null;
    periodMonth: number | null = null;
    amount: number = 0;
    accumulatedAfter: number = 0;
    bookValueAfter: number = 0;
    journalEntryId: string = '';
    status: string = '';
    postedDate?: string = '';
    postedBy: string = '';
    note: string = '';
}

export class AstDepreciationRunRequestDto {
    periodCode: string = '';
    periodYear: number | null = null;
    periodMonth: number | null = null;
    assetIds: string[] = [];
}

export class AstInventoryCountDto extends BaseFilter {
    id: string = '';
    code: string = '';
    title: string = '';
    countDate?: string = '';
    organizeId: string = '';
    location: string = '';
    responsible: string = '';
    status: string = 'DRAFT';
    totalExpected: number = 0;
    totalActual: number = 0;
    totalMissing: number = 0;
    totalSurplus: number = 0;
    startedDate?: string = '';
    completedDate?: string = '';
    note: string = '';
}

export class AstInventoryCountLineDto extends BaseFilter {
    id: string = '';
    countId: string = '';
    assetId: string = '';
    assetCode: string = '';
    assetName: string = '';
    expectedHolder: string = '';
    expectedLocation: string = '';
    actualHolder: string = '';
    actualLocation: string = '';
    condition: string = '';
    status: string = '';
    scannedDate?: string = '';
    scannedBy: string = '';
    note: string = '';
}

export class AstInventoryScanRequestDto {
    countId: string = '';
    barcode: string = '';
    actualHolder: string = '';
    actualLocation: string = '';
    condition: string = 'GOOD';
    note: string = '';
}

export class AstDisposalDto extends BaseFilter {
    id: string = '';
    code: string = '';
    assetId: string = '';
    assetCode?: string = '';
    assetName?: string = '';
    disposalDate?: string = '';
    disposalType: string = 'LIQUIDATE';
    reason: string = '';
    salePrice: number | null = null;
    bookValueAtDisposal: number = 0;
    gainLoss: number = 0;
    buyer: string = '';
    journalEntryId: string = '';
    wfInstanceId: string = '';
    status: string = '';
    attachmentPath: string = '';
    note: string = '';
}

export class AstLicenseDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    assetId: string = '';
    licenseType: string = 'SUBSCRIPTION';
    licenseKey: string = '';
    vendor: string = '';
    seatTotal: number | null = null;
    seatUsed: number = 0;
    startDate?: string = '';
    expiryDate?: string = '';
    cost: number | null = null;
    currency: string = 'VND';
    status: string = 'ACTIVE';
    attachmentPath: string = '';
    note: string = '';
}

export class AstDashboardSummaryDto {
    totalAssets: number = 0;
    available: number = 0;
    inUse: number = 0;
    maintenance: number = 0;
    broken: number = 0;
    disposed: number = 0;
    totalPurchaseValue: number = 0;
    totalBookValue: number = 0;
    totalAccumulatedDepreciation: number = 0;
    licensesExpiringSoon: number = 0;
    maintenanceDueSoon: number = 0;
    byCategory: any[] = [];
    byStatus: any[] = [];
}
