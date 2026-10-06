import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfficialHolidaysPage } from './official-holidays-page';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('OfficialHolidaysPage', () => {
  let component: OfficialHolidaysPage;
  let fixture: ComponentFixture<OfficialHolidaysPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideTranslateTesting()],
      imports: [OfficialHolidaysPage],
    }).compileComponents();

    fixture = TestBed.createComponent(OfficialHolidaysPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
