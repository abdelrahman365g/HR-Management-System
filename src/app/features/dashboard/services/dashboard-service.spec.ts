import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard-service';
import { Supabase } from '../../../core/services/supabase';

describe('DashboardService', () => {
  let service: DashboardService;
  let rpcSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpcSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Supabase, useValue: { client: { rpc: rpcSpy } } }],
    });
    service = TestBed.inject(DashboardService);
  });

  it('returns the rpc payload', async () => {
    const payload = { today: '2026-10-01', is_holiday_today: false };
    rpcSpy.mockReturnValue(Promise.resolve({ data: payload, error: null }));

    const result = await firstValueFrom(service.getStats());
    expect(result).toEqual(payload);
    expect(rpcSpy).toHaveBeenCalledWith('get_dashboard_stats');
  });

  it('throws when the rpc errors', async () => {
    rpcSpy.mockReturnValue(Promise.resolve({ data: null, error: { message: 'boom' } }));
    await expect(firstValueFrom(service.getStats())).rejects.toBeTruthy();
  });
});
