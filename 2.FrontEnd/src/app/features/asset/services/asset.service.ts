import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import {
    AstCategoryDto, AstAssetDto, AstAssignmentDto, AstTransferDto,
    AstMaintenanceDto, AstDepreciationDto, AstDepreciationRunRequestDto,
    AstInventoryCountDto, AstInventoryCountLineDto, AstInventoryScanRequestDto,
    AstDisposalDto, AstLicenseDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class AstCategoryService {
    constructor(private common: CommonService) { }
    search(p: AstCategoryDto) { return this.common.get('Asset/Category/Search', p); }
    getAll() { return this.common.get('Asset/Category/GetAll', {}); }
    tree() { return this.common.get('Asset/Category/Tree', {}); }
    detail(id: string) { return this.common.get(`Asset/Category/Detail/${id}`, {}); }
    insert(d: AstCategoryDto) { return this.common.post('Asset/Category/Insert', d); }
    update(d: AstCategoryDto) { return this.common.put('Asset/Category/Update', d); }
    delete(id: string) { return this.common.delete(`Asset/Category/Delete/${id}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class AstAssetService {
    constructor(private common: CommonService) { }
    search(p: AstAssetDto) { return this.common.get('Asset/Asset/Search', p); }
    searchMine(p: AstAssetDto) { return this.common.get('Asset/Asset/SearchMine', p); }
    detail(id: string) { return this.common.get(`Asset/Asset/Detail/${id}`, {}); }
    scan(barcode: string) { return this.common.get(`Asset/Asset/Scan/${encodeURIComponent(barcode)}`, {}); }
    nextCode() { return this.common.get('Asset/Asset/NextCode', {}); }
    dashboard(organizeId?: string) { return this.common.get('Asset/Asset/Dashboard', { organizeId: organizeId || '' }); }
    insert(d: AstAssetDto) { return this.common.post('Asset/Asset/Insert', d); }
    update(d: AstAssetDto) { return this.common.put('Asset/Asset/Update', d); }
    import(d: AstAssetDto[]) { return this.common.post('Asset/Asset/Import', d); }
    delete(id: string) { return this.common.delete(`Asset/Asset/Delete/${id}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class AstAssignmentService {
    constructor(private common: CommonService) { }
    search(p: AstAssignmentDto) { return this.common.get('Asset/Assignment/Search', p); }
    searchMine(p: AstAssignmentDto) { return this.common.get('Asset/Assignment/SearchMine', p); }
    detail(id: string) { return this.common.get(`Asset/Assignment/Detail/${id}`, {}); }
    assign(d: AstAssignmentDto) { return this.common.post('Asset/Assignment/Assign', d); }
    return(id: string, d: AstAssignmentDto) { return this.common.post(`Asset/Assignment/Return/${id}`, d); }
}

@Injectable({ providedIn: 'root' })
export class AstTransferService {
    constructor(private common: CommonService) { }
    search(p: AstTransferDto) { return this.common.get('Asset/Transfer/Search', p); }
    detail(id: string) { return this.common.get(`Asset/Transfer/Detail/${id}`, {}); }
    insert(d: AstTransferDto) { return this.common.post('Asset/Transfer/Insert', d); }
    approve(id: string) { return this.common.post(`Asset/Transfer/Approve/${id}`, {}); }
    reject(id: string, d: AstTransferDto) { return this.common.post(`Asset/Transfer/Reject/${id}`, d); }
}

@Injectable({ providedIn: 'root' })
export class AstMaintenanceService {
    constructor(private common: CommonService) { }
    search(p: AstMaintenanceDto) { return this.common.get('Asset/Maintenance/Search', p); }
    detail(id: string) { return this.common.get(`Asset/Maintenance/Detail/${id}`, {}); }
    schedule(d: AstMaintenanceDto) { return this.common.post('Asset/Maintenance/Schedule', d); }
    complete(id: string, d: AstMaintenanceDto) { return this.common.post(`Asset/Maintenance/Complete/${id}`, d); }
    update(d: AstMaintenanceDto) { return this.common.put('Asset/Maintenance/Update', d); }
}

@Injectable({ providedIn: 'root' })
export class AstDepreciationService {
    constructor(private common: CommonService) { }
    search(p: AstDepreciationDto) { return this.common.get('Asset/Depreciation/Search', p); }
    run(d: AstDepreciationRunRequestDto) { return this.common.post('Asset/Depreciation/Run', d); }
}

@Injectable({ providedIn: 'root' })
export class AstInventoryService {
    constructor(private common: CommonService) { }
    search(p: AstInventoryCountDto) { return this.common.get('Asset/InventoryCount/Search', p); }
    detail(id: string) { return this.common.get(`Asset/InventoryCount/Detail/${id}`, {}); }
    lines(p: AstInventoryCountLineDto) { return this.common.get('Asset/InventoryCount/Lines', p); }
    insert(d: AstInventoryCountDto) { return this.common.post('Asset/InventoryCount/Insert', d); }
    scan(d: AstInventoryScanRequestDto) { return this.common.post('Asset/InventoryCount/Scan', d); }
    complete(id: string) { return this.common.post(`Asset/InventoryCount/Complete/${id}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class AstDisposalService {
    constructor(private common: CommonService) { }
    search(p: AstDisposalDto) { return this.common.get('Asset/Disposal/Search', p); }
    detail(id: string) { return this.common.get(`Asset/Disposal/Detail/${id}`, {}); }
    submit(d: AstDisposalDto) { return this.common.post('Asset/Disposal/Submit', d); }
    approve(id: string) { return this.common.post(`Asset/Disposal/Approve/${id}`, {}); }
    reject(id: string, d: AstDisposalDto) { return this.common.post(`Asset/Disposal/Reject/${id}`, d); }
}

@Injectable({ providedIn: 'root' })
export class AstLicenseService {
    constructor(private common: CommonService) { }
    search(p: AstLicenseDto) { return this.common.get('Asset/License/Search', p); }
    expiringSoon(days: number = 30) { return this.common.get('Asset/License/ExpiringSoon', { days }); }
    detail(id: string) { return this.common.get(`Asset/License/Detail/${id}`, {}); }
    insert(d: AstLicenseDto) { return this.common.post('Asset/License/Insert', d); }
    update(d: AstLicenseDto) { return this.common.put('Asset/License/Update', d); }
    delete(id: string) { return this.common.delete(`Asset/License/Delete/${id}`, {}); }
}
