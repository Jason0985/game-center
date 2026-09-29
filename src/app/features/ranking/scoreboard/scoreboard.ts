import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../confirmation-dialog';
import { GameService } from '../game.service';
import { Player as PlayerModel } from '../../../player.model';
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
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './scoreboard.html',
  styleUrls: ['./scoreboard.scss'],
})
export class Scoreboard {
  hasCompletedRound = false;
  roundScores: Record<string, number | null> = {};
  players$: Observable<PlayerModel[]>;
  roundCount$: Observable<number>;

  constructor(
    private game: GameService,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.roundCount$ = this.game.roundCount$;
    this.players$ = this.game.players$.pipe(
      map((players) => players.slice().sort((a, b) => b.score - a.score)),
    );
  }

  setRoundScore(playerId: string, score: number | null) {
    this.roundScores[playerId] = score;
  }

  nextRound() {
    this.game.completeRound(this.roundScores);
    this.roundScores = {};
    this.hasCompletedRound = true;
  }

  endGame() {
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Ranking-Spiel beenden?',
          message:
            'Danach können keine weiteren Punkte eingetragen werden. Es werden nur noch die Endstände in einer Übersicht angezeigt.',
          confirmLabel: 'Endstände anzeigen',
          icon: 'flag',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;

        this.game.completeRound(this.roundScores);
        this.roundScores = {};
        this.game.finishGame();
        this.router.navigate(['/ranking/end-score']);
      });
  }

  trackById(_: number, p: PlayerModel) {
    return p.id;
  }
}
