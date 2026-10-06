import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPage } from './users-page';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideTranslateTesting()],
      imports: [UsersPage],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
