import { Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Service()
export class Supabase {
    readonly client : SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
    );
}
