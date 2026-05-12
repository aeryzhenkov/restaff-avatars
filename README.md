# ReStaff Avatars

Корпоративный сервис создания аватарок для команды ReStaff.

## Что это

Статический веб-сервис на чистом HTML/CSS/JS. Никакой сборки, никаких зависимостей.

- **Лендинг** с описанием и формой входа
- **Демо-авторизация** по корпоративным доменам (`restaff.pro`, `restaff.tech`, `staffco.ru`)
- **Студия аватарок** с автокропом по лицу, 9 фильтрами и цветовым кодом отделов/регионов
- **2 языка**: RU / EN
- **Эталоны** — два примера правильного оформления

## Запуск локально

Просто открыть `index.html` в браузере. Из-за `fetch('assets-data.json')` нужен любой локальный сервер:

```bash
python3 -m http.server 8000
```

Затем открой http://localhost:8000

## Деплой на Vercel (5 минут)

### Вариант 1 — через GitHub (рекомендую)

1. Создать новый репозиторий на GitHub
2. Залить туда все эти файлы
3. На vercel.com → "Import Project" → выбрать репозиторий
4. Жмёшь Deploy — всё

URL будет вида `restaff-avatars.vercel.app`

### Вариант 2 — без GitHub

1. Скачать [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. В папке проекта: `vercel`
3. Авторизоваться через email
4. Ответить на 2-3 вопроса, и всё

## Структура проекта

```
restaff-avatars/
├── index.html           # Главная страница (лендинг + приложение)
├── app.js               # Логика
├── assets-data.json     # Логотипы и сэмплы в base64
├── vercel.json          # Конфиг Vercel
└── README.md            # Этот файл
```

## Переход к настоящему Google OAuth

Сейчас вход — это просто проверка домена в email. Чтобы заменить на настоящий Google OAuth:

1. Создать проект в Google Cloud Console
2. Включить Google Identity API
3. Получить `CLIENT_ID`
4. Заменить функцию `openSignIn()` в `app.js` на:

```js
function openSignIn() {
  // Google Identity Services
  google.accounts.id.initialize({
    client_id: 'ВАШ_CLIENT_ID.apps.googleusercontent.com',
    callback: handleGoogleResponse
  });
  google.accounts.id.prompt();
}

function handleGoogleResponse(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  const domain = payload.email.split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    alert('Доступ только для сотрудников ReStaff');
    return;
  }
  currentUser = payload.email;
  localStorage.setItem('restaff_user', payload.email);
  showApp();
}
```

И в `index.html`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Готовый код для этого варианта пришлю отдельно когда настроишь Google Cloud Console.
