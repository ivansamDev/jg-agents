import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AgentsStateService } from './agents-state.service';
import { AgentState } from '../../../core/models/domain.models';

describe('AgentsStateService', () => {
  let service: AgentsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgentsStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add new agent', fakeAsync(() => {
    const agentData = { name: 'Test Agent', description: 'Test', state: 'idle' as AgentState };
    let successCalled = false;
    service.create(agentData).subscribe(() => {
      successCalled = true;
    });
    
    tick(1000);
    
    const agents = service.agents();
    expect(successCalled).toBeTrue();
    expect(agents.length).toBe(1);
    expect(agents[0].name).toBe('Test Agent');
  }));

  it('should update agent state', fakeAsync(() => {
    const agentData = { name: 'Test Agent', description: 'Test', state: 'idle' as AgentState };
    service.create(agentData).subscribe();
    tick(1000);
    
    const agent = service.agents()[0];
    service.update(agent.id, { state: 'running' }).subscribe();
    tick(1000);
    
    const updated = service.agents()[0];
    expect(updated.state).toBe('running');
  }));

  it('should remove agent', fakeAsync(() => {
    const agentData = { name: 'Test Agent', description: 'Test', state: 'idle' as AgentState };
    service.create(agentData).subscribe();
    tick(1000);
    
    const agent = service.agents()[0];
    service.remove(agent.id).subscribe();
    tick(1000);
    
    expect(service.agents().length).toBe(0);
  }));
});