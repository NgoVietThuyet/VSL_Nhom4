import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http'
import { Observable, throwError, BehaviorSubject } from 'rxjs'
import {
    catchError,
    map,
    finalize,
    switchMap,
    filter,
    take,
} from 'rxjs/operators'
import { Router } from '@angular/router'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzMessageService } from 'ng-zorro-antd/message'
import { EnvironmentService, LoadingService, TokenService } from '../../core'
import { LocalStorageUtils } from '../utils'

@Injectable({
    providedIn: 'root',
})
export class CommonService {
    private refreshTokenInProgress = false
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
        null,
    )

    constructor(
        private http: HttpClient,
        private router: Router,
        private notification: NzNotificationService,
        private _loading: LoadingService,
        private env: EnvironmentService,
        private message: NzMessageService,
        private tokenService: TokenService,
    ) {
    }

    private buildParams(params?: any): HttpParams {
        let httpParams = new HttpParams()
        if (!params) return httpParams

        const flattenParams = (obj: any, parentKey: string = ''): void => {
            Object.keys(obj).forEach((key) => {
                const fullKey = parentKey ? `${parentKey}.${key}` : key
                const value = obj[key]

                if (value !== null && value !== undefined) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        flattenParams(value, fullKey)
                    } else if (Array.isArray(value)) {
                        value.forEach((item) => {
                            httpParams = httpParams.append(fullKey, item)
                        })
                    } else {
                        httpParams = httpParams.append(fullKey, value)
                    }
                }
            })
        }

        flattenParams(params)
        return httpParams
    }

    private handleGetResponse = (response: any) => {
        if (response?.status === false) {
            this.showError(response);
            const err: any = new Error(response?.messageObject?.message || 'Lỗi từ server');
            err.alreadyHandled = true;
            throw err;
        }
        return response?.data;
    }

    private handleResponse(response: any, notifySuccess = true) {
        if (response?.status === true && response?.messageObject?.message) {
            if (notifySuccess) this.showSuccess(response)
        } else if (response?.status === false) {
            this.showError(response)
            const err: any = new Error(response?.messageObject?.message || 'Lỗi từ server');
            err.alreadyHandled = true;
            throw err;
        }
        return response
    }

    private resolveUrl(endpoint: string): string {
        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }
        const base = this.env.getEnv('baseUrl') || '';
        return `${base}/${endpoint}`;
    }

    get<T>(
        endpoint: string,
        params?: any,
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http
            .get<any>(this.resolveUrl(endpoint), { params: this.buildParams(params) })
            .pipe(
                map(this.handleGetResponse),
                catchError((error) => this.handleError(error, () => this.get<T>(endpoint, params, showLoading))),
                finalize(() => {
                    if (showLoading) {
                        this._loading.setLoading(false);
                    }
                })
            );
    }


    post<T>(
        endpoint: string,
        data: any,
        showLoading: boolean = true,
        notifySuccess: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.post<any>(this.resolveUrl(endpoint), data).pipe(
            map((response) => this.handleResponse(response, notifySuccess)),
            catchError((error) => this.handleError(error, () => this.post<T>(endpoint, data, showLoading, notifySuccess))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }


    put<T>(
        endpoint: string,
        data: any,
        showLoading: boolean = true,
        notifySuccess: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.put<any>(this.resolveUrl(endpoint), data).pipe(
            map((response) => this.handleResponse(response, notifySuccess)),
            catchError((error) => this.handleError(error, () => this.put<T>(endpoint, data, showLoading, notifySuccess))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }



    delete<T>(
        endpoint: string,
        data: any = {},
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.delete<any>(this.resolveUrl(endpoint), { body: data }).pipe(
            map((response) => this.handleResponse(response)),
            catchError((error) => this.handleError(error, () => this.delete<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }

    deletes<T>(
        endpoint: string,
        data: string | number[],
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.request<any>('delete', this.resolveUrl(endpoint), { body: data }).pipe(
            map((response) => this.handleResponse(response)),
            catchError((error) => this.handleError(error, () => this.deletes<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }


    uploadFile(
        endpoint: string,
        file: File,
        paramsUrl?: any,
        params?: any,
        showLoading: boolean = true,
    ): Observable<any> {
        const formData = new FormData()
        formData.append('file', file, file.name)

        if (params) {
            Object.keys(params).forEach(key => formData.append(key, params[key]))
        }

        if (showLoading) {
            this._loading.setLoading(true);
        }
        return this.http.post<any>(this.resolveUrl(endpoint), formData, {
            params: this.buildParams(paramsUrl)
        }).pipe(
            map((response) => this.handleResponse(response)),
            catchError((error) => this.handleError(error, () => this.uploadFile(endpoint, file, paramsUrl, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        )
    }

    uploadFiles(
        endpoint: string,
        files: File[],
        paramsUrl?: any,
        params?: any,
        showLoading: boolean = true,
        notifySuccess: boolean = true,
    ): Observable<any> {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file, file.name))

        if (params) {
            Object.keys(params).forEach(key => formData.append(key, params[key]))
        }

        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.post<any>(this.resolveUrl(endpoint), formData, {
            params: this.buildParams(paramsUrl)
        }).pipe(
            map((response) => this.handleResponse(response, notifySuccess)),
            catchError((error) => this.handleError(error, () => this.uploadFiles(endpoint, files, paramsUrl, params, showLoading, notifySuccess))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        )
    }

    downloadFile(endpoint: string, params?: any, showLoading: boolean = true): Observable<HttpResponse<Blob>> {
        if (showLoading) {
            this._loading.setLoading(true);
        }
        return this.http.get(this.resolveUrl(endpoint), {
            params: this.buildParams(params),
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            catchError((error) => this.handleError(error, () => this.downloadFile(endpoint, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }

    downloadFilePost(endpoint: string, body: any, params?: any, showLoading: boolean = true): Observable<HttpResponse<Blob>> {
        if (showLoading) {
            this._loading.setLoading(true);
        }
        return this.http.post(this.resolveUrl(endpoint), body, {
            params: this.buildParams(params),
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            catchError((error) => this.handleError(error, () => this.downloadFilePost(endpoint, body, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false); 
                }
            })
        );
    }


    showSuccess(message: any): void {
        if (message?.messageObject?.message) {
            this.message.success(message.messageObject.message)
        }
    }

    showError(message: any): void {
        if (!message) return;
        let title = 'Lỗi';
        let description = '';

        if (message?.messageObject?.message) {
            const { code, message: msg, messageDetail, logId } = message.messageObject;
            title = `${code ? `[${code}] ` : ''}${msg}`;
            description = logId ? `${messageDetail || ''}<br>LogID: ${logId}` : (messageDetail || '');
        } else if (typeof message === 'string') {
            description = message;
        } else {
            return;
        }

        this.notification.create('error', title, description, {
            nzDuration: 10000,
            nzPlacement: 'topLeft',
            nzStyle: { whiteSpace: 'pre-line' },
            nzClass: 'custom-notification'
        });
    }

    private handleError = (
        error: HttpErrorResponse,
        retryCallback: () => Observable<any>,
    ): Observable<any> => {
        this._loading.reset();
        if (error?.status === 503) {
            this.router.navigate(['maintain-server'])
        }
        if (error?.status === 0) {
            this.router.navigate(['error-server'])
        }
        if (error?.status === 429) {
            this._loading.setLoading(false);
            const url = (error.url || '').toLowerCase();
            if (url.includes('/auth/refreshtoken')) {
                return throwError(() => error);
            }
            this.showError('Quá nhiều yêu cầu. Vui lòng đợi khoảng 1 phút rồi thử lại.');
            return throwError(() => error);
        }

        if (error?.status === 401) {
            if (!this.refreshTokenInProgress) {
                this.refreshTokenInProgress = true
                this.refreshTokenSubject.next(null)

                return this.tokenService.refreshSession().pipe(
                    switchMap((ok) => {
                        this.refreshTokenInProgress = false
                        this.refreshTokenSubject.next(ok)
                        if (!ok) {
                            this.clearAuthAndRedirect()
                            return throwError(() => new Error('Session expired'))
                        }
                        return retryCallback()
                    }),
                    catchError(() => {
                        this.refreshTokenInProgress = false
                        this.clearAuthAndRedirect()
                        return throwError(() => new Error('Session expired'))
                    }),
                )
            }
            return this.refreshTokenSubject.pipe(
                filter(result => result !== null),
                take(1),
                switchMap(() => retryCallback()),
            )
        }

        if ((error as any)?.alreadyHandled) {
            this._loading.setLoading(false);
            return throwError(() => error);
        }

        if (error.error?.messageObject) {
            this.showError(error.error);
        } else {
            this.showError(typeof error.message === 'string' ? error.message : 'Đã xảy ra lỗi không xác định');
        }

        this._loading.setLoading(false);
        return throwError(() => error);
    }

    private clearAuthAndRedirect(): void {
        const returnUrl = this.router.url;
        this.refreshTokenInProgress = false
        this.refreshTokenSubject.next(null)
        this.tokenService.clear()
        LocalStorageUtils.clear()

        if (returnUrl && returnUrl !== '/login') {
            this.router.navigate(['/login'], { queryParams: { returnUrl } })
            return
        }

        this.router.navigate(['/login'])
    }
}
