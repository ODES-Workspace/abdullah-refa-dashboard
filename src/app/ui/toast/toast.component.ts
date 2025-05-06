import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div *ngIf="(toastService.toast$ | async)?.show" class="toast">
      {{ (toastService.toast$ | async)?.message || '' | translate }}
    </div>
  `,
  styles: [
    `
      .toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);

        background-color: #4caf50;
        color: #fff;
        padding: 16px;
        border-radius: 4px;
        z-index: 1000;
      }
    `,
  ],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
