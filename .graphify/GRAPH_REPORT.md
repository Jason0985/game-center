# Graph Report - .  (2026-10-01)

## Corpus Check
- 183 files · ~195,833 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 826 nodes · 1219 edges · 47 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 421 · method: 284 · reads_from: 139 · calls: 137 · imports: 121 · imports_from: 95 · references: 13 · triggers: 5 · implements: 2 · inherits: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 183 · Candidates: 272
- Excluded: 0 untracked · 33191 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `35b708a`
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

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (19): appConfig, routes, ConfirmationDialogData, ConfirmationDialog, Screenshot, LeagueFields, NumberField, TextField (+11 more)

### Community 30 - "Community 30"
Cohesion: 0.36
Nodes (2): App, ToastHost

### Community 32 - "Community 32"
Cohesion: 0.38
Nodes (1): Auth

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (2): ArrivalPlannerSettingsDialog, ArrivalPlanner

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): ArrivalPlannerSettings, DEFAULT_ARRIVAL_PLANNER_SETTINGS

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (12): CollectionItem, Collection, ProfileRoleConfig, PROFILE_ROLES, USER_ROLE, profileRoleConfigs(), RoleEditDialogData, openRoleEditDialog() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (5): Track, TrackData, DetailedView, EditTrackDialogData, EditTrackDialog

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (8): DownloadDialog, Track, TrackData, F1Strategy, TireTemperature, EngineTemperature, TemperatureData, GeneralInfoDialog

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (2): TrackEditValues, F1StrategyOverridesService

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (5): PaddleDebtSelection, PaddleAddDebtDialog, PaddleAddPlayerDialog, PaddleSetValueDialog, PaddleTable

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): PaddlePlayer, PaddleDebtEntry

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (1): PaddleService

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (15): META, Line, BAKU_SCREEN, pad(), formatTime(), formatGap(), formatLapGap(), parseTime() (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (14): SessionType, RaceType, DriverStatus, DRIVER_STATUSES, ExtractedResult, ResultRow, SessionMeta, TrackInfo (+6 more)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (26): ExtractResult, RaceResultsService, readErrorMessage(), Flip7Turn, GameRow, LobbyResult, LobbySummaryRow, MemberRow (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (3): toNumber(), RaceResults, OnDestroy

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (24): HandCard, FanCard, Slot, Flight, POINTER, BUST_TILT, OWN_BUST_TILT, CHOOSER_TITLES (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (3): player(), makeGame(), Flip7GameView

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (35): Flip7NumberCard, Flip7ModifierCard, Flip7ActionCard, Flip7Card, Flip7PlayerState, Flip7Status, Flip7EventType, Flip7Event (+27 more)

### Community 21 - "Community 21"
Cohesion: 0.31
Nodes (1): Flip7Service

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (14): LobbyStatus, LobbyGameSettings, LobbyProfile, LobbySummary, LobbyMember, LobbyDetail, requiredReadyCount(), canStartLobby() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (13): LobbyInviteDialogData, InviteState, INVITE_STATES, InviteRow, LobbyInviteDialog, FriendAddDialogData, RelationState, FriendAddDialog (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (3): member(), lobbyDetail(), Lobby

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (1): Multiplayer

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (7): TableLayout, TableGeometry, SeatSpot, AVATAR_COLORS, QUERIES, formatClock(), eventAge()

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (15): NotificationCategory, NotificationTone, NotificationActions, NotificationTypeConfig, NOTIFICATION_TYPES, SYSTEM_NOTIFICATION_OPTIONS, Notifications, SystemAlertDialogData (+7 more)

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (3): NotificationType, SystemNotificationType, NotificationItem

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): ProfileRole, Profile

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (1): GameSetup

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (1): GameService

### Community 46 - "Community 46"
Cohesion: 1.00
Nodes (1): Player

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (1): AuthService

### Community 20 - "Community 20"
Cohesion: 0.23
Nodes (1): NotificationsService

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (6): Theme, ThemeOption, THEME_OPTIONS, THEME_COLORS, isTheme(), ThemeService

### Community 47 - "Community 47"
Cohesion: 1.00
Nodes (1): supabase

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (1): SupabaseService

### Community 48 - "Community 48"
Cohesion: 1.00
Nodes (1): environment

### Community 25 - "Community 25"
Cohesion: 0.36
Nodes (10): public.profiles, auth.users, public.ranking_games, public.friendships, public.notifications, public.f1_strategy_overrides, public.multiplayer_lobbies, public.multiplayer_lobby_members (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.30
Nodes (10): friendships_notify, public.friendships, public.notify_friendship_change(), actor_name, public.profiles, public.notifications, public.send_system_notification(), public (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.70
Nodes (4): public.set_user_role(), public.profiles, updated, public

### Community 36 - "Community 36"
Cohesion: 0.60
Nodes (4): friendships_cleanup_notifications, public.friendships, public.cleanup_friendship_notifications(), public.notifications

### Community 28 - "Community 28"
Cohesion: 0.36
Nodes (6): public.set_user_roles(), cleaned, unnest, public.profiles, updated, public

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (25): public.multiplayer_lobby_codes, public.multiplayer_lobbies, multiplayer_lobbies_cleanup_invites, public._add_lobby_member(), lobby_status, public.multiplayer_lobby_members, member_count, public (+17 more)

### Community 38 - "Community 38"
Cohesion: 0.83
Nodes (3): public.set_lobby_game(), public.multiplayer_lobbies, public

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (49): public.flip7_games, public.multiplayer_lobbies, public.flip7_players, public.flip7_decks, public.flip7_game_ticks, multiplayer_lobby_members_flip7_leave, public.multiplayer_lobby_members, public._flip7_draw() (+41 more)

### Community 33 - "Community 33"
Cohesion: 0.48
Nodes (5): public._flip7_discard(), public.flip7_decks, discard_size, public.flip7_games, public

### Community 29 - "Community 29"
Cohesion: 0.42
Nodes (8): public.set_lobby_game(), public.multiplayer_lobbies, public.start_lobby(), lobby, public.multiplayer_lobby_members, member_count, public.notifications, public

## Knowledge Gaps
- **121 isolated node(s):** `appConfig`, `routes`, `ArrivalPlannerSettings`, `DEFAULT_ARRIVAL_PLANNER_SETTINGS`, `CollectionItem` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 30`** (2 nodes): `App`, `ToastHost`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Auth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `ArrivalPlannerSettingsDialog`, `ArrivalPlanner`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `ArrivalPlannerSettings`, `DEFAULT_ARRIVAL_PLANNER_SETTINGS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `TrackEditValues`, `F1StrategyOverridesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `PaddlePlayer`, `PaddleDebtEntry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `PaddleService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Flip7Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Multiplayer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `ProfileRole`, `Profile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `GameSetup`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `GameService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Player`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `NotificationsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `supabase`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `SupabaseService`
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
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.050314465408805034 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Should `Community 12` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._