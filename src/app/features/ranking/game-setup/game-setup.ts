import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameService } from '../game.service';
import { Player } from '../../../player.model';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './game-setup.html',
  styleUrl: './game-setup.scss',
})
export class GameSetup {
  name = '';
  players$: Observable<Player[]>;

  constructor(
    private game: GameService,
    private router: Router,
  ) {
    this.players$ = this.game.players$.pipe(
      map((players) => players.slice().sort((a, b) => b.score - a.score))
    );
  }

  add() {
    this.game.addPlayer(this.name);
    this.name = '';
  }

  removePlayer(playerId: string) {
    this.game.removePlayer(playerId);
  }

  startGame() {
    this.game.startGame();
    this.router.navigate(['/ranking/game']);
  }

  trackById(_: number, player: Player) {
    return player.id;
  }
}
