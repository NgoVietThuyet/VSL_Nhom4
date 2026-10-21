import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { SharedModules } from '../../ng-zorro.module';

@Component({
  selector: 'app-un-authen',
  imports: [SharedModules, NzResultModule],
  standalone: true,
  templateUrl: './un-authen.html',
  styleUrl: './un-authen.scss'
})
export class UnAuthen {
constructor(private router: Router) { }

  backToLogin(): void {
    this.router.navigate(['login']);
  }
}
