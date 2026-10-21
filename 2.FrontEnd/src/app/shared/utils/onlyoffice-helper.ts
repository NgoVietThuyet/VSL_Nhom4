import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { EnvironmentService, TokenService } from '../../core';
import { CommonService } from '../services/common.service';

export type OnlyOfficeFileScope = 'Explorer' | 'Archive' | 'File';

function ticketEndpoint(scope: OnlyOfficeFileScope, fileId: string): string {
  return scope === 'File'
    ? `File/DownloadTicket/${fileId}`
    : `${scope}/DownloadTicket/${fileId}`;
}

/**
 * Lấy ticket qua CommonService (tự refresh JWT khi 401) — giống các API Explorer khác.
 */
export function requestOnlyOfficeDownloadTicket(
  common: CommonService,
  tokenService: TokenService,
  fileId: string,
  scope: OnlyOfficeFileScope = 'Explorer',
): Observable<string | null> {
  const endpoint = ticketEndpoint(scope, fileId);

  const fetch$ = common.get<{ ticket?: string }>(endpoint, {}, false).pipe(
    map((data) => data?.ticket ?? null),
    catchError(() => of(null)),
  );

  if (tokenService.hasValidAccessToken()) {
    return fetch$;
  }

  return tokenService.ensureSession().pipe(
    switchMap((ok) => (ok ? fetch$ : of(null))),
    catchError(() => of(null)),
  );
}

/** Ticket qua mã link chia sẻ (AllowAnonymous). */
export function requestShareOnlyOfficeDownloadTicket(
  http: HttpClient,
  env: EnvironmentService,
  shareCode: string,
): Observable<string | null> {
  const base = env.getEnv('baseUrl');
  return http
    .get<{ status?: boolean; data?: { ticket?: string } }>(
      `${base}/Explorer/ShareDownloadTicket/${encodeURIComponent(shareCode)}`,
    )
    .pipe(map((res) => (res?.status !== false ? res?.data?.ticket ?? null : null)));
}

export function buildOnlyOfficeDocumentUrl(
  env: EnvironmentService,
  fileId: string,
  ticket: string,
  scope: OnlyOfficeFileScope = 'Explorer',
): string {
  const base = env.getEnv('baseUrl');
  if (scope === 'File') {
    return `${base}/File/Download/${fileId}?dl=${encodeURIComponent(ticket)}`;
  }
  return `${base}/${scope}/OnlyOfficeDownload/${fileId}?dl=${encodeURIComponent(ticket)}`;
}
