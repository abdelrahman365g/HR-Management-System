import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsersService } from '../../services/users-service';
import { PermissionGroupsService } from '../../../permissions/services/permission-group-service';
import { PermissionGroup } from '../../../../core/interfaces/permission.interface';
import {
  TranslatedMessage,
  msg,
} from '../../../../shared/utils/i18n-key.util';

function usernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '') as string;
    if (!value) return null;
    return /^[a-zA-Z0-9_]+$/.test(value) ? null : { invalidUsername: true };
  };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  selector: 'app-users-form',
  styleUrl: './users-form.css',
  templateUrl: './users-form.html',
})
export class UsersForm {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly groupsService = inject(PermissionGroupsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly isEditMode = signal(false);
  readonly userSaved = signal(false);
  readonly groups = signal<PermissionGroup[]>([]);
  readonly existingIsHrAdmin = signal(false);

  private userId: string | null = null;

  readonly form: FormGroup = this.fb.group({
    full_name: ['', [Validators.required]],
    username: ['', [Validators.required, usernameValidator()]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    permission_group_id: ['', [Validators.required]],
    is_active: [true],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam && idParam !== 'new' ? idParam : null;
    this.isEditMode.set(this.userId !== null);

    if (this.isEditMode()) {
      this.form.get('password')?.clearValidators();
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.form.get('password')?.updateValueAndValidity();

    this.groupsService.listGroups().subscribe({
      next: (groups) => this.groups.set(groups),
      error: () => this.errorMessage.set(msg('users.loadGroupsError')),
    });

    if (!this.userId) {
      this.loading.set(false);
      return;
    }

    this.usersService.getUser(this.userId).subscribe({
      next: (user) => {
        this.form.patchValue({
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          permission_group_id: user.permission_group_id ?? '',
          is_active: user.is_active,
        });
        this.existingIsHrAdmin.set(user.is_hr_admin);
        if (user.is_hr_admin) {
          this.form.get('permission_group_id')?.clearValidators();
          this.form.get('permission_group_id')?.updateValueAndValidity();
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('users.loadUserFailed'));
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const { full_name, username, email, password, permission_group_id, is_active } = this.form.value;

    if (this.isEditMode()) {
      this.usersService
        .updateUser(this.userId!, {
          full_name,
          username,
          email,
          permission_group_id: permission_group_id || null,
          is_active,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.userSaved.set(true);
            setTimeout(() => this.router.navigate(['/users']), 800);
          },
          error: (err) => this.handleSaveError(err),
        });
    } else {
      this.usersService
        .createUser({
          full_name,
          username,
          email,
          password,
          permission_group_id: permission_group_id,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.userSaved.set(true);
            setTimeout(() => this.router.navigate(['/users']), 800);
          },
          error: (err) => this.handleSaveError(err),
        });
    }
  }

  private handleSaveError(err: any): void {
    this.saving.set(false);
    if (err?.code === '23505') {
      this.errorMessage.set(msg('users.userExists'));
    } else if (err?.message?.includes('WEAK_PASSWORD')) {
      this.errorMessage.set(msg('users.weakPassword'));
    } else if (err?.message?.includes('INVALID_EMAIL')) {
      this.errorMessage.set(msg('users.invalidEmail'));
    } else {
      this.errorMessage.set(msg(this.isEditMode() ? 'users.updateFailed' : 'users.createFailed'));
    }
  }

  resetForm(): void {
    this.form.reset({
      full_name: '',
      username: '',
      email: '',
      password: '',
      permission_group_id: '',
      is_active: true,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
