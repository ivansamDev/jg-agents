import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Agent, AgentState } from '../../../core/models/domain.models';
import { AgentsApiService } from './agents-api.service';

export interface AgentFilter {
  state?: AgentState;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsStateService {
  private readonly apiService = inject(AgentsApiService);

  readonly #agents = signal<Agent[]>([]);
  readonly #loading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #filter = signal<AgentFilter>({});
  readonly #selectedId = signal<string | null>(null);

  readonly agents = this.#agents.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly filter = this.#filter.asReadonly();
  readonly selectedId = this.#selectedId.asReadonly();

  readonly filteredAgents = computed(() => {
    const agents = this.#agents();
    const { state, search } = this.#filter();
    return agents.filter(agent => {
      const matchesState = !state || agent.state === state;
      const matchesSearch = !search || agent.name.toLowerCase().includes(search.toLowerCase());
      return matchesState && matchesSearch;
    });
  });

  readonly selectedAgent = computed(() => {
    const id = this.#selectedId();
    if (!id) return null;
    return this.#agents().find(a => a.id === id) || null;
  });

  selectAgent(id: string | null) {
    this.#selectedId.set(id);
  }

  load(): Observable<Agent[]> {
    this.#loading.set(true);
    this.#error.set(null);
    return this.apiService.getAgents().pipe(
      tap({
        next: (list) => {
          this.#agents.set(list);
          this.#loading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message || 'An error occurred');
          this.#loading.set(false);
        }
      })
    );
  }

  create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Observable<Agent> {
    this.#loading.set(true);
    this.#error.set(null);
    return this.apiService.createAgent(agent).pipe(
      tap({
        next: (newAgent) => {
          this.#agents.update(list => [...list, newAgent]);
          this.#loading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message || 'An error occurred during creation');
          this.#loading.set(false);
        }
      })
    );
  }

  update(id: string, changes: Partial<Omit<Agent, 'id' | 'createdAt'>>): Observable<Agent> {
    this.#loading.set(true);
    this.#error.set(null);
    return this.apiService.updateAgent(id, changes).pipe(
      tap({
        next: (updatedAgent) => {
          this.#agents.update(list => 
            list.map(item => item.id === id ? updatedAgent : item)
          );
          this.#loading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message || 'An error occurred during update');
          this.#loading.set(false);
        }
      })
    );
  }

  remove(id: string): Observable<void> {
    this.#loading.set(true);
    this.#error.set(null);
    return this.apiService.deleteAgent(id).pipe(
      tap({
        next: () => {
          this.#agents.update(list => list.filter(item => item.id !== id));
          if (this.#selectedId() === id) {
            this.#selectedId.set(null);
          }
          this.#loading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message || 'An error occurred during deletion');
          this.#loading.set(false);
        }
      })
    );
  }

  setFilter(filter: AgentFilter) {
    this.#filter.set({ ...this.#filter(), ...filter });
  }

  triggerApiFail(): void {
    this.apiService.triggerNextCallToFail();
  }
}