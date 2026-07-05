import { Signal } from '@angular/core';

export type AgentState = 'idle' | 'running' | 'paused' | 'error';

export interface Agent {
  id: string;
  name: string;
  description: string;
  state: AgentState;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  assignee?: string;
  createdAt: Date;
}

export interface MetricSample {
  id: string;
  agentId: string;
  value: number;
  capturedAt: Date;
}
