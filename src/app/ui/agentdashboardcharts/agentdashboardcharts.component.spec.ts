import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentdashboardchartsComponent } from './agentdashboardcharts.component';

describe('AgentdashboardchartsComponent', () => {
  let component: AgentdashboardchartsComponent;
  let fixture: ComponentFixture<AgentdashboardchartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentdashboardchartsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentdashboardchartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
