import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListofrejectionsComponent } from './listofrejections.component';

describe('ListofrejectionsComponent', () => {
  let component: ListofrejectionsComponent;
  let fixture: ComponentFixture<ListofrejectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListofrejectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListofrejectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
