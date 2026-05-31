# Supabase — схема и миграции

## Таблицы для документов (DOCX, PDF и др.)

| Таблица | Назначение |
|---------|------------|
| `pdf_documents` | Сохранённый анализ документа (имя, текст, JSON анализа, режим консультанта) |
| `document_chunks` | Чанки текста для RAG и чата |
| `document_chat_messages` | История чата «Поговорить с документом» |

Имя `pdf_documents` историческое — в таблице хранятся **все** типы файлов (DOCX, XLSX, изображения и т.д.).

## Где используется `pdf_documents` в коде

- `smm-ai/src/lib/pdf-documents.ts` — `insert` в `pdf_documents` и `document_chunks`
- `smm-ai/src/app/api/analyze-pdf/route.ts` — вызывает `savePdfDocument` после анализа
- `smm-ai/src/app/api/documents/[id]/chat/route.ts` — `select` документа и чанков, `insert` в `document_chat_messages`
- `marketing_packages.document_id` — связь креативов с документом (миграция 003)

Заменять таблицу на другую **не нужно** — она является центральной для документов.

---

## План действий в Supabase

### Шаг 1. Применить схему (исправляет `relation "pdf_documents" does not exist`)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → проект **upghirncitrlgyrihfxo**.
2. **SQL Editor** → New query.
3. Скопируйте **весь** файл [`apply_all.sql`](./apply_all.sql) и нажмите **Run**.
4. Убедитесь, что в **Table Editor** появились таблицы:
   - `pdf_documents`, `document_chunks`, `document_chat_messages`
   - `marketing_projects`, `marketing_packages`, `marketing_creatives`

Альтернатива через CLI (если установлен Supabase CLI и проект привязан):

```bash
cd c:\Users\User\Desktop\AI-SMM
supabase link --project-ref upghirncitrlgyrihfxo
supabase db push
```

### Шаг 2. Исправить API key (исправляет `Invalid API key`)

В **`smm-ai/.env.local`** (именно эта папка — корень Next.js):

```env
NEXT_PUBLIC_SUPABASE_URL=https://upghirncitrlgyrihfxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ваш anon key из Dashboard>
```

Где взять ключ:

1. Dashboard → **Project Settings** → **API**
2. Скопируйте **Project URL** (без `/rest/v1/` в конце)
3. Скопируйте **anon public** key (JWT `eyJ...` или новый `sb_publishable_...`)

**Частые ошибки:**

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = URL REST API → `Invalid API key`
- `NEXT_PUBLIC_SUPABASE_URL` с суффиксом `/rest/v1/` — код обрежет, но лучше URL без суффикса

После правки перезапустите dev-сервер:

```bash
cd smm-ai
npm run dev
```

### Шаг 3. Проверка

1. Откройте `http://localhost:3000/test-supabase` — должно быть **Supabase Connected** (запрос к `pdf_documents`).
2. Загрузите DOCX на `/analyze-pdf` — после анализа не должно быть жёлтого предупреждения о сохранении; в Table Editor появится строка в `pdf_documents`.
3. Кнопка «Поговорить с документом» активна, если `documentId` вернулся в ответе API.

### Шаг 4. Авторизация (миграция 006)

1. В SQL Editor выполните [`migrations/006_auth.sql`](./migrations/006_auth.sql) (или обновлённый `apply_all.sql`).
2. В Dashboard → **Authentication** → **Providers**:
   - **Email** — включить
   - **Google** — Client ID / Secret, Redirect URL: `https://<project>.supabase.co/auth/v1/callback`
   - **Phone** — включить SMS (Twilio или встроенный провайдер Supabase)
3. **URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) или ваш домен
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://ваш-домен/auth/callback`

После миграции 006 данные привязаны к `user_id`; RLS разрешает доступ только владельцу (`authenticated`).

---

## Файлы миграций

| Файл | Содержимое |
|------|------------|
| `migrations/001_pdf_documents.sql` | Документы, чанки, чат |
| `migrations/002_document_file_type.sql` | Колонка `file_type` |
| `migrations/003_marketing_creatives.sql` | Маркетинг + дублирование схемы документов (идемпотентно) |
| `migrations/004_feature_modules.sql` | Reels, контент-план, конкуренты, AI маркетолог |
| `migrations/005_brand_kits.sql` | Brand Kit |
| `migrations/006_auth.sql` | Профили, `user_id`, RLS для авторизованных |
| `apply_all.sql` | Всё сразу для SQL Editor |

Порядок: `001` → … → `006` или один раз `apply_all.sql`.
