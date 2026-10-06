import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();

    if (!email && !password) {
      this.errorMessage.set(this.translate.instant('auth.errorUserAndPassword'));
      return;
    }
    if (!email) {
      this.errorMessage.set(this.translate.instant('auth.errorUsername'));
      return;
    }
    if (!password) {
      this.errorMessage.set(this.translate.instant('auth.errorPassword'));
      return;
    }

    this.submitting.set(true);
    const { error } = await this.auth.login(email, password);
    this.submitting.set(false);

    if (error) {
      this.errorMessage.set(this.translate.instant('auth.errorInvalidCredentials'));
      return;
    }
    void this.router.navigate(['/dashboard']);
  }
}
