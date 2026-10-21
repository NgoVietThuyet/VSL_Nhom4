import { Injectable } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonService } from '../../../shared/services';

export interface DcOption {
  value: string;
  label: string;
}

/**
 * Tải master-data dùng chung cho form Điều hành Văn bản.
 * Tái sử dụng các endpoint MD có sẵn của project-core (Code/Name).
 * Cache theo phiên bằng shareReplay để tránh gọi lại nhiều lần.
 */
@Injectable({ providedIn: 'root' })
export class DcMasterDataService {
  private cache: Record<string, Observable<DcOption[]>> = {};

  constructor(private common: CommonService) {}

  documentTypes(): Observable<DcOption[]> { return this.load('DocumentType/GetAll', 'docType'); }
  fields(): Observable<DcOption[]> { return this.load('DocumentField/GetAll', 'field'); }
  urgencies(): Observable<DcOption[]> { return this.load('DocumentUrgency/GetAll', 'urgency'); }
  securities(): Observable<DcOption[]> { return this.load('DocumentSecurity/GetAll', 'security'); }
  issuingOrgs(): Observable<DcOption[]> { return this.load('IssuingOrg/GetAll', 'issuingOrg'); }
  organizes(): Observable<DcOption[]> { return this.load('Organize/GetAll', 'organize'); }
  accounts(): Observable<DcOption[]> { return this.load('Account/GetAll', 'account', 'userName', 'fullName'); }

  /** Sổ văn bản — bookType: INCOMING | OUTGOING */
  documentBooks(bookType: string, year?: number): Observable<DcOption[]> {
    const y = year ?? new Date().getFullYear();
    const key = `book_${bookType}_${y}`;
    if (!this.cache[key]) {
      this.cache[key] = this.common.get<any>('DocumentBook/GetAll', { bookTypeCode: bookType, year: y }, false).pipe(
        map((rows: any[]) => {
          if (!Array.isArray(rows)) return [];
          return rows.map(r => ({
            value: r.id ?? r.Id ?? '',
            label: [r.name ?? r.Name, r.code ?? r.Code].filter(Boolean).join(' — '),
          }));
        }),
        shareReplay(1),
      );
    }
    return this.cache[key] ?? of([]);
  }

  clear(): void { this.cache = {}; }

  private load(endpoint: string, key: string, valueKey = 'code', labelKey = 'name'): Observable<DcOption[]> {
    if (!this.cache[key]) {
      this.cache[key] = this.common.get<any>(endpoint, {}, false).pipe(
        map((rows: any[]) => this.toOptions(rows, valueKey, labelKey)),
        shareReplay(1),
      );
    }
    return this.cache[key] ?? of([]);
  }

  private toOptions(rows: any[], valueKey: string, labelKey: string): DcOption[] {
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      value: r[valueKey] ?? r.code ?? r.id ?? r.userName ?? '',
      label: r[labelKey] ?? r.name ?? r.fullName ?? r.userName ?? '',
    }));
  }
}
