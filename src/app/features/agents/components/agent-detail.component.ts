import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AgentsStateService } from '../services/agents-state.service';
import { AgentState } from '../../../core/models/domain.models';
import { NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (agent(); as a) {
      <div>
        <h1>{{ a.name }}</h1>
        <p>{{ a.description }}</p>
        <div class="agent-meta">
          <p><strong>State:</strong> <span class="agent-state" [class]="'state-' + a.state">{{ a.state }}</span></p>
          <p><strong>Created:</strong> {{ a.createdAt | date }}</p>
          <p><strong>Updated:</strong> {{ a.updatedAt | date }}</p>
        </div>
        
        <div class="agent-actions">
          <button (click)="onStart()" [disabled]="a.state === 'running'">Start</button>
          <button (click)="onPause()" [disabled]="a.state === 'paused'">Pause</button>
          <button (click)="onStop()" [disabled]="a.state === 'idle'">Stop</button>
          <button (click)="onDelete()" class="danger">Delete</button>
        </div>
      </div>
    } @else {
      <p>Agent not found</p>
    }
  `,
  styles: [`
    .agent-meta { margin: 20px 0; }
    .agent-state { padding: 4px 8px; border-radius: 4px; }
    .state-idle { background: #e0e0e0; }
    .state-running { background: #c8e6c9; }
    .state-paused { background: #fff3e0; }
    .state-error { background: #ffcdd2; }
    .agent-actions { display: flex; gap: 10px; margin-top: 20px; }
    .danger { background: #f44336; color: white; }
  `]
})
export class AgentDetailComponent {
  readonly agentsState = inject(AgentsStateService);
  readonly route = inject(ActivatedRoute);
  
  readonly agentId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  readonly agent = computed(() => this.agentsState.agents().find(a => a.id === this.agentId()) || null);

  onStart() {
    const id = this.agentId();
    if (id) this.agentsState.update(id, { state: 'running' });
  }

  onPause() {
    const id = this.agentId();
    if (id) this.agentsState.update(id, { state: 'paused' });
  }

  onStop() {
    const id = this.agentId();
    if (id) this.agentsState.update(id, { state: 'idle' });
  }

  onDelete() {
    if (confirm('Delete this agent?')) {
      const id = this.agentId();
      if (id) this.agentsState.remove(id);
    }
  }
}