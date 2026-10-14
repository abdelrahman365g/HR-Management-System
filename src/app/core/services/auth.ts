import { Injectable, computed, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { AppUser } from '../interfaces/app-user.interface';
import { PermissionAction, PermissionGroup, ScreenKey } from '../interfaces/permission.interface';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  readonly currentUser = signal<AppUser | null>(null);
  readonly currentGroup = signal<PermissionGroup | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isHrAdmin = computed(() => this.currentUser()?.is_hr_admin ?? false);

  readonly whenReady: Promise<void>;

  constructor() {
    this.whenReady = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (data.session?.user) {
      await this.loadProfile(data.session.user.id);
    }
    this.isLoading.set(false);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data: user, error } = await this.supabase.client
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('No app_users profile found for this account:', error);
      this.currentUser.set(null);
      this.currentGroup.set(null);
      return;
    }
    this.currentUser.set(user as AppUser);

    if (user.permission_group_id) {
      const { data: group } = await this.supabase.client
        .from('permission_groups')
        .select('*')
        .eq('id', user.permission_group_id)
        .single();
      this.currentGroup.set((group as PermissionGroup) ?? null);
    } else {
      this.currentGroup.set(null);
    }
  }

  async login(identifier: string, password: string): Promise<{ error: string | null }> {
    let email = identifier.trim();

    if (!email || !password) {
      return { error: 'Please enter a valid username and a valid password' };
    }

    if (!email.includes('@')) {
      const { data, error } = await this.supabase.client.rpc('get_login_email', {
        p_identifier: email,
      });

      if (error || !data) {
        return { error: 'Please enter a valid username and a valid password' };
      }

      email = data;
    }

    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: 'Please enter a valid username and a valid password' };
    }

    await this.loadProfile(data.user.id);

    if (!this.currentUser()) {
      return { error: 'Your account has no matching HR profile. Contact an administrator.' };
    }

    return { error: null };
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUser.set(null);
    this.currentGroup.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(screen: ScreenKey, action: PermissionAction): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.is_hr_admin) return true;
    return !!this.currentGroup()?.permissions?.[screen]?.[action];
  }
}
