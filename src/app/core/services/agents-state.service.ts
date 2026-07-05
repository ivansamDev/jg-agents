import { Injectable, signal } from '@angular/core';
import { Agent, AgentState } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AgentsStateService {
  readonly items = signal<Agent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load() {
    this.loading.set(true);
    this.error.set(null);
    // Placeholder: implementar conexión real o mock controlado
    this.items.set([]);
    this.loading.set(false);
  }

  select(id: string) {
    return this.items().find(item => item.id === id) ?? null;
  }

  updateState(id: string, state: AgentState) {
    this.items.update(list => list.map(item => item.id === id ? { ...item, state, updatedAt: new Date() } : item));
  }
}
