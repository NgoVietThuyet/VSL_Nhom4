import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GlobalService } from '../../../../core';
import { WorkflowService } from '../../../system-manager/services/workflow.service';
import { ModuleTypeService } from '../../services/module-type.service';
import { MenuLeftComponent } from './menu-left/menu-left.component';


@Component({
  selector: 'app-workflow',
  imports: [MenuLeftComponent, RouterModule, NzIconModule],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss'
})
export class WorkflowComponent implements OnInit {
  resourceTypes: any[] = [];
  selectedResourceType: any = null;
  listDataByType: any[] = [];

  constructor(
    public globalService: GlobalService,
    private router: Router,
    private workflowService: WorkflowService,
    private moduleTypeService: ModuleTypeService
  ) {
    this.globalService.setBreadcrumb([
      {
        name: 'Luồng quy trình',
        path: 'workflow',
      },
    ])
  }

  ngOnInit(): void {
    this.getModuleTypes();
  }

  getModuleTypes(): void {
    this.globalService.showLoading();
    this.moduleTypeService.getAll().subscribe({
      next: res => {
        this.resourceTypes = res.map((item: any) => ({
          ...item,
          id: item.code, // Map code to id for menu-left component
        }));
        if (this.resourceTypes.length > 0) {
          this.selectResourceType(this.resourceTypes[0]);
        }
      },
      complete: () => {
        this.globalService.hideLoading();
      }
    });
  }

  selectResourceType(resourceType: any): void {
    this.selectedResourceType = resourceType;
    this.workflowService.setSelectedModuleType(resourceType);
    this.workflowService.updateListDataByType(resourceType.id);
    this.router.navigate(['system-manager/workflow'])
  }
}
