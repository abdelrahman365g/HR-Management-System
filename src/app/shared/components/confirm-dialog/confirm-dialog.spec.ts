import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';
import { ConfirmService } from '../../../core/services/confirm';
import { provideTranslateTesting } from '../../../../testing/translate-testing';
import { installDialogStub } from '../../../../testing/confirm-dialog-testing';

describe('ConfirmDialog + ConfirmService', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;
  let confirmService: ConfirmService;

  beforeEach(async () => {
    installDialogStub();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
  });

  function flush(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('resolves true when confirmed', async () => {
    fixture.detectChanges();
    const promise = confirmService.ask({ titleKey: 'confirm.deleteTitle', variant: 'danger' });
    await flush();
    fixture.detectChanges();

    confirmService.confirm();
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when cancelled', async () => {
    fixture.detectChanges();
    const promise = confirmService.ask({ titleKey: 'confirm.deleteTitle', variant: 'danger' });
    await flush();
    fixture.detectChanges();

    confirmService.cancel();
    await expect(promise).resolves.toBe(false);
  });

  it('only allows one dialog at a time: the first resolves false', async () => {
    fixture.detectChanges();
    const first = confirmService.ask({ titleKey: 'a' });
    const second = confirmService.ask({ titleKey: 'b' });

    confirmService.confirm();
    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
  });

  it('renders title, message and danger variant styling', async () => {
    fixture.detectChanges();
    const promise = confirmService.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      variant: 'danger',
    });
    await flush();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#confirm-title')).toBeTruthy();
    expect(el.querySelector('#confirm-message')).toBeTruthy();
    expect(el.querySelector('.btn-danger')).toBeTruthy();

    confirmService.cancel();
    await promise;
  });

  it('uses info variant styling for info asks', async () => {
    fixture.detectChanges();
    const promise = confirmService.ask({ titleKey: 'a', variant: 'info' });
    await flush();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.btn-primary')).toBeTruthy();

    confirmService.cancel();
    await promise;
  });

  it('scrim click cancels', async () => {
    fixture.detectChanges();
    const promise = confirmService.ask({ titleKey: 'a', variant: 'info' });
    await flush();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('dialog');
    const click = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(click, 'target', { value: dialog });
    dialog.dispatchEvent(click);

    await expect(promise).resolves.toBe(false);
  });
});
