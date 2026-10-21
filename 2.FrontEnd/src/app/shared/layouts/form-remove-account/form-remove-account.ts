import { Component } from '@angular/core';
import { SharedModules } from '../../ng-zorro.module';

@Component({
  selector: 'app-form-remove-account',
  imports: [SharedModules],
  templateUrl: './form-remove-account.html',
  styleUrl: './form-remove-account.scss',
})
export class FormRemoveAccount {
  username: string = '';
  password: string = '';
  confirm: boolean = false;
  success: boolean = false;

  submit() {
    if (!this.confirm) {
      alert('Vui lòng xác nhận rằng bạn chắc chắn muốn xoá tài khoản.');
      return;
    }
    this.success = true;
  }
}
