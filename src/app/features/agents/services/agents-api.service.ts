import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Agent, AgentState } from '../../../core/models/domain.models';

@Injectable({
  providedIn: 'root'
})
export class AgentsApiService {
  private mockAgents: Agent[] = [
    {
      id: '1',
      name: 'Agent Alpha',
      description: 'Automated data extraction and formatting pipeline.',
      state: 'idle',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      id: '2',
      name: 'Agent Beta',
      description: 'Real-time performance monitoring and anomaly detection.',
      state: 'running',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 600000)
    },
    {
      id: '3',
      name: 'Agent Gamma',
      description: 'Scheduled backup processor and data integrity verifier.',
      state: 'paused',
      createdAt: new Date(Date.now() - 3600000 * 48),
      updatedAt: new Date(Date.now() - 3600000 * 24)
    },
    {
      id: '4',
      name: 'Agent Delta',
      description: 'Failure recovery handler. Encountered network socket timeout.',
      state: 'error',
      createdAt: new Date(Date.now() - 3600000 * 6),
      updatedAt: new Date(Date.now() - 3600000 * 5)
    }
  ];

  // A flag to simulate periodic API errors for demonstration purposes
  private shouldFailNext = false;

  triggerNextCallToFail(): void {
    this.shouldFailNext = true;
  }

  getAgents(): Observable<Agent[]> {
    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      return throwError(() => new Error('Failed to fetch agents: Connection timed out (HTTP 504)')).pipe(
        delay(800)
      );
    }
    // Deep clone to prevent direct mutations of the mock DB
    const list = this.mockAgents.map(a => ({ ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) }));
    return of(list).pipe(delay(800));
  }

  createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Observable<Agent> {
    if (agent.name.toLowerCase() === 'error') {
      return throwError(() => new Error('Database integrity check failed: Agent name "error" is reserved.')).pipe(
        delay(600)
      );
    }

    const newAgent: Agent = {
      ...agent,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockAgents.push(newAgent);
    return of({ ...newAgent }).pipe(delay(600));
  }

  updateAgent(id: string, changes: Partial<Omit<Agent, 'id' | 'createdAt'>>): Observable<Agent> {
    const idx = this.mockAgents.findIndex(a => a.id === id);
    if (idx === -1) {
      return throwError(() => new Error(`Agent not found with ID ${id}`)).pipe(delay(400));
    }
    
    if (changes.name && changes.name.toLowerCase() === 'error') {
      return throwError(() => new Error('Validation failed: Agent name cannot be "error"')).pipe(delay(400));
    }

    this.mockAgents[idx] = {
      ...this.mockAgents[idx],
      ...changes,
      updatedAt: new Date()
    };
    return of({ ...this.mockAgents[idx] }).pipe(delay(500));
  }

  deleteAgent(id: string): Observable<void> {
    const idx = this.mockAgents.findIndex(a => a.id === id);
    if (idx === -1) {
      return throwError(() => new Error(`Agent not found with ID ${id}`)).pipe(delay(400));
    }
    this.mockAgents.splice(idx, 1);
    return of(undefined).pipe(delay(500));
  }
}
