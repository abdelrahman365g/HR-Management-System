import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AttendanceForm } from './attendance-form';
import { provideTranslateTesting } from '../../../../../testing/translate-testing';

describe('AttendanceForm', () => {
  let component: AttendanceForm;
  let fixture: ComponentFixture<AttendanceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceForm],
      providers: [provideTranslateTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
