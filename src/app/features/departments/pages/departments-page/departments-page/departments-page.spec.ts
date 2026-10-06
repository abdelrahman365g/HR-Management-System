import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentsPage } from './departments-page';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('DepartmentsPage', () => {
  let component: DepartmentsPage;
  let fixture: ComponentFixture<DepartmentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideTranslateTesting()],
      imports: [DepartmentsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
