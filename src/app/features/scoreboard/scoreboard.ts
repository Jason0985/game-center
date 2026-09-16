import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { GameService } from '../../game.service';
import { Player as PlayerModel } from '../../player.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './scoreboard.html',
  styleUrls: ['./scoreboard.scss'],
})
export class Scoreboard {
  name = '';
  gameStarted = false;
  hasCompletedRound = false;
  roundScores: Record<string, number | null> = {};
  players$: Observable<PlayerModel[]>;

  constructor(
    private game: GameService,
    private router: Router,
  ) {
    this.players$ = this.game.players$.pipe(
      map((players) => players.slice().sort((a, b) => b.score - a.score)),
    );
  }

  add() {
    this.game.addPlayer(this.name);
    this.name = '';
  }

  removePlayer(playerId: string) {
    this.game.removePlayer(playerId);
  }

  setRoundScore(playerId: string, score: number | null) {
    this.roundScores[playerId] = score;
  }

  startGame() {
    this.gameStarted = true;
  }

  nextRound() {
    this.game.completeRound(this.roundScores);
    this.roundScores = {};
    this.hasCompletedRound = true;
  }

  endGame() {
    this.game.completeRound(this.roundScores);
    this.roundScores = {};
    this.router.navigate(['/end-score']);
  }

  trackById(_: number, p: PlayerModel) {
    return p.id;
  }
}
