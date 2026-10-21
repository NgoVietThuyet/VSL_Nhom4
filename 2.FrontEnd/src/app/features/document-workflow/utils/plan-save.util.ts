import { DcPlanSelection, DocumentTreePlanNode } from '../models/document-tree-plan.model';

export interface DocumentPlanSaveItem {
  recipientType: 'USER' | 'ORG';
  recipientId: string;
  isXuLyChinh: boolean;
  isPhoiHop: boolean;
  isNhanDeBiet: boolean;
  isChuTri: boolean;
  isYKien: boolean;
  notes?: string;
}

export function planSelectionToSaveItems(sel: DcPlanSelection | null): DocumentPlanSaveItem[] {
  if (!sel?.planPreview?.length) return [];
  return sel.planPreview
    .filter((n: DocumentTreePlanNode) => !n.isNotCreatePlan)
    .filter((n: DocumentTreePlanNode) => n.isXuLyChinh || n.isPhoiHop || n.isNhanDeBiet || n.isChuTri)
    .map((n: DocumentTreePlanNode) => ({
      recipientType: (n.type === 'ORG' ? 'ORG' : 'USER') as 'USER' | 'ORG',
      recipientId: n.id,
      isXuLyChinh: !!n.isXuLyChinh,
      isPhoiHop: !!n.isPhoiHop,
      isNhanDeBiet: !!n.isNhanDeBiet,
      isChuTri: !!n.isChuTri,
      isYKien: false,
      notes: n.name,
    }));
}
