import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { LogoComponent } from '../../ui/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslateModule, LogoComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  passwordType = 'password';

  constructor(public languageService: LanguageService) {}

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }
}
