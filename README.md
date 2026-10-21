# Vrienden maken kun je leren

Website van de cursus *Vrienden maken kun je leren*: negen bijeenkomsten over contact leggen, vriendschappen verdiepen en volhouden, met werkbladen en trainersnotities.

## Tekst aanpassen

Alle inhoud staat in gewone tekstbestanden (Markdown) in de map `content/`:

- `content/modules/01.md` t/m `09.md`: de bijeenkomsten
- `content/werkbladen.md`: de werkbladen
- `content/trainers.md`: de pagina voor trainers

Bovenaan elk bijeenkomstbestand staan de titel, duur en voorbereiding. Speciale blokken:

- `:::trainer` … `:::` wordt het uitklapblok **Voor de trainer**
- `:::bronnen` … `:::` wordt de bronnenlijst (en verschijnt ook op de bronnenpagina)

Je kunt bestanden direct op GitHub bewerken (potloodicoon). Na opslaan zet Vercel de nieuwe versie automatisch online.

## Lokaal bekijken

```bash
npm install
npm run dev
```

De site wordt gebouwd naar `dist/` met `npm run build`. Vormgeving staat in `public/style.css`.
