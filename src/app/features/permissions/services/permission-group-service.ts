import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { PermissionGroup, PermissionMap } from '../../../core/interfaces/permission.interface';

@Injectable({ providedIn: 'root' })
export class PermissionGroupsService {
  private readonly supabase = inject(Supabase);

  listGroups(): Observable<PermissionGroup[]> {
    return from(
      this.supabase.client
        .from('permission_groups')
        .select('id, name, permissions, created_by, created_at, updated_at')
        .order('name'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as PermissionGroup[];
      }),
    );
  }

  getGroup(groupId: string): Observable<PermissionGroup> {
    return from(
      this.supabase.client
        .from('permission_groups')
        .select('id, name, permissions, created_by, created_at, updated_at')
        .eq('id', groupId)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as PermissionGroup;
      }),
    );
  }
  saveGroup(groupId: string | null, name: string, permissions: PermissionMap): Observable<string> {
    const payload = { name, permissions };

    const query = groupId
      ? this.supabase.client.from('permission_groups').update(payload).eq('id', groupId).select('id').single()
      : this.supabase.client.from('permission_groups').insert(payload).select('id').single();

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as { id: string }).id;
      }),
    );
  }

  deleteGroup(groupId: string): Observable<void> {
    return from(this.supabase.client.rpc('delete_permission_group', { p_group_id: groupId })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}