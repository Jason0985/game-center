import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import type { LatLon } from './route-check.service';

export interface MapLine {
  id: string;
  path: LatLon[];
  // main = gespeicherte/gewählte Strecke, alt = Alternative zum Vergleichen
  tone: 'main' | 'alt';
}

export interface MapMarker {
  lat: number;
  lon: number;
  kind: 'start' | 'goal' | 'via' | 'jam' | 'closure' | 'roadworks' | 'warning';
  label: string;
}

/**
 * Karte für den Routen-Check (Leaflet mit OpenStreetMap): Strecken als Linien, Start, Ziel,
 * Zwischenziele und Störungen als Punkte. Tippen auf die Karte meldet die Stelle (pick),
 * Tippen auf eine Alternative deren id (choose).
 */
@Component({
  selector: 'app-route-map',
  template: `<div #host class="route-map" role="application" [attr.aria-label]="label()"></div>`,
  styleUrl: './route-map.scss',
  // Leaflet baut die Karte selbst ins DOM; die Stile müssen dort ankommen
  encapsulation: ViewEncapsulation.None,
})
export class RouteMap {
  readonly lines = input<MapLine[]>([]);
  readonly markers = input<MapMarker[]>([]);
  readonly label = input('Karte der Strecke');
  readonly pick = output<LatLon>();
  readonly choose = output<string>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private map: L.Map | null = null;
  private layer: L.LayerGroup | null = null;
  // Nur neu einpassen, wenn sich die Strecken ändern (nicht bei jedem neuen Punkt)
  private fitted = '';

  constructor() {
    afterNextRender(() => {
      const map = L.map(this.host().nativeElement, {
        zoomControl: false,
        attributionControl: true,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      map.on('click', (event: L.LeafletMouseEvent) =>
        this.pick.emit([round(event.latlng.lat), round(event.latlng.lng)]),
      );
      map.setView([51.1, 10.4], 6);
      this.layer = L.layerGroup().addTo(map);
      this.map = map;
      this.draw();
    });

    effect(() => {
      this.lines();
      this.markers();
      this.draw();
    });

    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  private draw(): void {
    const map = this.map;
    const layer = this.layer;
    if (!map || !layer) return;
    layer.clearLayers();

    // Alternativen unten, die Hauptstrecke oben
    const lines = [...this.lines()].sort((a, b) =>
      a.tone === b.tone ? 0 : a.tone === 'alt' ? -1 : 1,
    );
    for (const line of lines) {
      if (line.path.length < 2) continue;
      // Breite, unsichtbare Linie darunter: leichter zu treffen
      if (line.tone === 'alt') {
        L.polyline(line.path, { className: 'route-map-hit', weight: 22, opacity: 0 })
          .on('click', (event) => {
            L.DomEvent.stopPropagation(event);
            this.choose.emit(line.id);
          })
          .addTo(layer);
      }
      L.polyline(line.path, {
        className: `route-map-casing route-map-casing--${line.tone}`,
        weight: line.tone === 'main' ? 9 : 7,
        interactive: false,
      }).addTo(layer);
      L.polyline(line.path, {
        className: `route-map-line route-map-line--${line.tone}`,
        weight: line.tone === 'main' ? 5 : 4,
        interactive: false,
      }).addTo(layer);
    }

    for (const marker of this.markers()) {
      L.marker([marker.lat, marker.lon], {
        icon: L.divIcon({
          className: `route-map-pin route-map-pin--${marker.kind}`,
          iconSize: marker.kind === 'via' || isEnd(marker.kind) ? [18, 18] : [14, 14],
        }),
        title: marker.label,
        alt: marker.label,
        keyboard: false,
        interactive: false,
      }).addTo(layer);
    }

    const key = lines.map((l) => `${l.id}:${l.path.length}`).join('|');
    if (key && key !== this.fitted) {
      const bounds = L.latLngBounds(lines.flatMap((l) => l.path));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] });
        this.fitted = key;
      }
    }
  }
}

const isEnd = (kind: MapMarker['kind']) => kind === 'start' || kind === 'goal';
const round = (value: number) => Math.round(value * 1e5) / 1e5;
