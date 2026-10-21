import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CommonService } from '../../../shared/services';
import {
    CrmCustomerDto, CrmLeadDto, ApiResponse, PagedResult,
    CrmOpportunityFullDto, CrmOpportunityPipelineDto, CrmOpportunityForecastDto, CrmChangeStageDto,
    CrmActivityFullDto,
    CrmCampaignDto, CrmCampaignMemberAddDto, CrmCampaignRoiDto,
    CrmQuotationDto, CrmQuotationActionDto,
    CrmProductDto,
    CrmLeadSourceDto, CrmCustomerGroupDto, CrmOpportunityStageDto, CrmCompetitorDto, CrmPriceListDto,
    CrmCustomerStatusDto, CrmCustomerTypeDto, CrmIndustryDto,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CrmService {
    constructor(private common: CommonService) { }

    // ─── Customer ───────────────────────────────────────────────
    searchCustomers(filter: CrmCustomerDto): Observable<any> {
        return this.common.post('Crm/Customer/Search', filter, false);
    }
    customerDetail(id: string): Observable<any> {
        return this.common.get(`Crm/Customer/Detail/${id}`, {});
    }
    createCustomer(data: CrmCustomerDto): Observable<any> {
        return this.common.post('Crm/Customer/Insert', data);
    }
    updateCustomer(data: CrmCustomerDto): Observable<any> {
        return this.common.put('Crm/Customer/Update', data);
    }
    deleteCustomer(id: string): Observable<any> {
        return this.common.delete(`Crm/Customer/Delete/${id}`, {});
    }
    exportCustomers(filter: CrmCustomerDto): Observable<any> {
        return this.common.get('Crm/Customer/Export', filter);
    }
    importCustomers(data: { customers: CrmCustomerDto[] }): Observable<any> {
        return this.common.post('Crm/Customer/Import', data);
    }

    // ─── Lead ───────────────────────────────────────────────────
    searchLeads(filter: CrmLeadDto): Observable<ApiResponse<PagedResult<CrmLeadDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmLeadDto>>>('Crm/Lead/Search', filter);
    }
    leadDetail(id: string): Observable<ApiResponse<CrmLeadDto>> {
        return this.common.get<ApiResponse<CrmLeadDto>>(`Crm/Lead/Detail/${id}`, {});
    }
    createLead(data: CrmLeadDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Lead/Insert', data);
    }
    updateLead(data: CrmLeadDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Lead/Update', data);
    }
    deleteLead(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Lead/Delete/${id}`, {});
    }
    importLeads(data: unknown): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Lead/Import', data);
    }
    convertLead(id: string): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Lead/Convert/${id}`, {});
    }

    // ─── Opportunity ────────────────────────────────────────────
    searchOpportunities(filter: CrmOpportunityFullDto): Observable<ApiResponse<PagedResult<CrmOpportunityFullDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmOpportunityFullDto>>>('Crm/Opportunity/Search', filter);
    }
    opportunityDetail(id: string): Observable<CrmOpportunityFullDto> {
        return this.common.get<CrmOpportunityFullDto>(`Crm/Opportunity/Detail/${id}`, {});
    }
    createOpportunity(data: CrmOpportunityFullDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Opportunity/Insert', data);
    }
    updateOpportunity(data: CrmOpportunityFullDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Opportunity/Update', data);
    }
    deleteOpportunity(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Opportunity/Delete/${id}`, {});
    }
    pipeline(): Observable<CrmOpportunityPipelineDto[]> {
        return this.common.get<CrmOpportunityPipelineDto[]>('Crm/Opportunity/Pipeline', {});
    }
    changeStage(id: string, data: CrmChangeStageDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Opportunity/ChangeStage/${id}`, data);
    }
    wonOpportunity(id: string): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Opportunity/Won/${id}`, {});
    }
    lostOpportunity(id: string): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Opportunity/Lost/${id}`, {});
    }
    forecast(from?: string, to?: string): Observable<CrmOpportunityForecastDto> {
        let url = 'Crm/Opportunity/Forecast';
        const params: string[] = [];
        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);
        if (params.length) url += '?' + params.join('&');
        return this.common.get<CrmOpportunityForecastDto>(url, {});
    }

    // ─── Activity ───────────────────────────────────────────────
    searchActivities(filter: CrmActivityFullDto): Observable<ApiResponse<PagedResult<CrmActivityFullDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmActivityFullDto>>>('Crm/Activity/Search', filter);
    }
    activityDetail(id: string): Observable<ApiResponse<CrmActivityFullDto>> {
        return this.common.get<ApiResponse<CrmActivityFullDto>>(`Crm/Activity/Detail/${id}`, {});
    }
    createActivity(data: CrmActivityFullDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Activity/Insert', data);
    }
    updateActivity(data: CrmActivityFullDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Activity/Update', data);
    }
    deleteActivity(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Activity/Delete/${id}`, {});
    }
    myTodayActivities(): Observable<ApiResponse<CrmActivityFullDto[]>> {
        return this.common.get<ApiResponse<CrmActivityFullDto[]>>('Crm/Activity/My-Today', {});
    }
    myUpcomingActivities(): Observable<ApiResponse<CrmActivityFullDto[]>> {
        return this.common.get<ApiResponse<CrmActivityFullDto[]>>('Crm/Activity/My-Upcoming', {});
    }

    // ─── Campaign ───────────────────────────────────────────────
    searchCampaigns(filter: CrmCampaignDto): Observable<ApiResponse<PagedResult<CrmCampaignDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmCampaignDto>>>('Crm/Campaign/Search', filter);
    }
    campaignDetail(id: string): Observable<ApiResponse<CrmCampaignDto>> {
        return this.common.get<ApiResponse<CrmCampaignDto>>(`Crm/Campaign/Detail/${id}`, {});
    }
    createCampaign(data: CrmCampaignDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Campaign/Insert', data);
    }
    updateCampaign(data: CrmCampaignDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Campaign/Update', data);
    }
    deleteCampaign(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Campaign/Delete/${id}`, {});
    }
    addCampaignMembers(data: CrmCampaignMemberAddDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Campaign/AddMembers', data);
    }
    campaignRoi(campaignId: string): Observable<ApiResponse<CrmCampaignRoiDto>> {
        return this.common.get<ApiResponse<CrmCampaignRoiDto>>(`Crm/Campaign/ROI?campaignId=${campaignId}`, {});
    }

    // ─── Quotation ──────────────────────────────────────────────
    searchQuotations(filter: CrmQuotationDto): Observable<ApiResponse<PagedResult<CrmQuotationDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmQuotationDto>>>('Crm/Quotation/Search', filter);
    }
    quotationDetail(id: string): Observable<ApiResponse<CrmQuotationDto>> {
        return this.common.get<ApiResponse<CrmQuotationDto>>(`Crm/Quotation/Detail/${id}`, {});
    }
    createQuotation(data: CrmQuotationDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Quotation/Insert', data);
    }
    updateQuotation(data: CrmQuotationDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Quotation/Update', data);
    }
    deleteQuotation(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Quotation/Delete/${id}`, {});
    }
    sendQuotation(id: string, data: CrmQuotationActionDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Quotation/Send/${id}`, data);
    }
    approveQuotation(id: string, data: CrmQuotationActionDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Quotation/Approve/${id}`, data);
    }
    convertQuotation(id: string, data: CrmQuotationActionDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>(`Crm/Quotation/Convert/${id}`, data);
    }

    // ─── Product ────────────────────────────────────────────────
    searchProducts(filter: CrmProductDto): Observable<ApiResponse<PagedResult<CrmProductDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmProductDto>>>('Crm/Product/Search', filter);
    }
    createProduct(data: CrmProductDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Product/Insert', data);
    }
    updateProduct(data: CrmProductDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Product/Update', data);
    }
    deleteProduct(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Product/Delete/${id}`, {});
    }

    // ─── Master Data: Lead Source ────────────────────────────────
    searchLeadSources(filter: CrmLeadSourceDto): Observable<ApiResponse<PagedResult<CrmLeadSourceDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmLeadSourceDto>>>('Crm/LeadSource/Search', filter);
    }
    createLeadSource(data: CrmLeadSourceDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/LeadSource/Insert', data);
    }
    updateLeadSource(data: CrmLeadSourceDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/LeadSource/Update', data);
    }
    deleteLeadSource(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/LeadSource/Delete/${id}`, {});
    }
    listLeadSources(): Observable<string[]> {
        return this.searchLeadSources({ pageSize: 999, currentPage: 1 } as any).pipe(
            map(r => (r?.data?.data ?? []).map((s: CrmLeadSourceDto) => s.name).filter(Boolean))
        );
    }

    // ─── Master Data: Customer Group ────────────────────────────
    searchCustomerGroups(filter: CrmCustomerGroupDto): Observable<ApiResponse<PagedResult<CrmCustomerGroupDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmCustomerGroupDto>>>('Crm/CustomerGroup/Search', filter);
    }
    createCustomerGroup(data: CrmCustomerGroupDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/CustomerGroup/Insert', data);
    }
    updateCustomerGroup(data: CrmCustomerGroupDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/CustomerGroup/Update', data);
    }
    deleteCustomerGroup(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/CustomerGroup/Delete/${id}`, {});
    }
    listCustomerGroups(): Observable<CrmCustomerGroupDto[]> {
        return this.searchCustomerGroups({ pageSize: 999, currentPage: 1 } as any).pipe(
            map(r => r?.data?.data ?? [])
        );
    }

    // ─── Master Data: Opportunity Stage ─────────────────────────
    searchOpportunityStages(filter: CrmOpportunityStageDto): Observable<ApiResponse<PagedResult<CrmOpportunityStageDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmOpportunityStageDto>>>('Crm/OpportunityStage/Search', filter);
    }
    createOpportunityStage(data: CrmOpportunityStageDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/OpportunityStage/Insert', data);
    }
    updateOpportunityStage(data: CrmOpportunityStageDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/OpportunityStage/Update', data);
    }
    deleteOpportunityStage(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/OpportunityStage/Delete/${id}`, {});
    }

    // ─── Master Data: Competitor ────────────────────────────────
    searchCompetitors(filter: CrmCompetitorDto): Observable<ApiResponse<PagedResult<CrmCompetitorDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmCompetitorDto>>>('Crm/Competitor/Search', filter);
    }
    createCompetitor(data: CrmCompetitorDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Competitor/Insert', data);
    }
    updateCompetitor(data: CrmCompetitorDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Competitor/Update', data);
    }
    deleteCompetitor(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Competitor/Delete/${id}`, {});
    }

    // ─── Master Data: Price List ────────────────────────────────
    searchPriceLists(filter: CrmPriceListDto): Observable<ApiResponse<PagedResult<CrmPriceListDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmPriceListDto>>>('Crm/PriceList/Search', filter);
    }
    createPriceList(data: CrmPriceListDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/PriceList/Insert', data);
    }
    updatePriceList(data: CrmPriceListDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/PriceList/Update', data);
    }
    deletePriceList(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/PriceList/Delete/${id}`, {});
    }

    // ─── Master Data: Customer Status ───────────────────────────
    searchCustomerStatuses(filter: CrmCustomerStatusDto): Observable<ApiResponse<PagedResult<CrmCustomerStatusDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmCustomerStatusDto>>>('Crm/CustomerStatus/Search', filter);
    }
    createCustomerStatus(data: CrmCustomerStatusDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/CustomerStatus/Insert', data);
    }
    updateCustomerStatus(data: CrmCustomerStatusDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/CustomerStatus/Update', data);
    }
    deleteCustomerStatus(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/CustomerStatus/Delete/${id}`, {});
    }
    listCustomerStatuses(): Observable<string[]> {
        return this.searchCustomerStatuses({ pageSize: 999, currentPage: 1 } as any).pipe(
            map(r => (r?.data?.data ?? []).map((s: CrmCustomerStatusDto) => s.name).filter(Boolean))
        );
    }

    // ─── Master Data: Customer Type ─────────────────────────────
    searchCustomerTypes(filter: CrmCustomerTypeDto): Observable<ApiResponse<PagedResult<CrmCustomerTypeDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmCustomerTypeDto>>>('Crm/CustomerType/Search', filter);
    }
    createCustomerType(data: CrmCustomerTypeDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/CustomerType/Insert', data);
    }
    updateCustomerType(data: CrmCustomerTypeDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/CustomerType/Update', data);
    }
    deleteCustomerType(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/CustomerType/Delete/${id}`, {});
    }
    listCustomerTypes(): Observable<string[]> {
        return this.searchCustomerTypes({ pageSize: 999, currentPage: 1 } as any).pipe(
            map(r => (r?.data?.data ?? []).map((t: CrmCustomerTypeDto) => t.name).filter(Boolean))
        );
    }

    // ─── Master Data: Industry ──────────────────────────────────
    searchIndustries(filter: CrmIndustryDto): Observable<ApiResponse<PagedResult<CrmIndustryDto>>> {
        return this.common.post<ApiResponse<PagedResult<CrmIndustryDto>>>('Crm/Industry/Search', filter);
    }
    createIndustry(data: CrmIndustryDto): Observable<ApiResponse<unknown>> {
        return this.common.post<ApiResponse<unknown>>('Crm/Industry/Insert', data);
    }
    updateIndustry(data: CrmIndustryDto): Observable<ApiResponse<unknown>> {
        return this.common.put<ApiResponse<unknown>>('Crm/Industry/Update', data);
    }
    deleteIndustry(id: string): Observable<ApiResponse<unknown>> {
        return this.common.delete<ApiResponse<unknown>>(`Crm/Industry/Delete/${id}`, {});
    }
    listIndustries(): Observable<string[]> {
        return this.searchIndustries({ pageSize: 999, currentPage: 1 } as any).pipe(
            map(r => (r?.data?.data ?? []).map((i: CrmIndustryDto) => i.name).filter(Boolean))
        );
    }
}
