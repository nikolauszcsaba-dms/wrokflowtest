# Szabályok

Ezt a fájlt az agent olvassa, mielőtt fejleszt vagy címkét tesz a jegyre.

## Veszélyes változás

Ha a jegy vagy a megírt változás ezek bármelyikét érinti, tedd fel a `danger` címkét:

- jogosultság
- fizetés
- személyes adat
- törlő vagy átnevező migráció

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

Az élesítést csak ez a küldő hagyhatja jóvá: nikolausz.csaba@dmsone.hu

Ha ettől a címtől jön a megjegyzés, hogy a teszt rendben van, mehet élesbe, tedd fel a `release` címkét. A jegyet ne zárd le. Más küldő ugyanilyen megjegyzésére ne tedd fel a címkét.
