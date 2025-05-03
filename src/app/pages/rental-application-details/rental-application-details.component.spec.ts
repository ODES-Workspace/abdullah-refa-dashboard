import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RentalApplicationDetailsComponent } from './rental-application-details.component';

describe('RentalApplicationDetailsComponent', () => {
  let component: RentalApplicationDetailsComponent;
  let fixture: ComponentFixture<RentalApplicationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalApplicationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RentalApplicationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
