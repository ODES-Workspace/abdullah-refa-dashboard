import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminaprovalsComponent } from './adminaprovals.component';

describe('AdminaprovalsComponent', () => {
  let component: AdminaprovalsComponent;
  let fixture: ComponentFixture<AdminaprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminaprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminaprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
