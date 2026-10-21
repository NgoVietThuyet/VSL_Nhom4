import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { BaseFilter } from '../../../shared/models';
import { CommonService } from '../../../shared/services';


@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private listDataByTypeSubject = new BehaviorSubject<any[]>([]);
  listDataByType$ = this.listDataByTypeSubject.asObservable();

  private selectedModuleType = new BehaviorSubject<any>(null);
  selectedModuleType$ = this.selectedModuleType.asObservable();

  constructor(private commonService: CommonService) { }

  setSelectedModuleType(resourceType: any): void {
    this.selectedModuleType.next(resourceType);
  }

  updateListDataByType(moduleTypeCode: string): void {
    const filter = new BaseFilter();
    filter.pageSize = 1000;
    const params = {
      ...filter,
      'DataFilter.ModuleTypeCode': moduleTypeCode
    }
    this.search(params).subscribe(result => {
        this.listDataByTypeSubject.next(result.data);

    });
  }

  // 1. Thêm Workflow mới
  addWorkflow(params: any): Observable<any> {
    return this.commonService.post('Workflow/AddWorkflow', params);
  }

  // 2. Tìm kiếm Workflow
  search(params: any): Observable<any> {
    return this.commonService.get('Workflow/Search', params);
  }

  // 3. Lấy chi tiết Workflow theo ID
  getById(id: string): Observable<any> {
    return this.commonService.get(`Workflow/GetById/${id}`);
  }

  // 4. Lấy chi tiết đầy đủ của Workflow
  getWorkflowDetail(id: string): Observable<any> {
    return this.commonService.get(`Workflow/GetWorkflowDetail/${id}`);
  }

  // 5. Lấy cây các bước của quy trình
  getWorkflowStepTree(id: string): Observable<any> {
    return this.commonService.get(`Workflow/GetWorkflowStepTree/${id}`);
  }

  // 6. Cập nhật Workflow
  updateWorkflow(params: any): Observable<any> {
    return this.commonService.put('Workflow/UpdateWorkflow', params);
  }

  // 7. Thêm bước quy trình
  addWorkflowStep(params: any): Observable<any> {
    return this.commonService.post('Workflow/AddWorkflowStep', params);
  }

  // 8. Cập nhật bước quy trình
  updateWorkflowStep(params: any): Observable<any> {
    return this.commonService.put('Workflow/UpdateWorkflowStep', params);
  }

  // 9. Xóa bước quy trình
  deleteWorkflowStep(id: string): Observable<any> {
    return this.commonService.delete(`Workflow/DeleteWorkflowStep/${id}`);
  }

  deleteWorkflows(id: string): Observable<any> {
    return this.commonService.delete(`Workflow/DeleteWorkflow/${id}`);
  }

  // 10. Cập nhật cấu trúc cây của các bước quy trình
  updateWorkflowStepTree(params: any): Observable<any> {
    return this.commonService.put('Workflow/UpdateWorkflowStepTree', params);
  }

  // 11. Xóa Workflow
  deleteWorkflow(id: string): Observable<any> {
    return this.commonService.delete(`Workflow/Delete/${id}`);
  }

  // 12. Xuất dữ liệu Workflow ra Excel
  export(params: any): Observable<any> {
    return this.commonService.downloadFile('Workflow/Export', params);
  }
}
