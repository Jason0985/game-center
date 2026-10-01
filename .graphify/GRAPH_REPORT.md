# Graph Report - .  (2026-10-01)

## Corpus Check
- 177 files · ~192,816 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 826 nodes · 1219 edges · 47 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 421 · method: 284 · reads_from: 139 · calls: 137 · imports: 121 · imports_from: 95 · references: 13 · triggers: 5 · implements: 2 · inherits: 2


## Input Scope
- Requested: all
- Resolved: all (source: cli)
- Included files: 177 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 1 sensitive · 0 missing committed

## Graph Freshness
- Built from Git commit: `627feed`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `public.flip7_games` - 24 edges
2. `Notifications` - 20 edges
3. `Profile` - 20 edges
4. `RaceResults` - 19 edges
5. `Flip7GameView` - 16 edges
6. `GameService` - 16 edges
7. `MultiplayerLobbyService` - 15 edges
8. `PaddleService` - 14 edges
9. `Lobby` - 14 edges
10. `NotificationsService` - 14 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (26): Flip7Turn, GameRow, LobbyDetailRow, lobbyFailure(), LobbyResult, LobbySummaryRow, MemberRow, MultiplayerLobbyService (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (49): deck, discard_size, game, game_status, hand, jsonb_array_elements, lobby, member_count (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (19): appConfig, routes, ConfirmationDialog, ConfirmationDialogData, roleGuard(), EndScore, Flip7Final, Flip7RoundSummary (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (15): NOTIFICATION_TYPES, NotificationActions, NotificationCategory, NotificationTone, NotificationTypeConfig, SYSTEM_NOTIFICATION_OPTIONS, Notifications, SystemAlertDialog (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (13): INVITE_STATES, InviteRow, InviteState, LobbyInviteDialog, LobbyInviteDialogData, FriendAddDialog, FriendAddDialogData, RelationState (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (24): BUST_TILT, CHOOSER_TITLES, FanCard, Flight, Flip7Board, formatClock(), HandCard, OWN_BUST_TILT (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (35): ACTION_COLORS, ACTION_ICONS, ACTION_NAMES, AVATAR_COLORS, cardAriaLabel(), cardIcon(), cardName(), describeEvent() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (5): PaddleAddDebtDialog, PaddleDebtSelection, PaddleAddPlayerDialog, PaddleSetValueDialog, PaddleTable

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (12): Collection, CollectionItem, PROFILE_ROLES, ProfileRoleConfig, profileRoleConfigs(), USER_ROLE, openRoleEditDialog(), RoleEditDialog (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (25): host_name, invite_lobby_id, lobby, lobby_code, lobby_status, member_count, multiplayer_lobbies_cleanup_invites, new_lobby_id (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (15): buildRltSessionExport(), formatGap(), formatLapGap(), formatTime(), lapGap(), lapTimings(), pad(), parseLapsBehind() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (3): OnDestroy, RaceResults, toNumber()

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (8): DownloadDialog, F1Strategy, Track, TrackData, EngineTemperature, GeneralInfoDialog, TemperatureData, TireTemperature

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (3): Flip7GameView, makeGame(), player()

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (3): Lobby, lobbyDetail(), member()

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (14): canStartLobby(), GAME_NAMES, gameLabel(), gameName(), gameOf(), GAMES, LobbyDetail, LobbyGameSettings (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (1): GameService

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (5): DetailedView, Track, TrackData, EditTrackDialog, EditTrackDialogData

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (1): PaddleService

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (14): DRIVER_STATUSES, DriverStatus, ExtractedResult, findByName(), findTeam(), findTrack(), KNOWN_TEAMS, KNOWN_TRACKS (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.23
Nodes (1): NotificationsService

### Community 21 - "Community 21"
Cohesion: 0.31
Nodes (1): Flip7Service

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (1): Multiplayer

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (2): ArrivalPlanner, ArrivalPlannerSettingsDialog

### Community 24 - "Community 24"
Cohesion: 0.30
Nodes (10): actor_name, friendships_notify, pg_publication_tables, public, public.friendships, public.notifications, public.notify_friendship_change(), public.profiles (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.36
Nodes (10): auth.users, on_auth_user_created, public.f1_strategy_overrides, public.friendships, public.handle_new_user(), public.multiplayer_lobbies, public.multiplayer_lobby_members, public.notifications (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (6): isTheme(), Theme, THEME_COLORS, THEME_OPTIONS, ThemeOption, ThemeService

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (7): AVATAR_COLORS, eventAge(), formatClock(), QUERIES, SeatSpot, TableGeometry, TableLayout

### Community 28 - "Community 28"
Cohesion: 0.36
Nodes (6): cleaned, public, public.profiles, public.set_user_roles(), unnest, updated

### Community 29 - "Community 29"
Cohesion: 0.42
Nodes (8): lobby, member_count, public, public.multiplayer_lobbies, public.multiplayer_lobby_members, public.notifications, public.set_lobby_game(), public.start_lobby()

### Community 30 - "Community 30"
Cohesion: 0.36
Nodes (2): App, ToastHost

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (1): GameSetup

### Community 32 - "Community 32"
Cohesion: 0.38
Nodes (1): Auth

### Community 33 - "Community 33"
Cohesion: 0.48
Nodes (5): discard_size, public, public.flip7_decks, public._flip7_discard(), public.flip7_games

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (2): F1StrategyOverridesService, TrackEditValues

### Community 35 - "Community 35"
Cohesion: 0.70
Nodes (4): public, public.profiles, public.set_user_role(), updated

### Community 36 - "Community 36"
Cohesion: 0.60
Nodes (4): friendships_cleanup_notifications, public.cleanup_friendship_notifications(), public.friendships, public.notifications

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (1): AuthService

### Community 38 - "Community 38"
Cohesion: 0.83
Nodes (3): public, public.multiplayer_lobbies, public.set_lobby_game()

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (3): NotificationItem, NotificationType, SystemNotificationType

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (1): SupabaseService

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): ArrivalPlannerSettings, DEFAULT_ARRIVAL_PLANNER_SETTINGS

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): PaddleDebtEntry, PaddlePlayer

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): Profile, ProfileRole

### Community 46 - "Community 46"
Cohesion: 1.00
Nodes (1): Player

### Community 47 - "Community 47"
Cohesion: 1.00
Nodes (1): supabase

### Community 48 - "Community 48"
Cohesion: 1.00
Nodes (1): environment

## Knowledge Gaps
- **121 isolated node(s):** `appConfig`, `routes`, `ArrivalPlannerSettings`, `DEFAULT_ARRIVAL_PLANNER_SETTINGS`, `CollectionItem` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (1 nodes): `GameService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `PaddleService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `NotificationsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Flip7Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Multiplayer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `ArrivalPlanner`, `ArrivalPlannerSettingsDialog`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `App`, `ToastHost`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `GameSetup`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Auth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `F1StrategyOverridesService`, `TrackEditValues`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `SupabaseService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `ArrivalPlannerSettings`, `DEFAULT_ARRIVAL_PLANNER_SETTINGS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `PaddleDebtEntry`, `PaddlePlayer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `Profile`, `ProfileRole`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Player`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `supabase`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `environment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Profile` connect `Community 4` to `Community 15`, `Community 8`, `Community 0`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `ConfirmationDialog` connect `Community 2` to `Community 3`, `Community 7`, `Community 4`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `ActionResult` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `appConfig`, `routes`, `ArrivalPlannerSettings` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05202661826981246 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08458646616541353 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.050314465408805034 - nodes in this community are weakly interconnected._