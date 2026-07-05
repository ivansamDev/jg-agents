import { Injectable, signal, computed } from '@angular/core';
import { Agent, AgentState } from '../../../core/models/domain.models';

export interface AgentFilter {
  state?: AgentState;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsStateService {
  readonly #agents = signal<Agent[]>([]);
  readonly #loading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #filter = signal<AgentFilter>({});

  readonly agents = this.#agents.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly filter = this.#filter.asReadonly();

  readonly filteredAgents = computed(() => {
    const agents = this.#agents();
    const { state, search } = this.#filter();
    return agents.filter(agent => {
      const matchesState = !state || agent.state === state;
      const matchesSearch = !search || agent.name.toLowerCase().includes(search.toLowerCase());
      return matchesState && matchesSearch;
    });
  });

  load() {
    this.#loading.set(true);
    this.#error.set(null);
    // Simulación de carga
    setTimeout(() => {
      this.#agents.set([
        { id: '1', name: 'Agent Alpha', description: 'First agent', state: 'idle', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Agent Beta', description: 'Second agent', state: 'running', createdAt: new Date(), updatedAt: new Date() }
      ]);
      this.#loading.set(false);
    }, 500);
  }

  create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) {
    const newAgent: Agent = {
      ...agent,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.#agents.update(list => [...list, newAgent]);
  }

  update(id: string, changes: Partial<Omit<Agent, 'id' | 'createdAt'>>) {
    this.#agents.update(list => 
      list.map(item => item.id === id ? { ...item, ...changes, updatedAt: new Date() } : item)
    );
  }

  remove(id: string) {
    this.#agents.update(list => list.filter(item => item.id !== id));
  }

  setFilter(filter: AgentFilter) {
    this.#filter.set(filter);
  }
}