import { Component  } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { SharedModules } from '../../ng-zorro.module';

@Component({
  selector: 'app-not-found',
  imports: [SharedModules, NzResultModule],
  standalone: true,
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound {
  constructor(private router: Router) { }

  backToHome(): void {
    this.router.navigate(['/']);
  }
}
