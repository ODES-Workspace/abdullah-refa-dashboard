import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RentrequestsListComponent } from './rentrequests-list.component';

describe('RentrequestsListComponent', () => {
  let component: RentrequestsListComponent;
  let fixture: ComponentFixture<RentrequestsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentrequestsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RentrequestsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
