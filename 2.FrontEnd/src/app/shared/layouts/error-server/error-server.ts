import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { SharedModules } from '../../ng-zorro.module';

@Component({
  selector: 'app-error-server',
  imports: [SharedModules, NzResultModule],
  standalone: true,
  templateUrl: './error-server.html',
  styleUrl: './error-server.scss'
})
export class ErrorServer {
  constructor(private router: Router) { }

  backToHome(): void {
    this.router.navigate(['/']);
  }
}
