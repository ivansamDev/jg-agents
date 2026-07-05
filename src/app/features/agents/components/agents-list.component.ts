import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentsStateService } from '../services/agents-state.service';
import { AgentState } from '../../../core/models/domain.models';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-agents-list',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  template: `
    <div class="agents-header">
      <h1>Agents</h1>
      <button (click)="onCreate()">New Agent</button>
    </div>
    
    <div class="agents-filters">
      <input 
        type="text" 
        placeholder="Search agents..." 
        [value]="searchFilter()"
        (input)="onSearch($any($event).target.value)">
      
      <select (change)="onStateFilter($any($event).target.value)">
        <option value="">All States</option>
        <option value="idle">Idle</option>
        <option value="running">Running</option>
        <option value="paused">Paused</option>
        <option value="error">Error</option>
      </select>
    </div>

    <div class="agents-list" *ngIf="!loading(); else loadingTpl">
      <div class="agent-card" *ngFor="let agent of filteredAgents()">
        <h3><a [routerLink]="['/agents', agent.id]">{{ agent.name }}</a></h3>
        <p>{{ agent.description }}</p>
        <span class="agent-state" [class]="'state-' + agent.state">{{ agent.state }}</span>
      </div>
    </div>

    <ng-template #loadingTpl>
      <p>Loading agents...</p>
    </ng-template>

    <div *ngIf="error()" class="error">
      Error: {{ error() }}
    </div>
  `,
  styles: [`
    .agents-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .agents-filters { display: flex; gap: 10px; margin-bottom: 20px; }
    .agents-filters input, .agents-filters select { padding: 8px; }
    .agent-card { border: 1px solid #ddd; padding: 16px; margin-bottom: 12px; border-radius: 4px; }
    .agent-state { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
    .state-idle { background: #e0e0e0; }
    .state-running { background: #c8e6c9; }
    .state-paused { background: #fff3e0; }
    .state-error { background: #ffcdd2; }
    .error { color: red; }
  `]
})
export class AgentsListComponent {
  readonly agentsState = inject(AgentsStateService);
  readonly agents = this.agentsState.agents;
  readonly loading = this.agentsState.loading;
  readonly error = this.agentsState.error;
  readonly filteredAgents = this.agentsState.filteredAgents;
  readonly searchFilter = signal('');

  constructor() {
    this.agentsState.load();
  }

  onSearch(value: string) {
    this.searchFilter.set(value);
    this.agentsState.setFilter({ search: value });
  }

  onStateFilter(value: string) {
    this.agentsState.setFilter({ state: value as AgentState });
  }

  onCreate() {
    const name = prompt('Agent name:');
    if (name) {
      this.agentsState.create({ name, description: 'New agent', state: 'idle' });
    }
  }
}