import { OutgoingDocumentTranferInputModel } from "../../documents/models/outgoing-document-tranfer-input.class";


export class OutgoingDocumentFilter {
    CurrentPage: number = 1;
    PageSize: number = 20;
    KeyWord: string = '';
    DataFilter: OutgoingDocumentTranferInputModel = new OutgoingDocumentTranferInputModel()

}

export class OutgoingDocumentFilterTDTD {
  CurrentPage: number = 1;
  PageSize: number = 20;
  KeyWord: string = '';
  DataFilter: OutgoingDocumentTranferInputModel = new OutgoingDocumentTranferInputModel()

}

