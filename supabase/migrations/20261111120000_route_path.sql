-- Routen-Check: eigene Strecke statt nur der schnellsten. Zwischenziele (vias) und auf
-- Wunsch genau die ausgewählte Strecke (follow_path: TomTom folgt dem gespeicherten path),
-- dazu der Straßenverlauf für die Anzeige (steps: [{"road": "A5", "km": 12.3}, …]).
-- Gesetzt nur von der Edge Function route-traffic (Aktion reroute); lässt sich gefahrlos
-- erneut ausführen.

alter table public.route_watches
  add column if not exists vias jsonb not null default '[]'::jsonb,
  add column if not exists follow_path boolean not null default false,
  add column if not exists steps jsonb not null default '[]'::jsonb;

alter table public.route_watches drop constraint if exists route_watches_vias_check;
alter table public.route_watches add constraint route_watches_vias_check
  check (jsonb_typeof(vias) = 'array' and jsonb_array_length(vias) <= 3);

alter table public.route_watches drop constraint if exists route_watches_steps_check;
alter table public.route_watches add constraint route_watches_steps_check
  check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 40);
