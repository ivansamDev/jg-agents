import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { AgentsStateService } from '../services/agents-state.service';
import { Agent, AgentState } from '../../../core/models/domain.models';
import { NgIf, NgFor, NgClass, SlicePipe, DatePipe, UpperCasePipe } from '@angular/common';
import { AgentDetailComponent } from './agent-detail.component';
import { AgentFormComponent } from './agent-form.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-agents-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    SlicePipe,
    DatePipe,
    UpperCasePipe,
    AgentDetailComponent,
    AgentFormComponent
  ],
  template: `
    <div class="agents-container">
      <div class="master-panel">
        <div class="panel-header">
          <div class="title-row">
            <h1>Agents Manager</h1>
            <div class="header-actions">
              <button class="btn btn-primary" (click)="onNewAgent()">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                New Agent
              </button>
            </div>
          </div>
          
          <div class="filters-row">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search agents..." 
                [value]="searchFilter()"
                (input)="onSearch($any($event).target.value)">
            </div>
            
            <select class="state-select" (change)="onStateFilter($any($event).target.value)">
              <option value="">All States</option>
              <option value="idle">Idle</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="panel-error-state">
          <svg viewBox="0 0 24 24" width="48" height="48" class="error-large-icon">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3>Connection Failed</h3>
          <p>{{ error() }}</p>
          <button class="btn btn-retry" (click)="onRetry()">Retry Loading</button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading() && !error()" class="loading-state">
          <div class="skeleton-card" *ngFor="let item of [1, 2, 3]">
            <div class="skeleton-header">
              <div class="skeleton-title"></div>
              <div class="skeleton-dot"></div>
            </div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
            <div class="skeleton-footer"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && !error() && filteredAgents().length === 0" class="panel-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" class="empty-large-icon">
            <path fill="currentColor" d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-2.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
          <h3>No Agents Found</h3>
          <p *ngIf="searchFilter() || stateFilter()">No agents match your search criteria. Try modifying your filters.</p>
          <p *ngIf="!searchFilter() && !stateFilter()">Your agent list is empty. Click "New Agent" to register your first system agent.</p>
        </div>

        <!-- Main List -->
        <div class="list-container" *ngIf="!loading() && !error() && filteredAgents().length > 0">
          <div 
            class="agent-card" 
            *ngFor="let agent of filteredAgents()"
            [ngClass]="{ 'active-card': selectedId() === agent.id }"
            (click)="onSelect(agent)"
          >
            <div class="card-title-row">
              <h3>{{ agent.name }}</h3>
              <span class="state-indicator" [ngClass]="'state-' + agent.state"></span>
            </div>
            <p class="card-desc">
              {{ agent.description | slice:0:75 }}{{ agent.description && agent.description.length > 75 ? '...' : '' }}
            </p>
            <div class="card-footer">
              <span class="state-text-badge" [ngClass]="'color-' + agent.state">{{ agent.state | uppercase }}</span>
              <span class="time-text">Updated {{ agent.updatedAt | date:'mediumTime' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <app-agent-detail
          *ngIf="currentView === 'detail' && selectedAgent()"
          [agent]="selectedAgent()"
          (edit)="onEditAgent($event)"
          (deleted)="onAgentDeleted()"
        ></app-agent-detail>

        <div class="empty-detail" *ngIf="currentView === 'detail' && !selectedAgent()">
          <svg viewBox="0 0 24 24" width="64" height="64" class="empty-icon">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <h3>No Agent Selected</h3>
          <p>Select an agent from the list to view configuration details, logs, and execution controls.</p>
        </div>

        <app-agent-form
          *ngIf="currentView === 'form'"
          [agent]="agentToEdit"
          (saved)="onAgentSaved($event)"
          (cancelled)="onFormCancelled()"
        ></app-agent-form>
      </div>
    </div>
  `,
  styles: [`
    .agents-container {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 24px;
      height: calc(100vh - 120px);
      min-height: 550px;
      box-sizing: border-box;
    }
    @media (max-width: 900px) {
      .agents-container {
        grid-template-columns: 1fr;
        height: auto;
      }
    }
    .master-panel {
      background: var(--app-glass-bg);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      box-shadow: var(--app-shadow);
    }
    .panel-header {
      padding: 20px;
      border-bottom: 1px solid var(--app-border);
      background: var(--app-bg);
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .title-row h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--app-text) 0%, var(--app-accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .filters-row {
      display: flex;
      gap: 10px;
    }
    .search-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--app-text-muted);
      pointer-events: none;
    }
    .search-box input {
      width: 100%;
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 6px;
      padding: 10px 10px 10px 38px;
      color: var(--app-text);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus {
      border-color: var(--app-accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    .state-select {
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 6px;
      padding: 10px 12px;
      color: var(--app-text);
      font-size: 0.9rem;
      outline: none;
      cursor: pointer;
      min-width: 120px;
    }
    .state-select:focus {
      border-color: var(--app-accent);
    }
    .list-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .agent-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .agent-card:hover {
      background: var(--app-bg);
      transform: translateY(-2px);
      border-color: var(--app-border);
    }
    .active-card {
      background: rgba(99, 102, 241, 0.1) !important;
      border-color: var(--app-accent) !important;
      box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .card-title-row h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--app-text);
      transition: color 0.2s;
    }
    .active-card .card-title-row h3 {
      color: var(--app-text);
    }
    .state-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .state-idle { background: var(--app-text-muted); }
    .state-running { background: var(--app-success); }
    .state-paused { background: var(--app-warn); }
    .state-error { background: var(--app-danger); }

    .card-desc {
      margin: 0 0 12px 0;
      font-size: 0.85rem;
      color: var(--app-text-muted);
      line-height: 1.4;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }
    .state-text-badge {
      font-weight: 700;
      font-size: 0.7rem;
      letter-spacing: 0.03em;
    }
    .color-idle { color: var(--app-text-muted); }
    .color-running { color: var(--app-success); }
    .color-paused { color: var(--app-warn); }
    .color-error { color: var(--app-danger); }
    .time-text {
      color: var(--app-text-muted);
    }

    .detail-panel {
      height: 100%;
    }

    /* Buttons styling */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: var(--app-accent);
      color: var(--app-text);
    }
    .btn-primary:hover {
      opacity: 0.9;
    }
    .btn-warning-outline {
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid var(--app-warn);
      color: var(--app-warn);
    }
    .btn-warning-outline:hover {
      background: var(--app-warn);
      color: var(--app-text);
    }
    .btn-retry {
      background: var(--app-accent);
      color: var(--app-text);
      margin-top: 12px;
      padding: 10px 20px;
    }
    .btn-retry:hover {
      opacity: 0.9;
    }

    /* Loading state skeleton */
    .loading-state {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .skeleton-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    .skeleton-card::after {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    .skeleton-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .skeleton-title {
      height: 16px;
      background: var(--app-border);
      border-radius: 4px;
      width: 50%;
    }
    .skeleton-dot {
      height: 8px;
      width: 8px;
      background: var(--app-border);
      border-radius: 50%;
    }
    .skeleton-text {
      height: 12px;
      background: var(--app-border);
      border-radius: 4px;
      margin-bottom: 6px;
      width: 90%;
    }
    .skeleton-text.short {
      width: 60%;
      margin-bottom: 16px;
    }
    .skeleton-footer {
      height: 10px;
      background: var(--app-border);
      border-radius: 4px;
      width: 30%;
    }

    /* Error & Empty States */
    .panel-error-state, .panel-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      flex: 1;
      color: var(--app-text-muted);
    }
    .error-large-icon {
      color: var(--app-danger);
      margin-bottom: 12px;
    }
    .empty-large-icon {
      color: var(--app-text-muted);
      margin-bottom: 12px;
    }
    .panel-error-state h3, .panel-empty-state h3 {
      margin: 0 0 6px 0;
      color: var(--app-text);
      font-size: 1.15rem;
    }
    .panel-error-state p, .panel-empty-state p {
      margin: 0;
      font-size: 0.85rem;
      max-width: 280px;
      line-height: 1.4;
    }
    .empty-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px;
      color: var(--app-text-muted);
      background: var(--app-glass-bg);
      border: 1px dashed var(--app-border);
      border-radius: 12px;
      box-sizing: border-box;
    }
    .empty-icon {
      color: var(--app-text-muted);
      margin-bottom: 16px;
    }
    .empty-detail h3 {
      color: var(--app-text);
      font-size: 1.2rem;
      margin: 0 0 8px 0;
    }
    .empty-detail p {
      max-width: 320px;
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  `]
})
export class AgentsListComponent implements OnInit, OnDestroy {
  private readonly agentsState = inject(AgentsStateService);
  private readonly destroy$ = new Subject<void>();

  readonly loading = this.agentsState.loading;
  readonly error = this.agentsState.error;
  readonly filteredAgents = this.agentsState.filteredAgents;
  readonly selectedId = this.agentsState.selectedId;
  readonly selectedAgent = this.agentsState.selectedAgent;

  readonly searchFilter = signal('');
  readonly stateFilter = signal('');

  currentView: 'detail' | 'form' = 'detail';
  agentToEdit: Agent | null = null;

  ngOnInit() {
    this.loadAgentsList();
  }

  loadAgentsList() {
    this.agentsState.load()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          // Auto-select first agent if none is selected and list has items
          if (list.length > 0 && !this.selectedId()) {
            this.onSelect(list[0]);
          }
        }
      });
  }

  onSelect(agent: Agent) {
    this.agentsState.selectAgent(agent.id);
    this.currentView = 'detail';
  }

  onSearch(value: string) {
    this.searchFilter.set(value);
    this.agentsState.setFilter({ search: value });
  }

  onStateFilter(value: string) {
    this.stateFilter.set(value);
    this.agentsState.setFilter({ state: value as AgentState });
  }

  onNewAgent() {
    this.agentToEdit = null;
    this.currentView = 'form';
  }

  onEditAgent(agent: Agent) {
    this.agentToEdit = agent;
    this.currentView = 'form';
  }

  onFormCancelled() {
    this.currentView = 'detail';
  }

  onAgentSaved(savedAgent: Agent) {
    this.currentView = 'detail';
    this.agentsState.selectAgent(savedAgent.id);
  }

  onAgentDeleted() {
    this.currentView = 'detail';
    const currentList = this.filteredAgents();
    if (currentList.length > 0) {
      this.onSelect(currentList[0]);
    } else {
      this.agentsState.selectAgent(null);
    }
  }

  onRetry() {
    this.loadAgentsList();
  }

  onSimulateError() {
    this.agentsState.triggerApiFail();
    alert('Mock API will fail on the next action/reload! Click "Retry Loading" or edit/create an agent with "error" to trigger.');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}