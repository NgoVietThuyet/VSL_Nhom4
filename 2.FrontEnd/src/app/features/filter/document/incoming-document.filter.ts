import { DocumentIncomingTranferInputModel, DocumentTranferInputModel } from "../../documents/models/document-incoming-tranfer-input.class";

export class IncomingDocumentFilter {
    CurrentPage: number = 1;
    PageSize: number = 50;
    KeyWord: string = '';
    DataFilter: DocumentIncomingTranferInputModel = new DocumentIncomingTranferInputModel()
    constructor(init?: Partial<IncomingDocumentFilter>) {
    Object.assign(this, init);
  }
}

export class DocumentFilter {
  CurrentPage: number = 1;
  PageSize: number = 20;
  KeyWord: string = '';
  isActive: boolean = false;
  sortColumn: string = '';
  isDescending: boolean = false;
  fields: any[] = [];
  DataFilter: DocumentTranferInputModel = new DocumentTranferInputModel()
  constructor(init?: Partial<DocumentFilter>) {
  Object.assign(this, init);
}
}
