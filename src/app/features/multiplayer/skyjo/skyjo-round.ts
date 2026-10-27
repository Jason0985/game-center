import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { SkyjoCardView } from './skyjo-card';
import { columnOf, formatPoints, rankPlayers, SkGame } from './skyjo.model';

// Rundenende (Artboard „Rundenende“): je Spieler das aufgedeckte Raster, die Punkte der
// Runde (Rundenbeender ggf. × 2), Balken bis zum Spielende und der neue Stand. Weiter per
// Knopf (jeder am Tisch) oder nach der Uhr im Container; hat jemand das Spielende erreicht,
// geht es zum Endstand.
@Component({
  selector: 'app-skyjo-round',
  imports: [SkyjoCardView],
  template: `
    @let g = game();
    <section class="results" aria-labelledby="sk-round-title">
      <div class="intro">
        <h2 id="sk-round-title">Runde {{ g.round_no }} vorbei</h2>
        <p>{{ subtitle() }}</p>
      </div>

      <ol class="round-list">
        @for (row of rows(); track row.player.user_id) {
          <li class="round-card" [class.mine]="row.mine" [class.gone]="row.rank === null">
            <div class="round-head">
              <span class="rank" [class.first]="row.rank === 1">{{ row.rank ?? '–' }}</span>
              <span class="avatar" [style.background]="row.color" aria-hidden="true">{{
                row.initial
              }}</span>
              <span class="name">{{ row.mine ? 'Du' : row.player.name }}</span>
              @if (row.ender) {
                <span class="chip chip--gold">
                  <span class="material-symbols-rounded fill" aria-hidden="true">flag</span>
                  beendet
                </span>
              }
              @if (row.doubled) {
                <span class="chip chip--bad" aria-label="verdoppelt">
                  <span class="material-symbols-rounded fill" aria-hidden="true">close</span>2
                </span>
              }
              @if (row.out) {
                <span class="chip chip--bad">
                  <span class="material-symbols-rounded fill" aria-hidden="true">block</span>
                  {{ g.end_score }}
                </span>
              }
              <span class="total" [class.out]="row.out">{{ row.player.score }}</span>
            </div>
            @if (row.rank !== null) {
              <div class="round-body">
                <span class="mini-grid" aria-hidden="true">
                  @for (c of row.cells; track $index) {
                    @if (c === null) {
                      <span class="mini-slot"></span>
                    } @else {
                      <app-skyjo-card class="mini" [card]="c" />
                    }
                  }
                </span>
                <span class="round-side">
                  <span class="round-points" [class.doubled]="row.doubled">{{ row.points }}</span>
                  <span class="bar" aria-hidden="true">
                    <span class="bar-prev" [style.width.%]="row.prevPct"></span>
                    <span
                      class="bar-new"
                      [attr.data-tone]="row.tone"
                      [style.left.%]="row.prevPct"
                      [style.width.%]="row.newPct"
                    ></span>
                  </span>
                  <span class="prev">vorher {{ row.prev }}</span>
                </span>
              </div>
            }
          </li>
        }
      </ol>

      <div class="actions">
        <button type="button" class="primary" [disabled]="busy() || locked()" (click)="next.emit()">
          <span class="material-symbols-rounded" aria-hidden="true">{{
            last() ? 'emoji_events' : 'play_arrow'
          }}</span>
          {{ last() ? 'Zum Endstand' : 'Runde ' + (g.round_no + 1) + ' starten' }}
        </button>
        <span class="hint">
          @if (secondsLeft() !== null) {
            {{ last() ? 'Endstand' : 'Startet automatisch' }} in {{ secondsLeft() }} s ·
          }
          {{ last() ? 'Das Spiel ist vorbei' : '12 neue Karten für alle' }}
        </span>
      </div>
    </section>
  `,
  styleUrl: './skyjo-results.scss',
})
export class SkyjoRound {
  readonly game = input.required<SkGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  readonly secondsLeft = input<number | null>(null);
  // Erst kurz lesen lassen, bevor jemand für alle weiterschaltet
  readonly locked = input(false);
  // Letzte Runde des Spiels: weiter zum Endstand statt zur nächsten Runde
  readonly last = input(false);

  readonly next = output<void>();

  readonly subtitle = computed(() => {
    const game = this.game();
    const out = game.players.filter((p) => p.state === 'active' && p.score >= game.end_score);
    const names = out.map((p) => (p.user_id === this.userId() ? 'du' : p.name));
    const mine = out.some((p) => p.user_id === this.userId());
    const verb = out.length > 1 ? (mine ? 'habt' : 'haben') : mine ? 'hast' : 'hat';
    return out.length
      ? `Alle Karten sind aufgedeckt. ${capitalize(names.join(' und '))} ${verb} ${game.end_score} erreicht – das Spiel endet.`
      : `Alle Karten sind aufgedeckt. Wer ${game.end_score} Punkte erreicht, beendet das Spiel.`;
  });

  readonly rows = computed(() => {
    const game = this.game();
    return rankPlayers(game.players).map(({ player, rank }) => {
      const points = player.round_score ?? 0;
      const raw = player.round_raw ?? 0;
      const prev = player.score - points;
      const doubled = player.round_score !== null && points !== raw;
      const out = player.state === 'active' && player.score >= game.end_score;
      const pct = (x: number) => Math.max(0, Math.min(100, (x / game.end_score) * 100));
      return {
        player,
        rank,
        mine: player.user_id === this.userId(),
        initial: player.name.trim().charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
        // ender_seat bleibt bis zum nächsten Austeilen gesetzt
        ender: player.seat === game.ender_seat,
        doubled,
        out,
        points: doubled
          ? `${formatPoints(raw)} × 2 = ${formatPoints(points)}`
          : formatPoints(points),
        prev,
        prevPct: pct(prev),
        newPct: Math.max(0, pct(player.score) - pct(prev)),
        tone: out ? 'out' : player.score >= game.end_score * 0.7 ? 'hot' : 'new',
        cells: player.cards.map((card, cell) => (player.cleared[columnOf(cell)] ? null : card)),
      };
    });
  });
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
