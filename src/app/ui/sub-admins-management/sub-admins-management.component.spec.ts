import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubAdminsManagementComponent } from './sub-admins-management.component';

describe('SubAdminsManagementComponent', () => {
  let component: SubAdminsManagementComponent;
  let fixture: ComponentFixture<SubAdminsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubAdminsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubAdminsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
