import {
  isAllowedRaplaUrl,
  parseRaplaWeek,
  weekUrl,
} from '../../../../../supabase/functions/rapla-lectures/rapla-parser';

// Nachbau der Rapla-Wochenansicht der DHBW: Kopfzeile mit colspan je Tag (parallele Termine),
// Zeitspalte, Termine mit rowspan und Tooltip samt verschachtelter Infotabelle
const tooltip = (title: string, when: string) =>
  `<span class="tooltip"><strong>Vorlesung</strong><br><div>${when} wöchentlich</div>` +
  `<table class="infotable"><tr><td class="label">Titel:</td><td class="value">${title}</td></tr>` +
  `<tr><td class="label">Ressourcen:</td><td class="value">TINF24B</td></tr></table></span>`;

const block = (rowspan: number, time: string, title: string, when: string) =>
  `<td class="week_block" rowspan="${rowspan}" style="background-color:#ffcc99">` +
  `<a href="#">${time}<br>${title}${tooltip(title, when)}</a><span class="resource">TINF24B</span></td>`;

const HTML = `<html><body><form><table><tr><td>Navigation</td></tr></table></form>
<table class="week_table">
<tr><td class="week_number">KW 2</td>
  <td class="week_header" colspan="2"><nobr>Mo 06.01.</nobr></td>
  <td class="week_header" colspan="1"><nobr>Di 07.01.</nobr></td>
  <td class="week_header" colspan="1"><nobr>Mi 08.01.</nobr></td></tr>
<tr><td class="week_times" rowspan="4">08:00</td>
  <td class="week_emptycell_black"></td>
  ${block(6, '08:15&#160;-09:45', 'Lineare Algebra &amp; Analysis', 'Mo 06.01.25 08:15-09:45')}
  <td class="week_emptycell_white" rowspan="4"></td>
  <td class="week_emptycell_black"></td></tr>
<tr><td class="week_emptycell_black"></td><td class="week_emptycell_black"></td></tr>
<tr>${block(4, '09:00&#160;-12:15', 'Programmieren', 'Mo 06.01.25 09:00-12:15')}
  <td class="week_emptycell_black"></td></tr>
<tr><td class="week_emptycell_black"></td></tr>
<tr><td class="week_times" rowspan="4">10:00</td>
  ${block(4, '10:30&#160;-12:00', 'Datenbanken', 'Di 07.01.25 10:30-12:00')}
  ${block(4, '13:00&#160;-16:15', 'Theoretische Informatik', 'Mi 08.01.25 13:00-16:15')}</tr>
</table></body></html>`;

// Ausschnitt der echten Seite (DHBW Rapla, KW 45/2026): Kopfzeile mit th für die Kalenderwoche,
// <br/>, keine Tooltips, Räume als resource-Spans hinter dem Link, Trennzellen je Tag
const s = '<td class="week_smallseparatorcell_black">&nbsp;</td>';
const sep = '<td class="week_separatorcell_black">&nbsp;</td>';
const e = '<td class="week_emptycell_black">&nbsp;</td>';
const real = (rowspan: number, href: string, time: string, title: string) =>
  `<td valign="top" class="week_block" rowspan="${rowspan}" style="background-color:#a3ddff">` +
  `<a href="#${href}">${time}<br/>${title}</a><br><span class="resource">FN-TIM24</span>` +
  `<br><span class="resource">E107 Seminarraum</span></td>`;
const REAL = `<div class="calendar"><table class="week_table"><tbody><tr>
<th class="week_number">KW 45</th><td class="week_header" colspan="3"><nobr>Mo 02.11.</nobr></td><td class="week_header" colspan="5"><nobr>Di 03.11.</nobr></td><td class="week_header" colspan="3"><nobr>Mi 04.11.</nobr></td><td class="week_header" colspan="5"><nobr>Do 05.11.</nobr></td><td class="week_header" colspan="3"><nobr>Fr 06.11.</nobr></td><td class="week_header" colspan="3"><nobr>Sa 07.11.</nobr></td><td class="week_header" colspan="3"><nobr>So 08.11.</nobr></td>
</tr><tr></tr><tr>
<th class="week_times" rowspan="4"><nobr>08:00</nobr> &#160;</th>
${s}${real(12, '0', '08:00&#160;-11:00', 'Freie Zeit für Bearbeitung der Studienarbeiten')}${sep}${s}${e}
${s}${e}
${sep}${s}${e}
${sep}${s}${real(28, '8', '08:00&#160;-15:00', 'Wiederholung T2000')}${s}${e}
${sep}${s}${real(20, '12', '08:00&#160;-13:00', 'Unternehmensführung &lt;MaK/MaU&gt;')}${sep}${s}${e}
${sep}${s}${e}
${sep}
</tr></tbody></table></div>`;

describe('Rapla-Parser', () => {
  it('liest die echte DHBW-Wochenansicht', () => {
    expect(parseRaplaWeek(REAL, 2026, 11)).toEqual([
      {
        date: '2026-11-02',
        start: '08:00',
        end: '11:00',
        title: 'Freie Zeit für Bearbeitung der Studienarbeiten',
      },
      { date: '2026-11-05', start: '08:00', end: '15:00', title: 'Wiederholung T2000' },
      { date: '2026-11-06', start: '08:00', end: '13:00', title: 'Unternehmensführung <MaK/MaU>' },
    ]);
  });

  it('ordnet Termine über die Spalten den richtigen Tagen zu', () => {
    const lectures = parseRaplaWeek(HTML, 2025, 1);
    expect(lectures).toEqual([
      { date: '2025-01-06', start: '08:15', end: '09:45', title: 'Lineare Algebra & Analysis' },
      { date: '2025-01-06', start: '09:00', end: '12:15', title: 'Programmieren' },
      { date: '2025-01-07', start: '10:30', end: '12:00', title: 'Datenbanken' },
      { date: '2025-01-08', start: '13:00', end: '16:15', title: 'Theoretische Informatik' },
    ]);
  });

  it('nimmt beim Jahreswechsel das Vorjahr für Dezember-Tage', () => {
    const html = HTML.replace('Mo 06.01.', 'Mo 30.12.').replace(/06\.01\.25/g, '30.12.24');
    const lectures = parseRaplaWeek(html, 2025, 1);
    expect(lectures[0].date).toBe('2024-12-30');
  });

  it('liest notfalls Datum und Zeit aus den Tooltips', () => {
    const html = HTML.replace(/week_header/g, 'kopf');
    const lectures = parseRaplaWeek(html, 2025, 1);
    expect(lectures.map((l) => `${l.date} ${l.start}`)).toEqual([
      '2025-01-06 08:15',
      '2025-01-06 09:00',
      '2025-01-07 10:30',
      '2025-01-08 13:00',
    ]);
  });

  it('lässt nur Rapla-Links der DHBW zu und hängt das Datum an', () => {
    const link = 'https://rapla.dhbw.de/rapla/calendar?key=abc&salt=1';
    expect(isAllowedRaplaUrl(link)).toBe(true);
    expect(isAllowedRaplaUrl('http://rapla.dhbw.de/rapla/calendar?key=abc')).toBe(false);
    expect(isAllowedRaplaUrl('https://evil.example/rapla?key=abc')).toBe(false);
    expect(isAllowedRaplaUrl('https://rapla.dhbw.de.evil.example/rapla?key=abc')).toBe(false);
    expect(weekUrl(link, '2025-11-06')).toBe(
      'https://rapla.dhbw.de/rapla/calendar?key=abc&salt=1&day=6&month=11&year=2025',
    );
  });
});
