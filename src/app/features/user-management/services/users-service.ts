import { Injectable, inject } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { AppUser } from '../../../core/interfaces/app-user.interface';

export interface CreateUserInput {
  full_name: string;
  username: string;
  email: string;
  password: string;
  permission_group_id: string | null;
}

export interface UpdateUserInput {
  full_name: string;
  username: string;
  email: string;
  permission_group_id: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly supabase = inject(Supabase);

  loadUsers(): Observable<AppUser[]> {
    return from(this.supabase.client.from('app_users').select('*').order('full_name')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AppUser[];
      }),
    );
  }

  getUser(userId: string): Observable<AppUser> {
    return from(this.supabase.client.from('app_users').select('*').eq('id', userId).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as AppUser;
      }),
    );
  }

  createUser(input: CreateUserInput): Observable<AppUser> {
    return from(this.supabase.client.functions.invoke('create-user', { body: input })).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw await toFunctionError(error);
        return (data as { user: AppUser }).user;
      }),
    );
  }

  updateUser(userId: string, user: UpdateUserInput): Observable<void> {
    return from(this.supabase.client.from('app_users').update(user).eq('id', userId)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  deleteUser(userId: string): Observable<void> {
    return from(
      this.supabase.client.functions.invoke('delete-user', { body: { user_id: userId } }),
    ).pipe(
      switchMap(async ({ error }) => {
        if (error) throw await toFunctionError(error);
      }),
    );
  }
}

async function toFunctionError(error: unknown): Promise<Error> {
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const body = await context.json();
      if (typeof body?.error === 'string') {
        return new Error(body.error);
      }
    } catch {
      // fall through — surface the generic error below
    }
  }
  return error instanceof Error ? error : new Error('UNKNOWN_ERROR');
}