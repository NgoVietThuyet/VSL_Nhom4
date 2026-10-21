import { Component, Input, input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTreeComponent, NzTreeNodeOptions, NzTreeNode } from 'ng-zorro-antd/tree';
import { GlobalService } from '../../../../../core';
import { SharedModules } from '../../../../../shared/ng-zorro.module';
import { WorkflowService } from '../../../../system-manager/services/workflow.service';
import { ModuleTypeService } from '../../../services/module-type.service';
import { OrganizeInService } from '../../../services/organize-in.service';
import { UserRoleService } from '../../../services/user-role.service';


@Component({
  selector: 'app-workflow-detail',
  imports: [SharedModules],
  templateUrl: './workflow-detail.component.html',
  styleUrl: './workflow-detail.component.scss'
})
export class WorkflowDetailComponent implements OnInit {
  @ViewChild('treeCom', { static: false }) treeCom!: NzTreeComponent

  @Input() id: string | null = null;
  workflowData: any = null;

  // Tree properties
  nodes: NzTreeNodeOptions[] = [];

  // Drawer properties
  drawerVisible: boolean = false;
  isEditStep: boolean = false;
  currentStep: any = null;

  // Form groups
  validateForm: FormGroup;
  validateStepForm: FormGroup;

  // Dropdown data sources
  moduleTypes: any[] = [];
  organizations: any[] = [];
  roles: any[] = [];
  workflowType: any[] = [
    { value: 'DIEU_HANH', label: 'Điều hành văn bản' },
    { value: 'XU_LY_CV', label: 'Xử lý công việc' },
  ];

  constructor(
    private router: Router,
    private location: Location,
    private fb: NonNullableFormBuilder,
    private activatedRoute: ActivatedRoute,
    private workflowService: WorkflowService,
    private moduleTypeService: ModuleTypeService,
    private organizeInService: OrganizeInService,
    private userRoleService: UserRoleService,
    private message: NzMessageService,
    public globalService: GlobalService,
  ) {
    this.validateForm = this.fb.group({
      id: [null],
      workflowCode: ['', [Validators.required]],
      workflowName: ['', [Validators.required]],
      workflowType: ['', [Validators.required]],
      moduleTypeCode: [null, [Validators.required]],
      organizeInCodes: [null, [Validators.required]],
      isActive: [true, [Validators.required]],
    });

    this.validateStepForm = this.fb.group({
      id: [null],
      pId: [null],
      workflowId: [null, [Validators.required]],
      userRoleCode: [null, [Validators.required]],
      isSoLoaiVB: [false],
      isTroLyGiamDoc: [false],
      isActive: [true, [Validators.required]],
    });
  }

  ngOnInit(): void {
    //this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.fetchDropdownData();

    if (this.id && this.id !== 'add') {
      this.loadWorkflowDetails(this.id);
    } else {
      this.id = null;
      this.globalService.setBreadcrumb([
        { name: 'Luồng quy trình', path: '/system-manager/workflow' },
        { name: 'Thêm mới', path: '' }
      ]);
    }
  }

  fetchDropdownData(): void {
    this.moduleTypeService.getAll().subscribe(res => {
      this.moduleTypes = res;
    });
    this.organizeInService.getOrg().subscribe((res: any) => {
      this.organizations = res;
    });
    this.userRoleService.search({ PageSize: 1000 }).subscribe(res => {
      this.roles = res.data;
    });
  }

  loadWorkflowDetails(id: string) {
    this.workflowService.getWorkflowDetail(id).subscribe(res => {

      this.workflowData = res;

      this.globalService.setBreadcrumb([
        { name: 'Luồng quy trình', path: '/system-manager/workflow' },
        { name: `Chỉnh sửa: ${this.workflowData.workflowName}`, path: '' }
      ]);
      this.validateForm.patchValue({
        id: this.workflowData.id,
        workflowCode: this.workflowData.workflowCode,
        workflowName: this.workflowData.workflowName,
        workflowType: this.workflowData.workflowType,
        moduleTypeCode: this.workflowData.moduleTypeCode,
        organizeInCodes: this.workflowData.workflowOrganizeIns.map((o: any) => o.organizeInCode),
        isActive: this.workflowData.isActive
      });

      this.loadWorkflowStepTree(id);

    });
  }

  loadWorkflowStepTree(id: string) {
    this.workflowService.getWorkflowStepTree(id).subscribe(res => {
      this.nodes = this.mapToTreeNodes(res.workflowSteps);
    });
  }

  mapToTreeNodes(steps: any[]): NzTreeNodeOptions[] {
    if (!steps) {
      return [];
    }
    return steps.map(step => {
      let title = step.userRoleName;
      if (step.isSoLoaiVB) {
        title += ' (Sơ loại văn bản)';
      }

      if(step.isTroLyGiamDoc) {
          title += ' (Trợ lý giám đốc)';
      }

      const node: NzTreeNodeOptions = {
        key: step.id,
        title: title,
        expanded: true,
        ...step
      };

      if (step.children && step.children.length > 0) {
        node.isLeaf = false;
        node.children = this.mapToTreeNodes(step.children);
      } else {
        node.isLeaf = true;
      }

      return node;
    });
  }

  submitWorkflow(): void {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formData = this.validateForm.getRawValue();
    const payload = {
      ...formData,
      workflowOrganizeIns: formData.organizeInCodes.map((code: string) => {
        const org = this.organizations.find(o => o.code === code);
        return { organizeInCode: code, organizeInName: org?.name || '' };
      })
    };
    delete payload.organizeInCodes;

    const action = this.id
      ? this.workflowService.updateWorkflow(payload)
      : this.workflowService.addWorkflow(payload);

    action.subscribe({
      next: (res) => {
        if (res.status) {
          if (!this.id && res.data?.id) {
            this.router.navigate([`../${res.data.id}`], { relativeTo: this.activatedRoute });
          }
        } else {
          this.message.error(res.messageObject.message || (this.id ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!'));
        }
      },
      error: () => this.message.error(this.id ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!')
    });
  }

  handleCancel() {
    const moduleTypeCode = this.validateForm.get('moduleTypeCode')?.value;
    if (moduleTypeCode) {
      this.workflowService.updateListDataByType(moduleTypeCode);
    }
    // this.location.back();
  }

  // #region Step Tree and Drawer Methods

  openAddStep(parentNode: any = null): void {
    this.isEditStep = false;
    this.currentStep = null;
    this.validateStepForm.reset({
      workflowId: this.id,
      pId: parentNode ? parentNode.key : null,
      isActive: true,
      isSoLoaiVB: false,
      isTroLyGiamDoc: false

    });
    this.drawerVisible = true;
  }

  openEditStep(node: any): void {
    this.isEditStep = true;
    this.currentStep = node.origin;
    this.validateStepForm.patchValue(this.currentStep);
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
  }

  submitStepForm(): void {
    if (this.validateStepForm.invalid) {
      Object.values(this.validateStepForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formData = this.validateStepForm.getRawValue();
    const payload = {
      ...formData,
      children: this.isEditStep ? this.currentStep.children : null
    };

    const action = this.isEditStep
      ? this.workflowService.updateWorkflowStep(payload)
      : this.workflowService.addWorkflowStep(payload);

    action.subscribe({
      next: (res) => {

        if (this.id) this.loadWorkflowStepTree(this.id);
        this.closeDrawer();

      },
      error: () => this.message.error('Thao tác thất bại!')
    });
  }

  deleteStep(stepId: string): void {
    this.workflowService.deleteWorkflowStep(stepId).subscribe({
      next: (res) => {
        if (this.id) this.loadWorkflowStepTree(this.id);
      },
      error: () => this.message.error('Xóa thất bại!')
    });
  }

  updateStepOrder(): void {
    if (!this.treeCom) {
      this.message.warning('Không thể truy cập cây quy trình.');
      return;
    }

    const treeData = this.treeCom.getTreeNodes().map(node => this.mapNodeToPayload(node));

    if (!treeData || treeData.length === 0) {
      this.message.info('Không có bước nào trong quy trình để cập nhật.');
      return;
    }

    this.workflowService.updateWorkflowStepTree(treeData).subscribe({
      next: res => {
        if (this.id) this.loadWorkflowStepTree(this.id);
      },
      error: () => {
        this.message.error('Cập nhật thứ tự thất bại!');
        if (this.id) this.loadWorkflowStepTree(this.id);
      }
    });
  }

  onDrop(event: any): void {
    // Reordering is saved via the "Update Order" button.
    // The tree component updates the view automatically after drag/drop.
  }

  private mapNodeToPayload(node: NzTreeNode): any {
    const children = node.children.map(child => this.mapNodeToPayload(child));
    const pId = node.parentNode ? node.parentNode.key : null;
    return {
      ...node.origin,
      pId: pId,
      id: node.key,
      workflowId: this.id,
      children: children.length > 0 ? children : null,
    };
  }
  // #endregion
}
