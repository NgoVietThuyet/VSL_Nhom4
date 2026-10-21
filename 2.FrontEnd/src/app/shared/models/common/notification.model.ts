export class NotificationDto {
    id: string = '';
    type: string = '';
    title: string = '';
    content: string = '';
    url: string = '';
    senderUserName: string = '';
    senderFullName: string = '';
    receiverUserName: string = '';
    referenceId: string = '';
    isRead: boolean = false;
    readDate: string = '';
    createDate: string = '';
}
