import { Component, signal } from '@angular/core';
import { bindRequestState, type RequestState } from 'rx-state-bridge';
import { fetchUser$, type User } from '../fake-api';

@Component({
  selector: 'app-bind-request-state-demo',
  imports: [],
  templateUrl: './bind-request-state-demo.html',
})
export class BindRequestStateDemo {
  user = signal<RequestState<User>>({ loading: false, error: null, data: null });

  run(): void {
    fetchUser$(6, { latency: 600, failRate: 0.3 }).pipe(bindRequestState(this.user)).subscribe();
  }

  get errorMessage(): string {
    return (this.user().error as Error)?.message ?? '';
  }
}
