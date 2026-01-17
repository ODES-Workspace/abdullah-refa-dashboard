import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListofpendingComponent } from './listofpending.component';

describe('ListofpendingComponent', () => {
  let component: ListofpendingComponent;
  let fixture: ComponentFixture<ListofpendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListofpendingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListofpendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

