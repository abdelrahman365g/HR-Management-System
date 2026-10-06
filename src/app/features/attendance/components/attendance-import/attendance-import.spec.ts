import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AttendanceImport } from './attendance-import';
import { provideTranslateTesting } from '../../../../../testing/translate-testing';

describe('AttendanceImport', () => {
  let component: AttendanceImport;
  let fixture: ComponentFixture<AttendanceImport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceImport],
      providers: [provideTranslateTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceImport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
