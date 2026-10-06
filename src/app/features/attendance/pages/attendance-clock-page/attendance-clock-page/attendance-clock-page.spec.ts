import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AttendanceClockPage } from './attendance-clock-page';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('AttendanceClockPage', () => {
  let component: AttendanceClockPage;
  let fixture: ComponentFixture<AttendanceClockPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceClockPage],
      providers: [provideTranslateTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceClockPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
