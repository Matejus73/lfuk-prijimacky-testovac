# 🩺 Testovač na prijímacie skúšky – Medicína LF UK (2026/2027)

Moderná webová aplikácia určená na efektívnu prípravu a testovanie na prijímacie skúšky na Lekársku fakultu Univerzity Komenského v Bratislave (LF UK).

Aplikácia simuluje oficiálny formát podkladových otázok (1000 otázok z biológie a 1000 otázok z chémie, možnosti A–H) s okamžitým vyhodnotením, sledovaním chybovosti a cieleným opakovaním.

## ✨ Funkcie

* **2000 otázok**: Kompletná databáza biológie (1000) a chémie (1000) s možnosťami A–H.
* **3 režimy učenia**: Všetky otázky sekvenčne, opakovanie chýb (**Revision**) a náhodný výber (**Random**).
* **Štatistiky a presnosť**: Real-time prehľad o správnych, nesprávnych a nezodpovedaných otázkach vrátane percentuálnej úspešnosti.
* **História s vyhľadávaním**: Bočný panel s prehľadom zodpovedaných otázok, filtrom a fulltextovým vyhľadávaním.
* **Užitočné nástroje**: Rýchle kopírovanie otázky do schránky (`Copy`) a opakovanie pokusu (`Try Again`).
* **Ukladanie stavu**: Automatické ukladanie celého progresu do `localStorage`.

## 🛠️ Použité technológie

* **Frontend**: [React 18+](https://react.dev/)
* **Typový systém**: [TypeScript](https://www.typescriptlang.org/)
* **Štýlovanie**: [Tailwind CSS](https://tailwindcss.com/)
* **Build nástroj**: [Vite](https://vitejs.dev/)
* **Hosting**: GitHub Pages

## 🚀 Spustenie projektu lokálne

### Požiadavky

* [Node.js](https://nodejs.org/) (verzia 18.x alebo vyššia)
* Správca balíkov `npm` / `pnpm` / `yarn`

### Inštalácia

1. **Naklonuj si repozitár:**
   ```bash
   git clone https://github.com/matejus73/testovac.git
   cd testovac
   ```

2. **Nainštaluj závislosti:**
   ```bash
   npm install
   ```

3. **Spusti vývojový server:**
   ```bash
   npm run dev
   ```
   Aplikácia beží štandardne na adrese `http://localhost:5173`.

4. **Build pre produkciu:**
   ```bash
   npm run build
   ```

## 📁 Štruktúra projektu

```
├── .github/
│   └── workflows/
│       └── deploy.yml   # Automatické nasadenie na GitHub Pages
├── public/              # Verejne dostupné statické súbory
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/      # Modulárne UI komponenty
│   │   ├── common/      # Znovupoužiteľné prvky (IconButton, ToggleSwitch, Icons)
│   │   ├── history/     # Komponenty histórie a vyhľadávania
│   │   ├── question/    # Karty otázok, voľby, navigácia a editácia
│   │   └── stats/       # Prehľad štatistík a indikátor úspešnosti
│   ├── constants/       # Konštanty a úložiskové kľúče
│   ├── data/            # Databáza otázok v JSON formáte
│   │   ├── OtazkyBio.json
│   │   └── OtazkyChem.json
│   ├── utils/           # Pomocné funkcie pre logiku a úložisko
│   ├── App.tsx          # Hlavný orchestrátor aplikácie
│   ├── index.css        # Globálne štýly a farebné premenné
│   ├── main.tsx         # Vstupný bod aplikácie
│   └── types.ts         # TypeScript typy a rozhrania
├── index.html           # HTML vstupná stránka
├── package.json         # Závislosti a npm skripty
├── vite.config.ts       # Konfigurácia Vite
├── tsconfig*.json       # Konfigurácia TypeScriptu
└── .oxlintrc.json       # Konfigurácia Oxlintu
```

## 📄 Licencia

Tento projekt je určený na vzdelávacie účely. Otázky a podklady vychádzajú z oficiálnych materiálov pre prijímacie konanie na LF UK.