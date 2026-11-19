# Workflow teszt

Egyszerű webes alkalmazás a fejlesztési folyamat kipróbálásához. React kliens, Node.js szerver és MongoDB, egy konténerben.

Funkciók: regisztráció, bejelentkezés, kijelentkezés. Belépés után a bal oldalon egy menü van, benne egy üres Dashboard. A fejlécben a felhasználóra kattintva lenyíló menü nyílik: a profil szerkesztése (jelszócsere, profilkép feltöltése) és a kijelentkezés.

## Futtatás konténerben

```bash
docker build -t wrokflowtest .
docker run -p 8080:8080 -e JWT_KEY=valami-titok wrokflowtest
```

Az alkalmazás a http://localhost:8080 címen nyílik meg. Az állapotot a `/api/health` végpont adja vissza.

A MongoDB a konténeren belül fut, az adat a konténerrel együtt elvész.

## Fejlesztés

A szerverhez egy futó MongoDB kell a `mongodb://127.0.0.1:27017` címen, vagy a `MONGO_URI` változóban megadott helyen.

```bash
npm install
JWT_KEY=dev npm run dev:server
npm run dev:client
```

A kliens a http://localhost:5173 címen fut, az `/api` hívásokat a 8080-as portra küldi tovább.

## Teszt

```bash
npm test
```

A szerver tesztjei memóriában futó MongoDB-vel futnak.

## Környezeti változók

| Változó | Alapérték | Leírás |
| --- | --- | --- |
| `JWT_KEY` | nincs, kötelező | a belépési token aláírókulcsa |
| `PORT` | `8080` | a szerver portja |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/app` | az adatbázis címe |
| `COOKIE_SECURE` | `false` | `true` esetén a süti csak HTTPS-en megy |
| `CLIENT_DIR` | nincs | a lefordított kliens mappája, a konténerben be van állítva |
