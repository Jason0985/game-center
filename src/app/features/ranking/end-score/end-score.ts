import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../game.service';
import { Player } from '../../../player.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-end-score',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './end-score.html',
  styleUrls: ['./end-score.scss'],
})
export class EndScore {
  players$: Observable<Player[]>;
  roundCount$: Observable<number>

  constructor(
    private game: GameService,
    private router: Router,
  ) {
    this.roundCount$ = this.game.roundCount$;
    this.players$ = this.game.players$.pipe(
      map((players) => players.slice().sort((a, b) => b.score - a.score))
    );
  }

  trackById(_: number, player: Player) {
    return player.id;
  }

  startNewGame() {
    this.game.resetScores();
    this.router.navigate(['/ranking']);
  }
}
