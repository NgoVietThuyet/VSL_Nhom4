import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { CommonService } from '../../../shared/services'
import { EnvironmentService } from '../../../core'

@Injectable({
    providedIn: 'root',
})
export class MeetingService {
    constructor(
        private common: CommonService, 
        private http: HttpClient, 
        private env: EnvironmentService,
    ) { }

    startQuickMeeting(name: string): Observable<any> {
        return this.common.get(`Meeting/StartQuickMeeting?name=${name}`, {}, false)
    }

    searchMeeting(request: any): Observable<any> {
        return this.common.get(`Meeting/SearchMeetingInfo`, request, false)
    }

    buildTreeOrgAndUser(): Observable<any> {
        return this.common.get(`Meeting/BuildTreeOrgAndUser`, {}, false)
    }

    getInfoMeeting(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetInfoMeeting/${meetingId}`, {}, false)
    }

    getPersonalMeeting(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetPersonalMeeting/${meetingId}`, {}, false)
    }

    getMeetingVote(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetMeetingVote/${meetingId}`, {}, false)
    }

    answerVote(data: any): Observable<any> {
        return this.common.post(`Meeting/AnswerVote`, data, false)
    }

    getListFilesCommon(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetListFilesCommon/${meetingId}`, {}, false)
    }

    createMeeting(data: any): Observable<any> {
        return this.common.post(`Meeting/CreateMeeting`, data, false)
    }
    updateMeeting(data: any): Observable<any> {
        return this.common.post(`Meeting/UpdateMeeting`, data, false)
    }

    getMeetingDetail(id: string): Observable<any> {
            return this.common.get(`Meeting/Detail/${id}`, {}, false);
    }

    startVoting(data: any): Observable<any> {
        return this.common.post(`Meeting/StartVoting`, data, false)
    }

    endVoting(data: any): Observable<any> {
        return this.common.post(`Meeting/EndVoting`, data, false)
    }

    getDetailVote(voteId: any): Observable<any> {
        return this.common.get(`Meeting/GetDetailVote/${voteId}`, {}, false)
    }

    raiseHand(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/RaiseHand`, payload)
    }

    startMeeting(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/StartMeeting`, payload)
    }

    endMeeting(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/EndMeeting`, payload)
    }

    startRecording(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/StartRecording`, payload)
    }

    endRecording(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/EndRecording`, payload)
    }

    updateStatusMeeting(meetingId: string, status: number): Observable<any> {
        return this.common.put(`Meeting/UpdateStatusMeeting?meetingId=${meetingId}&status=${status}`, {}, false)
    }

    intoTheMeeting(meetingId: any): Observable<any> {
        return this.http.get(`${this.env.getEnv('baseUrl')}/Meeting/IntoTheMeeting/${meetingId}`)
    }

    exitTheMeeting(meetingId: any): Observable<any> {
        return this.http.get(`${this.env.getEnv('baseUrl')}/Meeting/ExitTheMeeting/${meetingId}`)
    }

    moveToSharedDocument(meetingId: any, fileId : any): Observable<any> {
        return this.common.get(`File/MoveToSharedDocument?fileId=${fileId}&meetingId=${meetingId}`, {}, false)
    }
    
    sendMessage(message: any): Observable<any> {
        return this.common.post(`Meeting/SendMessage`, message, false)
    }

    saveVoiceToText(data: any): Observable<any> {
        return this.common.post(`Meeting/SaveVoiceToText`, data, false)
    }

    retryVoiceToText(fileId: string): Observable<any> {
        return this.common.get(`File/RetryVoiceToText/${fileId}`);
    }

    getListMessage(request : any): Observable<any> {
        return this.common.post(`Meeting/GetListMessage`, request, false)
    }
    getRoomList(): Observable<any> {
        return this.common.get(`${this.env.getEnv('baseUrl')}/Room/search`, {}, false);
    }

    getRoomDetail(code: string): Observable<any> {
        return this.common.get(`${this.env.getEnv('baseUrl')}/Room/detail/${code}`, {}, false);
    }

    getMeetingLayout(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/${meetingId}/layout`, {}, false);
    }

    createMeetingVote(data: any): Observable<any> {
        return this.common.post(`Meeting/CreateMeetingVote`, data, false);
    }

    kickParticipant(data: any): Observable<any> {
        return this.common.post(`Meeting/KickParticipant`, data, false);
    }

    controlParticipant(data: any): Observable<any> {
        return this.common.post(`Meeting/ControlParticipant`, data, false);
    }

    syncParticipantState(request: any): Observable<any> {
        return this.common.post(`Meeting/SyncParticipantState`, request, false);
    }

    toggleAllMedia(request: any): Observable<any> {
        return this.common.post(`Meeting/ToggleAllMedia`, request, false);
    }

    broadcastTranscription(data: any): Observable<any> {
        return this.common.post(`Meeting/BroadcastTranscription`, data, false);
    }

    deleteMeeting(meetingId: string): Observable<any> {
        return this.common.delete(`Meeting/DeleteMeeting/${meetingId}`, {}, false);
    }

    exportPersonal(meetingId: string): void {
        this.http.get(`${this.env.getEnv('baseUrl')}/Meeting/ExportPersonal/${meetingId}`, {
            observe: 'response',
            responseType: 'blob'
        }).subscribe({
            next: (response: any) => {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const error = JSON.parse(reader.result as string);
                        alert(error.messageObject?.message || 'Không thể tải file!');
                    };
                    reader.readAsText(response.body);
                    return;
                }

                const blob = new Blob([response.body!], { type: contentType || 'application/octet-stream' });
                const contentDisposition = response.headers.get('content-disposition');
                const fileName = this.extractFilename(contentDisposition) || 'downloaded-file';
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(link.href);
            },
            error: () => {
                // Keep silent to avoid global loading behavior in meeting feature.
            }
        });
    }

    saveExcalidraw(data: any): Observable<any> {
    return this.common.post(`File/SaveExcalidraw`, data, false);  
    }

    getExcalidrawList(meetingId: string): Observable<any> {
        return this.common.get(`File/GetExcalidrawList/${meetingId}`, {}, false);  
    }

    exportSummaryMeeting(meetingId: string): Observable<any> {
        return this.common.get(`File/ExportSummaryMeeting/${meetingId}`, {}, false);  
    }

    getExcalidrawDetail(id: string): Observable<any> {
        return this.common.get(`File/GetExcalidrawDetail/${id}`, {}, false);  
    }

    deleteExcalidraw(id: string): Observable<any> {
        return this.common.delete(`File/DeleteExcalidraw/${id}`, {}, false); 
    }

   

    checkParticipant(meetingId: string): Observable<any> {
        return this.http.get(`${this.env.getEnv('baseUrl')}/Meeting/CheckParticipant/${meetingId}`);
    }

    requestJoinApproval(data: { meetingId: string; username: string; message?: string }): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/RequestJoinApproval`, {
            meetingId: data.meetingId,
            username: data.username,
            message: data.message || ''
        });
    }

    approveJoinRequest(data: { meetingId: string; username: string; message?: string }): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/ApproveJoinRequest`, {
            meetingId: data.meetingId,
            username: data.username,
            message: data.message || ''
        });
    }

    rejectJoinRequest(data: { meetingId: string; username: string }): Observable<any> {
        return this.http.post(`${this.env.getEnv('baseUrl')}/Meeting/RejectJoinRequest`, {
            meetingId: data.meetingId,
            username: data.username
        });
    }

    private extractFilename(disposition: string | null): string | null {
        const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        return match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : null;
    }
}
