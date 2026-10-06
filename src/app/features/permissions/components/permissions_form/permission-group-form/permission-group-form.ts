import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PermissionGroupsService } from '../../../services/permission-group-service';
import { PERMISSION_NAV_ITEMS } from '../../../../../core/constants/nav-items.constant';
import { PermissionMap, ScreenKey } from '../../../../../core/interfaces/permission.interface';
import {
  TranslatedMessage,
  msg,
} from '../../../../../shared/utils/i18n-key.util';

function atLeastOnePermissionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const array = control as FormArray;
    const hasAny = array.controls.some((row) => {
      const view = row.get('view')?.value === true;
      const edit = row.get('edit')?.value === true;
      return view || edit;
    });
    return hasAny ? null : { atLeastOnePermission: true };
  };
}

interface PermissionRowValue {
  key: ScreenKey;
  label: string;
  view: boolean;
  edit: boolean;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  selector: 'app-permission-group-form',
  styleUrl: './permission-group-form.css',
  templateUrl: './permission-group-form.html',
})
export class PermissionGroupForm {
  private readonly fb = inject(FormBuilder);
  private readonly groupsService = inject(PermissionGroupsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly isEditMode = signal(false);
  readonly groupSaved = signal(false);

  private groupId: string | null = null;

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    permissions: this.fb.array(
      PERMISSION_NAV_ITEMS.map((item) =>
        this.fb.group({
          key: [item.screen as ScreenKey],
          label: [item.label],
          view: [false],
          edit: [false],
        }),
      ),
      atLeastOnePermissionValidator(),
    ),
  });

  get permissionsArray(): FormArray {
    return this.form.get('permissions') as FormArray;
  }

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.groupId = idParam && idParam !== 'new' ? idParam : null;
    this.isEditMode.set(this.groupId !== null);

    if (!this.groupId) {
      this.loading.set(false);
      return;
    }

    this.groupsService.getGroup(this.groupId).subscribe({
      next: (group) => {
        this.form.get('name')?.setValue(group.name);
        this.prefillPermissions(group.permissions);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('permissions.loadGroupFailed'));
        this.loading.set(false);
      },
    });
  }

  private prefillPermissions(permissions: PermissionMap): void {
    this.permissionsArray.controls.forEach((row) => {
      const key = row.get('key')?.value as ScreenKey;
      const rights = permissions[key];
      if (rights) {
        row.get('view')?.setValue(!!rights.view);
        row.get('edit')?.setValue(!!rights.edit);
      }
    });
  }

  onEditChecked(row: AbstractControl): void {
    if (row.get('edit')?.value === true) {
      row.get('view')?.setValue(true);
    }
  }

  onViewUnchecked(row: AbstractControl): void {
    if (row.get('view')?.value === false) {
      row.get('edit')?.setValue(false);
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const name: string = this.form.value.name;
    const permissions: PermissionMap = {};

    for (const row of this.permissionsArray.value as PermissionRowValue[]) {
      if (row.view || row.edit) {
        permissions[row.key] = { view: row.view, edit: row.edit };
      }
    }

    this.groupsService.saveGroup(this.groupId, name, permissions).subscribe({
      next: () => {
        this.saving.set(false);
        this.groupSaved.set(true);

        if (this.isEditMode()) {
          setTimeout(() => this.router.navigate(['/permission-groups']), 800);
        } else {
          this.resetForm();
          setTimeout(() => {
            this.groupSaved.set(false);
            this.router.navigate(['/permission-groups']);
          }, 3000);
        }
      },
      error: (err) => {
        this.saving.set(false);
        if (err?.message?.includes('PERMISSIONS_REQUIRED')) {
          this.errorMessage.set(msg('permissions.permissionsRequired'));
        } else if (err?.code === '23505') {
          this.errorMessage.set(msg('permissions.nameExists'));
        } else if (err?.code === '23514') {
          this.errorMessage.set(msg('permissions.groupNameRequired'));
        } else {
          this.errorMessage.set(msg('permissions.saveFailed'));
        }
      },
    });
  }

  viewAllPermissions(): void {
    this.permissionsArray.controls.forEach((row) => {
      row.get('view')?.setValue(true);
    });
  }

  editAllPermissions(): void {
    this.permissionsArray.controls.forEach((row) => {
      row.get('edit')?.setValue(true);
      row.get('view')?.setValue(true);
    });
  }

  clearAllPermissions(): void {
    this.permissionsArray.controls.forEach((row) => {
      row.get('view')?.setValue(false);
      row.get('edit')?.setValue(false);
    });
  }

  resetForm(): void {
    this.form.get('name')?.reset('');
    this.permissionsArray.controls.forEach((row) => {
      row.get('view')?.setValue(false);
      row.get('edit')?.setValue(false);
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
