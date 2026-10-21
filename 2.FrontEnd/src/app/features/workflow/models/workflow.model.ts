import { BaseFilter } from '../../../shared/models';

export class WfProcessCategoryDto extends BaseFilter {
    code: string = '';
    name: string = '';
    icon: string = '';
    color: string = '';
    orderNumber: number = 0;
    description: string = '';
}

export class WfProcessDefinitionDto extends BaseFilter {
    id: string = '';
    code: string = '';
    name: string = '';
    categoryCode: string = '';
    categoryName?: string = '';
    version: string = '1.0';
    isPublished: boolean = false;
    description: string = '';
    icon: string = '';
    color: string = '';
    formSchema: string = '';
    titleTemplate: string = '';
    orderNumber: number = 0;
    notes: string = '';
}

export class WfProcessStepDto {
    id: string = '';
    processDefinitionId: string = '';
    stepCode: string = '';
    name: string = '';
    stepType: string = 'APPROVAL';
    mode: string = 'SEQUENTIAL';
    assigneeType: string = 'USER';
    assigneeValue: string = '';
    slaHours: number = 0;
    allowReturn: boolean = true;
    allowReject: boolean = true;
    allowDelegate: boolean = false;
    autoApproveIfInitiator: boolean = false;
    orderNumber: number = 0;
    positionX: number = 0;
    positionY: number = 0;
    notes: string = '';
    isActive: boolean = true;
}

export class WfProcessTransitionDto {
    id: string = '';
    processDefinitionId: string = '';
    fromStepCode: string = '';
    toStepCode: string = '';
    condition: string = '';
    label: string = '';
    orderNumber: number = 0;
    isActive: boolean = true;
}

export class WfProcessDesignDto {
    definition: WfProcessDefinitionDto = new WfProcessDefinitionDto();
    steps: WfProcessStepDto[] = [];
    transitions: WfProcessTransitionDto[] = [];
}

export class WfInstanceDto extends BaseFilter {
    id: string = '';
    code: string = '';
    processDefinitionId: string = '';
    processName?: string = '';
    processIcon?: string = '';
    processColor?: string = '';
    title: string = '';
    initiatorBy: string = '';
    initiatorFullName?: string = '';
    initiatorDate?: string = '';
    currentStepCode?: string = '';
    currentStepName?: string = '';
    status: string = '';
    priority: string = '';
    dueDate?: string = '';
    completedDate?: string = '';
    formData: string = '';
    reason: string = '';
    notes: string = '';
    scope: string = '';
}

export class WfInstanceAssignmentDto {
    id: string = '';
    instanceId: string = '';
    instanceStepId: string = '';
    stepCode: string = '';
    assigneeUser: string = '';
    assigneeUserFullName: string = '';
    assigneeGroup: string = '';
    assigneeGroupName: string = '';
    status: string = '';
    action: string = '';
    assignedDate: string = '';
    actionDate: string = '';
    comment: string = '';
    delegatedFrom: string = '';
}

export class WfInstanceStepDto {
    id: string = '';
    instanceId: string = '';
    stepCode: string = '';
    stepName: string = '';
    stepType: string = '';
    mode: string = '';
    status: string = '';
    startedDate: string = '';
    completedDate: string = '';
    dueDate: string = '';
    orderNumber: number = 0;
    assignments: WfInstanceAssignmentDto[] = [];
}

export class WfInstanceHistoryDto {
    id: string = '';
    instanceId: string = '';
    stepCode: string = '';
    stepName: string = '';
    action: string = '';
    fromStatus: string = '';
    toStatus: string = '';
    actionBy: string = '';
    actionDate: string = '';
    comment: string = '';
}

export class WfInstanceAttachmentDto {
    id: string = '';
    instanceId: string = '';
    fileName: string = '';
    filePath: string = '';
    fileType: string = '';
    fileSize: number = 0;
    uploadedBy: string = '';
    uploadedDate: string = '';
}

export class WfInstanceDetailDto {
    instance: WfInstanceDto = new WfInstanceDto();
    definition: WfProcessDefinitionDto = new WfProcessDefinitionDto();
    definitionSteps: WfProcessStepDto[] = [];
    definitionTransitions: WfProcessTransitionDto[] = [];
    steps: WfInstanceStepDto[] = [];
    history: WfInstanceHistoryDto[] = [];
    attachments: WfInstanceAttachmentDto[] = [];
    canAction: boolean = false;
    canCancel: boolean = false;
    availableActions: string[] = [];
}

export class WfActionRequest {
    comment: string = '';
    targetStepCode: string = '';
    delegateTo: string = '';
    formData: string = '';
}

export class WfSubmitRequest {
    processDefinitionId: string = '';
    title: string = '';
    priority: string = 'NORMAL';
    dueDate?: string = '';
    formData: string = '';
    notes: string = '';
    saveDraft: boolean = false;
}
