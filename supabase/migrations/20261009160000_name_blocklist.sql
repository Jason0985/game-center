-- Unangemessene Benutzer- und Anzeigenamen sperren (Konten und Gäste). Die Prüfung steckt in
-- einer Funktion: die Tabelle lehnt solche Namen ab (Constraint), die App fragt vorher per RPC,
-- damit Registrierung und Gast-Beitritt eine klare Meldung zeigen statt eines Trigger-Fehlers.
--
-- Normalisiert wird: klein, ä/ö/ü/ß, Leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, 8→b, @, $, !, |),
-- alles andere als Trenner, doppelte Buchstaben zusammengezogen ("fiiick" → "fick").
-- Zwei Listen (schon zusammengezogen geschrieben):
--   anywhere: verboten auch mitten im Namen ("xXFickerXx")
--   word:     nur als eigenes Wort bzw. als ganzer Name, weil sie in harmlosen Namen stecken
--             ("Thure" → hure, "Annalena" → anal, "Hancock" → cock)
-- ponytail: feste Liste, kein Moderations-Dienst; erweitern, wenn etwas durchrutscht.

create or replace function public.name_is_allowed(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with spaced as (
    select regexp_replace(
             translate(replace(lower(coalesce(p_name, '')), 'ß', 'ss'),
                       'äöü0134578@$!|', 'aouoieastbasii'),
             '[^a-z]+', ' ', 'g') as s
  ), parts as (
    select regexp_replace(replace(s, ' ', ''), '(.)\1+', '\1', 'g') as joined,
           array(select regexp_replace(t, '(.)\1+', '\1', 'g')
                 from unnest(string_to_array(btrim(s), ' ')) as t) as words
    from spaced
  )
  select not exists (
           select 1 from parts, unnest(array[
             'fick', 'fuck', 'fotze', 'wichser', 'wixer', 'hurensohn', 'arschloch', 'arschgeige',
             'schlampe', 'misgeburt', 'spast', 'behindert', 'schwuchtel', 'kanake', 'neger',
             'niger', 'niga', 'hitler', 'siegheil', 'nsdap', 'auschwitz', 'penis', 'vagina',
             'pusy', 'titen', 'scheis', 'shit', 'bitch', 'whore', 'slut', 'retard', 'fagot',
             'porn', 'wanker'
           ]) as bad
           where position(bad in parts.joined) > 0
         )
     and not exists (
           select 1 from parts, unnest(array[
             'hure', 'nute', 'arsch', 'nazi', 'nazis', 'sex', 'dick', 'cock', 'cunt', 'fag',
             'rape', 'anal', 'cum', 'tits', 'mongo', 'kz'
           ]) as bad
           where bad = any(parts.words) or bad = parts.joined
         );
$$;

-- Auch ohne Anmeldung (Registrierung, Gast-Beitritt)
grant execute on function public.name_is_allowed(text) to anon, authenticated;

-- not valid: bestehende Namen bleiben, geprüft wird jeder neue bzw. geänderte Eintrag
alter table public.profiles drop constraint if exists profiles_names_allowed;
alter table public.profiles
  add constraint profiles_names_allowed
  check (public.name_is_allowed(username) and public.name_is_allowed(display_name))
  not valid;
