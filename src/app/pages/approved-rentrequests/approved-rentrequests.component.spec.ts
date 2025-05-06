import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedRentrequestsComponent } from './approved-rentrequests.component';

describe('ApprovedRentrequestsComponent', () => {
  let component: ApprovedRentrequestsComponent;
  let fixture: ComponentFixture<ApprovedRentrequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovedRentrequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovedRentrequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
