import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MainLayoutService } from './main-layout.service';

@Injectable({ providedIn: 'root' })
export class SharedService {
    private lstCountType = new ReplaySubject<any>(1);
    lstCountType$ = this.lstCountType.asObservable();

    constructor(private mainLayoutService: MainLayoutService) {}

    setLstCountType(value: any) {
        if (value !== undefined && value !== null) {
            this.lstCountType.next(value);
        }
    }

    refreshLstCountType(): void {
        this.mainLayoutService.getCountAll()
            .pipe(take(1))
            .subscribe((res) => this.setLstCountType(res));
    }

    reset() {
        this.lstCountType = new ReplaySubject<any>(1);
        this.lstCountType$ = this.lstCountType.asObservable();
    }

    public savedState: any = null;
}
