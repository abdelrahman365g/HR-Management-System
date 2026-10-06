import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeePicker } from './employee-picker';
import { provideTranslateTesting } from '../../../../../testing/translate-testing';

describe('EmployeePicker', () => {
  let component: EmployeePicker;
  let fixture: ComponentFixture<EmployeePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideTranslateTesting()],
      imports: [EmployeePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeePicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
