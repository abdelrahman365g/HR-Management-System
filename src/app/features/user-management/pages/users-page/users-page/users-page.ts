import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { UsersService } from '../../../services/users-service';
import { PermissionGroupsService } from '../../../../permissions/services/permission-group-service';
import { AppUser } from '../../../../../core/interfaces/app-user.interface';
import { PermissionGroup } from '../../../../../core/interfaces/permission.interface';
import { AuthService } from '../../../../../core/services/auth';
import { ConfirmService } from '../../../../../core/services/confirm';
import {
  TranslatedMessage,
  msg,
} from '../../../../../shared/utils/i18n-key.util';

@Component({
  selector: 'app-users-page',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './users-page.html',
})
export class UsersPage {
  private readonly usersService = inject(UsersService);
  private readonly groupsService = inject(PermissionGroupsService);
  private readonly authService = inject(AuthService);
  private readonly confirm = inject(ConfirmService);

  readonly users = signal<AppUser[]>([]);
  readonly groupNamesById = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly errorMessage = signal<TranslatedMessage | null>(null);

  // Drive both the fetch and the template off the same two checks, so a
  // user without 'view' never even triggers the app_users query — RLS
  // alone doesn't block this read (see app_users_select policy), so the
  // guard has to happen here in the app layer.
  readonly canView = signal(this.authService.hasPermission('users', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('users', 'edit'));

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }

    this.loadUsers();
    this.groupsService.listGroups().subscribe({
      next: (groups: PermissionGroup[]) => {
        this.groupNamesById.set(Object.fromEntries(groups.map((g) => [g.id, g.name])));
      },
      error: () => {
        // Non-fatal: the table still renders, just without group names.
        this.errorMessage.set(msg('users.loadGroupsFailed'));
      },
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.usersService.loadUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('users.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  groupName(user: AppUser): string {
    if (user.is_hr_admin) return 'HR Admin (root)';
    if (!user.permission_group_id) return '—';
    return this.groupNamesById()[user.permission_group_id] ?? '—';
  }

  async onDelete(user: AppUser): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: user.full_name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.usersService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.errorMessage.set(this.describeDeleteError(err)),
    });
  }

  private describeDeleteError(err: any): TranslatedMessage {
    switch (err?.message) {
      case 'CANNOT_DELETE_SELF':
        return msg('users.cannotDeleteSelf');
      case 'CANNOT_DELETE_LAST_ADMIN':
        return msg('users.cannotDeleteLastAdmin');
      case 'USER_NOT_FOUND':
        return msg('users.userNotFound');
      case 'FORBIDDEN':
        return msg('users.deleteForbidden');
      default:
        return msg('users.deleteFailed');
    }
  }
}
