import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { BULL_PATH, N6Game, rankPlayers } from './nimm6.model';

// Rundenende: Wer wie viele Hornochsen bekommen hat, Balken bis zum Spielende; die nächste
// Runde startet per Knopf (jeder am Tisch) oder nach der Uhr im Container.
@Component({
  selector: 'app-nimm6-round',
  template: `
    @let g = game();
    <section class="results" aria-labelledby="n6-round-title">
      <div class="intro">
        <h2 id="n6-round-title">Runde {{ g.round_no }} vorbei</h2>
        <p>
          Erreicht jemand {{ g.end_score }} Hornochsen, endet das Spiel. Es gewinnt, wer am
          wenigsten hat.
        </p>
      </div>

      @if (extremes(); as e) {
        <div class="chips">
          <span class="chip chip--bad">
            <span class="material-symbols-rounded fill" aria-hidden="true">trending_up</span>
            Meiste: {{ e.most.name }} +{{ e.most.round_bulls }}
          </span>
          <span class="chip chip--good">
            <span class="material-symbols-rounded fill" aria-hidden="true">verified</span>
            Sauberste: {{ e.least.name }} +{{ e.least.round_bulls }}
          </span>
        </div>
      }

      <div class="table">
        <div class="table-head" aria-hidden="true">
          <span class="grow">Spieler</span>
          <span class="col">Runde</span>
          <span class="col">Gesamt</span>
        </div>
        <ol>
          @for (row of rows(); track row.player.user_id) {
            <li [class.mine]="row.mine" [class.gone]="row.rank === null">
              <span class="rank" [class.first]="row.rank === 1">{{ row.rank ?? '–' }}</span>
              <span class="avatar" [style.background]="row.color" aria-hidden="true">{{
                row.initial
              }}</span>
              <span class="who">
                <span class="name">{{ row.mine ? 'Du' : row.player.name }}</span>
                <span class="bar" aria-hidden="true">
                  <span class="bar-prev" [style.width.%]="row.prev"></span>
                  <span
                    class="bar-new"
                    [class.hot]="row.hot"
                    [style.left.%]="row.prev"
                    [style.width.%]="row.now"
                  ></span>
                </span>
              </span>
              <span class="col round">+{{ row.player.round_bulls }}</span>
              <span class="col total">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="bull" /></svg>
                {{ row.player.score }}
              </span>
            </li>
          }
        </ol>
        <div class="table-foot" aria-hidden="true">
          <span>0</span>
          <span class="limit">
            <span class="material-symbols-rounded">flag</span>
            {{ g.end_score }} = Spielende
          </span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="primary" [disabled]="busy()" (click)="next.emit()">
          <span class="material-symbols-rounded" aria-hidden="true">play_arrow</span>
          Runde {{ g.round_no + 1 }} starten
        </button>
        <span class="hint">
          @if (secondsLeft() !== null) {
            Startet automatisch in {{ secondsLeft() }} s ·
          }
          10 neue Karten für alle
        </span>
      </div>
    </section>
  `,
  styleUrl: './nimm6-results.scss',
})
export class Nimm6Round {
  readonly game = input.required<N6Game>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  readonly secondsLeft = input<number | null>(null);

  readonly next = output<void>();

  readonly bull = BULL_PATH;
  readonly rows = computed(() => {
    const game = this.game();
    return rankPlayers(game.players).map(({ player, rank }) => ({
      player,
      rank,
      mine: player.user_id === this.userId(),
      initial: player.name.trim().charAt(0).toUpperCase() || '?',
      color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
      prev: Math.min(100, ((player.score - player.round_bulls) / game.end_score) * 100),
      now: Math.max(
        0,
        Math.min(
          100 - ((player.score - player.round_bulls) / game.end_score) * 100,
          (player.round_bulls / game.end_score) * 100,
        ),
      ),
      // Nah am Spielende: gelb statt rosa
      hot: player.score >= game.end_score * 0.6,
    }));
  });
  readonly extremes = computed(() => {
    const active = this.game().players.filter((player) => player.state === 'active');
    if (active.length < 2) return null;
    const sorted = [...active].sort((a, b) => a.round_bulls - b.round_bulls);
    return { least: sorted[0], most: sorted.at(-1)! };
  });
}
