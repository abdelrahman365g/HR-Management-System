import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionGroupsList } from './groups-list';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('PermissionGroupsList', () => {
  let component: PermissionGroupsList;
  let fixture: ComponentFixture<PermissionGroupsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionGroupsList],
      providers: [provideTranslateTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionGroupsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
