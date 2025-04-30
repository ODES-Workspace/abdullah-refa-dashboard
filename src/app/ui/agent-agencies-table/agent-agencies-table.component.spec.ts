import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentAgenciesTableComponent } from './agent-agencies-table.component';

describe('AgentAgenciesTableComponent', () => {
  let component: AgentAgenciesTableComponent;
  let fixture: ComponentFixture<AgentAgenciesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentAgenciesTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentAgenciesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
