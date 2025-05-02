import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListofAgencyOwnerComponent } from './listof-agency-owner.component';

describe('ListofAgencyOwnerComponent', () => {
  let component: ListofAgencyOwnerComponent;
  let fixture: ComponentFixture<ListofAgencyOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListofAgencyOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListofAgencyOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
