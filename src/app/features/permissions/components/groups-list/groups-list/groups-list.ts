import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PermissionGroupsService } from '../../../services/permission-group-service';
import { PermissionGroup, ScreenKey } from '../../../../../core/interfaces/permission.interface';
import { PERMISSION_NAV_ITEMS } from '../../../../../core/constants/nav-items.constant';
import { ConfirmService } from '../../../../../core/services/confirm';
import { TranslatedMessage, msg } from '../../../../../shared/utils/i18n-key.util';
import { AuthService } from '../../../../../core/services/auth';

interface PermissionBadge {
  labelKey: string;
  view: boolean;
  edit: boolean;
}

const SCREEN_LABEL_KEYS: Partial<Record<ScreenKey, string>> = Object.fromEntries(
  PERMISSION_NAV_ITEMS.map((item) => [item.screen, item.label]),
);

@Component({
  selector: 'app-permission-groups-list',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './groups-list.html',
})
export class PermissionGroupsList {
  private readonly authService = inject(AuthService);
  private readonly groupsService = inject(PermissionGroupsService);
  private readonly confirm = inject(ConfirmService);

  readonly groups = signal<PermissionGroup[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<TranslatedMessage | null>(null);

  readonly canView = signal(this.authService.hasPermission('permission_groups', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('permission_groups', 'edit'));

  constructor() {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.groupsService.listGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('permissions.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  permissionBadges(group: PermissionGroup): PermissionBadge[] {
    return Object.entries(group.permissions)
      .filter(([, rights]) => rights?.view || rights?.edit)
      .map(([key, rights]) => ({
        labelKey: SCREEN_LABEL_KEYS[key as ScreenKey] ?? (key as string),
        view: !!rights?.view,
        edit: !!rights?.edit,
      }));
  }

  async onDelete(group: PermissionGroup): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: group.name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.groupsService.deleteGroup(group.id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => {
        if (err?.message?.includes('GROUP_HAS_USERS')) {
          this.errorMessage.set(msg('permissions.deleteHasUsers', { name: group.name }));
        } else {
          this.errorMessage.set(msg('permissions.deleteFailed', { name: group.name }));
        }
      },
    });
  }
}
