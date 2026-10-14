import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { rankPlayers, SkGame } from './skyjo.model';

// Endstand (Artboard „Endstand“): Sieger mit Pokal, Treppchen für die ersten drei, der Rest
// als Liste, dazu Spalten, beste Runde und Verdoppelungen. Zurück in die Warte-Lobby
// entscheidet der Host.
@Component({
  selector: 'app-skyjo-final',
  template: `
    @let g = game();
    <section class="results" aria-labelledby="sk-final-title">
      <div class="intro intro--center">
        <span class="material-symbols-rounded fill trophy" aria-hidden="true">trophy</span>
        <h2 id="sk-final-title">{{ winner() ? winnerName() + ' gewinnt!' : 'Endstand' }}</h2>
        <p>{{ subtitle() }}</p>
      </div>

      <div class="podium">
        @for (p of podium(); track p.player.user_id) {
          <div class="step" [class.first]="p.rank === 1">
            <span class="avatar" [style.background]="p.color" aria-hidden="true">{{
              p.initial
            }}</span>
            <span class="step-name">{{ p.mine ? 'Du' : p.player.name }}</span>
            <div class="block" [style.height.px]="p.height">
              <span class="step-rank">{{ p.rank }}</span>
              <span class="step-total">{{ p.player.score }} P.</span>
            </div>
          </div>
        }
      </div>

      @if (rest().length) {
        <ol class="rest">
          @for (p of rest(); track p.player.user_id) {
            <li [class.mine]="p.mine">
              <span class="rank">{{ p.rank ?? '–' }}</span>
              <span class="avatar avatar--small" [style.background]="p.color" aria-hidden="true">{{
                p.initial
              }}</span>
              <span class="name grow">{{ p.mine ? 'Du' : p.player.name }}</span>
              @if (p.rank === null) {
                <span class="tag">verlassen</span>
              } @else if (p.player.score >= g.end_score) {
                <span class="tag tag--bad">{{ g.end_score }} erreicht</span>
              }
              <span class="rest-total">{{ p.player.score }}</span>
            </li>
          }
        </ol>
      }

      @if (mine(); as m) {
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Spalten abgeräumt</span>
            <span class="stat-value">{{ m.player.columns }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Beste Runde</span>
            <span class="stat-value">{{ bestRound() }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Verdoppelt</span>
            <span class="stat-value">{{ m.player.doubled }}×</span>
          </div>
        </div>
      }

      <div class="actions">
        @if (isHost()) {
          <button type="button" class="primary" [disabled]="busy()" (click)="backToLobby.emit()">
            <span class="material-symbols-rounded" aria-hidden="true">meeting_room</span>
            Zurück zur Warte-Lobby
          </button>
        } @else {
          <span class="hint">Der Host entscheidet, wie es weitergeht.</span>
        }
      </div>
    </section>
  `,
  styleUrl: './skyjo-results.scss',
})
export class SkyjoFinal {
  readonly game = input.required<SkGame>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);

  readonly backToLobby = output<void>();

  private readonly ranked = computed(() =>
    rankPlayers(this.game().players).map(({ player, rank }) => ({
      player,
      rank,
      mine: player.user_id === this.userId(),
      initial: player.name.trim().charAt(0).toUpperCase() || '?',
      color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
    })),
  );
  readonly winner = computed(() => this.ranked().find((row) => row.rank === 1) ?? null);
  readonly winnerName = computed(() => {
    const winner = this.winner();
    return winner?.mine ? 'Du' : (winner?.player.name ?? '');
  });
  readonly subtitle = computed(() => {
    const game = this.game();
    const winner = this.winner();
    const over = game.players.filter((p) => p.state === 'active' && p.score >= game.end_score);
    const rounds = `nach ${game.round_no} ${game.round_no === 1 ? 'Runde' : 'Runden'}`;
    if (!winner) return `Vorzeitig beendet ${rounds}`;
    const mine = over.some((p) => p.user_id === this.userId());
    const verb = over.length > 1 ? (mine ? 'habt' : 'haben') : mine ? 'hast' : 'hat';
    const reason = over.length
      ? ` · ${over.map((p) => (p.user_id === this.userId() ? 'du' : p.name)).join(' und ')} ${verb} die ${game.end_score} erreicht`
      : ` · vorzeitig beendet ${rounds}`;
    return `mit ${winner.player.score} Punkten${reason}`;
  });
  // Treppchen: Zweiter links, Erster in der Mitte, Dritter rechts
  readonly podium = computed(() => {
    const top = this.ranked()
      .filter((row) => row.rank !== null)
      .slice(0, 3);
    const order = [top[1], top[0], top[2]].filter(Boolean);
    return order.map((row) => ({
      ...row,
      height: row.rank === 1 ? 130 : row.rank === 2 ? 96 : 74,
    }));
  });
  readonly rest = computed(() => {
    const shown = new Set(this.podium().map((row) => row.player.user_id));
    return this.ranked().filter((row) => !shown.has(row.player.user_id));
  });
  readonly mine = computed(() => this.ranked().find((row) => row.mine) ?? null);
  // Beste Runde aller: „Mia 14“ (bzw. „Du 14“)
  readonly bestRound = computed(() => {
    const best = this.ranked()
      .filter((row) => row.player.best_round !== null)
      .sort((a, b) => a.player.best_round! - b.player.best_round!)[0];
    if (!best) return '–';
    return `${best.mine ? 'Du' : best.player.name} ${best.player.best_round}`;
  });
}
