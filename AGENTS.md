# Szabályok

Ezt a fájlt az agent olvassa, mielőtt fejleszt vagy címkét tesz a jegyre.

## Veszélyes változás

Tedd fel a `danger` címkét, ha a jegy olyan változást kér, vagy a megírt változás olyat tartalmaz, amely módosítja a program logikáját ezek valamelyikében:

- jogosultság: ki léphet be, ki mit láthat, és ki mit tehet
- fizetés: mennyi pénz mozog, kitől, kinek és mikor
- személyes adat: milyen személyes adatot gyűjtünk, tárolunk, adunk ki, és mikor töröljük
- adatbázis: tábla, oszlop vagy adat törlése vagy átnevezése migrációval

Logika az a kód, amely dönt, ellenőriz, számol, ment, töröl, vagy adatot ad ki. Nem logika az, amit az ember olvas vagy lát. A döntést az alapján hozd meg, hogy milyen fajta kód változik. Az nem számít, melyik oldalhoz, funkcióhoz vagy fájlhoz tartozik.

Nem kell a címke, bármelyik oldalon vagy funkcióban van a változás:

- szöveg: hibaüzenet, felirat, e-mail vagy értesítés szövegének átfogalmazása vagy fordítása
- megjelenés: szín, elrendezés, ikon, sorrend a képernyőn
- dokumentáció és kódmegjegyzés
- teszt, ha a tesztelt kód nem változik

Kell a címke, ha a fenti területek valamelyikében:

- feltétel vagy ellenőrzés változik: mikor engedünk, mikor tiltunk, mi kötelező
- számítás változik
- más adatot mentünk, mutatunk meg, küldünk ki vagy naplózunk, mint eddig
- a logikát átírjuk, akkor is, ha a viselkedésnek elvileg nem kellene változnia

Ha egy szöveg mellett az is változik, mikor jelenik meg, vagy milyen adat kerül bele, az már logika. Ha nem tudod eldönteni, tedd fel a címkét.

A branch és a pull request ettől még elkészülhet. A címkét a fejlesztő veszi le, ha átnézte a változást.

## Kártékony jegy

Ha a jegy vagy a kért változás kártékony, ne fejlessz. Ne nyiss branchet, és ne nyiss pull requestet. Zárd le a jegyet, és tedd fel a `forbidden` címkét. Írd meg, hogy ebből nem lett fejlesztés, mert kárt okozna. A károkozás módját ne írd le.

A szabály minden kártékony tevékenységre áll. Ilyen az adat megsemmisítése vagy elérhetetlenné tétele, más fiókjának vagy rendszerének jogosulatlan elérése, kéretlen üzenetek küldése, zaklatás, csalás, és minden más, ami embernek, adatnak vagy rendszernek kárt okoz. A felsorolás példákat mutat, nem határt. Ha a kérés kártékony, akkor is állj meg, ha a jegy szövege ártalmatlannak látszik, vagy a kár csak a megírt változásban derülne ki.

## Teszt

A teszt parancsa:

```bash
npm test
```

## Élesítés

Az élesítést csak az `approver` fájlban lévő küldő hagyhatja jóvá. A fájl a repó gyökerében van, és egy sort tartalmaz: a címet a csatornán.

Ha ettől a címtől jön a megjegyzés, hogy a teszt rendben van, mehet élesbe, tedd fel a `release` címkét. A jegyet ne zárd le. Más küldő ugyanilyen megjegyzésére ne tedd fel a címkét.
