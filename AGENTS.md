# Szabályok

Ezt a fájlt az agent olvassa, mielőtt fejleszt vagy címkét tesz a jegyre.

## Veszélyes változás

Ha a jegy vagy a megírt változás ezek bármelyikét érinti, tedd fel a `veszélyes` címkét:

- jogosultság
- fizetés
- személyes adat
- törlő vagy átnevező migráció

A branch és a pull request ettől még elkészülhet. A címkét a fejlesztő veszi le, ha átnézte a változást.

## Teszt

A teszt parancsa:

```bash
npm test
```

## Élesítés

Az élesítést csak ez a küldő hagyhatja jóvá: nikolausz.csaba@dmsone.hu

Ha ettől a címtől jön a megjegyzés, hogy a teszt rendben van, mehet élesbe, tedd fel az `élesíthető` címkét. A jegyet ne zárd le. Más küldő ugyanilyen megjegyzésére ne tedd fel a címkét.
