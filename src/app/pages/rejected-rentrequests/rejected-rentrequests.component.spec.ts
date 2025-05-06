import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedRentrequestsComponent } from './rejected-rentrequests.component';

describe('RejectedRentrequestsComponent', () => {
  let component: RejectedRentrequestsComponent;
  let fixture: ComponentFixture<RejectedRentrequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectedRentrequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectedRentrequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
