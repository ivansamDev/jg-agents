import { Component, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Agent, AgentState } from '../../../core/models/domain.models';
import { AgentsStateService } from '../services/agents-state.service';
import { NgIf, NgClass, DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, UpperCasePipe],
  template: `
    <div class="agent-detail-card" *ngIf="agent; else selectTpl">
      <div class="detail-header">
        <div>
          <span class="agent-id-badge">ID: {{ agent.id }}</span>
          <h1>{{ agent.name }}</h1>
        </div>
        <span class="state-badge" [ngClass]="'state-' + agent.state">
          <span class="pulse-dot" *ngIf="agent.state === 'running'"></span>
          {{ agent.state | uppercase }}
        </span>
      </div>

      <div *ngIf="actionError" class="action-error-banner">
        <span>{{ actionError }}</span>
        <button class="btn-clear-error" (click)="actionError = null">&times;</button>
      </div>

      <div class="detail-body">
        <div class="detail-section">
          <h3>Description</h3>
          <p class="description-text">{{ agent.description || 'No description provided.' }}</p>
        </div>

        <div class="detail-section meta-grid">
          <div>
            <span class="meta-label">Created At</span>
            <span class="meta-value">{{ agent.createdAt | date:'medium' }}</span>
          </div>
          <div>
            <span class="meta-label">Last Updated</span>
            <span class="meta-value">{{ agent.updatedAt | date:'medium' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <div class="execution-controls">
          <button 
            (click)="onStart()" 
            [disabled]="agent.state === 'running' || isProcessing"
            class="btn btn-start"
            title="Start Agent"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            Start
          </button>
          
          <button 
            (click)="onPause()" 
            [disabled]="agent.state !== 'running' || isProcessing"
            class="btn btn-pause"
            title="Pause Agent"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            Pause
          </button>
          
          <button 
            (click)="onStop()" 
            [disabled]="agent.state === 'idle' || isProcessing"
            class="btn btn-stop"
            title="Stop Agent"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 6h12v12H6z"/></svg>
            Stop
          </button>
        </div>

        <div class="management-controls">
          <button 
            (click)="onEdit()" 
            [disabled]="isProcessing"
            class="btn btn-edit"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Edit
          </button>
          
          <button 
            (click)="onDelete()" 
            [disabled]="isProcessing"
            class="btn btn-danger"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Delete
          </button>
        </div>
      </div>
    </div>

    <ng-template #selectTpl>
      <div class="empty-detail">
        <svg viewBox="0 0 24 24" width="64" height="64" class="empty-icon">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <h3>No Agent Selected</h3>
        <p>Select an agent from the list to view configuration details, logs, and execution controls.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .agent-detail-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
      color: #f3f4f6;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .detail-header h1 {
      margin: 4px 0 0 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #ffffff;
    }
    .agent-id-badge {
      font-size: 0.75rem;
      font-family: monospace;
      color: #9ca3af;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .state-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .state-idle {
      background: rgba(156, 163, 175, 0.15);
      color: #d1d5db;
      border: 1px solid rgba(156, 163, 175, 0.3);
    }
    .state-running {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .state-paused {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .state-error {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
    .action-error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .btn-clear-error {
      background: none;
      border: none;
      color: #fca5a5;
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
    }
    .detail-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .detail-section h3 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin: 0 0 8px 0;
    }
    .description-text {
      font-size: 1rem;
      line-height: 1.6;
      color: #e5e7eb;
      margin: 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(0, 0, 0, 0.15);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .meta-label {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .meta-value {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: #f3f4f6;
    }
    .detail-actions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .execution-controls {
      display: flex;
      gap: 10px;
    }
    .execution-controls .btn {
      flex: 1;
    }
    .management-controls {
      display: flex;
      gap: 10px;
    }
    .management-controls .btn {
      flex: 1;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-start {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .btn-start:hover:not(:disabled) {
      background: #10b981;
      color: white;
    }
    .btn-pause {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .btn-pause:hover:not(:disabled) {
      background: #f59e0b;
      color: white;
    }
    .btn-stop {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .btn-stop:hover:not(:disabled) {
      background: #ef4444;
      color: white;
    }
    .btn-edit {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
    .btn-edit:hover:not(:disabled) {
      background: #3b82f6;
      color: white;
    }
    .btn-danger {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
      border: 1px solid rgba(220, 38, 38, 0.4);
    }
    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
      color: white;
    }
    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .empty-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px;
      color: #9ca3af;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-sizing: border-box;
    }
    .empty-icon {
      color: #4b5563;
      margin-bottom: 16px;
    }
    .empty-detail h3 {
      color: #f3f4f6;
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
export class AgentDetailComponent implements OnDestroy {
  private readonly stateService = inject(AgentsStateService);
  private readonly destroy$ = new Subject<void>();

  @Input() agent: Agent | null = null;
  @Output() edit = new EventEmitter<Agent>();
  @Output() deleted = new EventEmitter<void>();

  isProcessing = false;
  actionError: string | null = null;

  onStart() {
    this.updateState('running');
  }

  onPause() {
    this.updateState('paused');
  }

  onStop() {
    this.updateState('idle');
  }

  onEdit() {
    if (this.agent) {
      this.edit.emit(this.agent);
    }
  }

  onDelete() {
    if (!this.agent) return;
    if (confirm(`Are you sure you want to delete agent "${this.agent.name}"?`)) {
      this.isProcessing = true;
      this.actionError = null;
      this.stateService.remove(this.agent.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isProcessing = false;
            this.deleted.emit();
          },
          error: (err) => {
            this.isProcessing = false;
            this.actionError = err.message || 'Failed to delete agent.';
          }
        });
    }
  }

  private updateState(newState: AgentState) {
    if (!this.agent) return;
    this.isProcessing = true;
    this.actionError = null;
    this.stateService.update(this.agent.id, { state: newState })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isProcessing = false;
        },
        error: (err) => {
          this.isProcessing = false;
          this.actionError = err.message || `Failed to transition state to ${newState}.`;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}