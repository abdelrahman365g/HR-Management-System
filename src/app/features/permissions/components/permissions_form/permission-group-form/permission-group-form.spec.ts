import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionGroupForm } from './permission-group-form';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('PermissionGroupForm', () => {
  let component: PermissionGroupForm;
  let fixture: ComponentFixture<PermissionGroupForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionGroupForm],
      providers: [provideTranslateTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionGroupForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
