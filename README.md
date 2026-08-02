# Cloud File Dashboard — Backend API

A simple Node.js + Express backend that connects to **Google Drive** and **Dropbox**. The end user **signs in with their own account through a popup**, grants permission to view/edit/delete/create files, and can then list, view, upload, rename, and delete files. A **Logout** button disconnects the account so a different one can be connected. Files can be filtered by type (image, video, audio, document, archive) and are sorted by upload date.

## How it works

- **The user signs in through the provider's own popup.** They pick an account (Google or Dropbox) and approve the permissions. The provider hands us back a **refresh token**, which we store. There is no manual pasting of client ids, secrets, or refresh tokens.
- **Your app's client id + client secret live in `.env`.** These identify *your app* (registered once in each provider's developer console) — they are not per-user. On every successful sign-in we also copy them into MongoDB alongside the refresh token.
- **MongoDB** stores, per provider: the app credentials, the refresh token, the connected account's email, and a cached access token. The app silently exchanges the refresh token for a fresh access token whenever it needs one.
- **Simple student-friendly code.** Small files, plain async functions, lots of comments, no complex abstractions.

## Project structure

```
cloud-file-dashboard/
  .env                  # Your real credentials (git-ignored)
  .env.example          # Template
  package.json
  src/
    server.js           # Express app entry point
    db.js               # Mongoose connection + Provider model
    seed.js             # (Optional) copies client id/secret from .env to MongoDB
    tokens.js           # Gets a valid access token (refreshes if expired)
    fileType.js         # Category mapping (image/video/audio/document/archive/other)
    upload.js           # Multer config (memory storage, any file type, 100 MB limit)
    providers/
      index.js          # Picks the right adapter
      google.js         # Google Drive API adapter (+ OAuth helpers)
      dropbox.js        # Dropbox API adapter (+ OAuth helpers)
    routes/
      providers.js      # /api/providers + OAuth start/callback/logout
      files.js          # File operations (list/view/upload/edit/delete)
```

## API endpoints

| Method | Path | What it does |
|--------|------|--------------|
| `GET` | `/api/providers` | List providers + which account (if any) is connected |
| `GET` | `/api/:provider/auth/start` | Begin sign-in — redirects to the provider's consent screen |
| `GET` | `/api/:provider/auth/callback` | Where the provider redirects back; exchanges the code and saves the refresh token |
| `POST` | `/api/:provider/logout` | Revoke + clear the connected account |
| `GET` | `/api/:provider/files?type=&order=` | List files, filter by type, sort by date |
| `GET` | `/api/:provider/files/:id/view` | Download / view a file |
| `POST` | `/api/:provider/files` | Upload a file (form field `file`) |
| `PATCH` | `/api/:provider/files/:id` | Rename a file (`{ "name": "new.png" }`) |
| `DELETE` | `/api/:provider/files/:id` | Delete a file |

`:provider` can be `google` or `dropbox`.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Fill in `MONGODB_URI`, `OAUTH_REDIRECT_BASE` (defaults to `http://localhost:3000`), and each provider's **client id + client secret** (steps below). You do **not** put any refresh token here — those come from the sign-in popup.

### 3. Register your app with each provider

You do this **once per provider**. The important new detail is the **redirect URI**: it must exactly match `OAUTH_REDIRECT_BASE` + `/api/<provider>/auth/callback`.

---

## Provider setup guides

### Google Drive

#### 3.1. Create a project + enable the Drive API

1. Go to [console.cloud.google.com](https://console.cloud.google.com/), create/select a project.
2. **APIs & Services → Library → Google Drive API → Enable**.

#### 3.2. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**. Choose **External**, **Create**.
2. Fill in the app name and your emails, **Save and Continue**.
3. On **Scopes**, add `https://www.googleapis.com/auth/drive`, **Update**, **Save and Continue**.
4. On **Test users**, add every Google account you want to be able to sign in with (while the app is in "Testing"), **Save**.

#### 3.3. Create OAuth credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Choose **Web application**.
3. Under **Authorized redirect URIs**, add exactly:
   ```
   http://localhost:3000/api/google/auth/callback
   ```
   (Match your `OAUTH_REDIRECT_BASE` if it isn't localhost:3000.)
4. **Create**. Copy the **Client ID** and **Client secret**.

#### 3.4. Fill in `.env`

```ini
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_client_secret>
```

That's it — no refresh token. The user produces that by clicking **Connect** and signing in.

---

### Dropbox

#### 3.1. Create a Dropbox app

1. Go to [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) → **Create app**.
2. Choose **Scoped access** and **Full Dropbox**, name it, **Create app**.

#### 3.2. Configure permissions

On the **Permissions** tab enable:
- `files.metadata.read`
- `files.content.read`
- `files.content.write`
- `account_info.read` (so we can show the connected email)

Click **Submit**.

#### 3.3. Add the redirect URI

On the **Settings** tab, under **OAuth 2 → Redirect URIs**, add exactly:
```
http://localhost:3000/api/dropbox/auth/callback
```

#### 3.4. Fill in `.env`

Copy the **App key** and **App secret** from the Settings tab:

```ini
DROPBOX_CLIENT_ID=<your_app_key>
DROPBOX_CLIENT_SECRET=<your_app_secret>
```

---

## 4. (Optional) Seed the database

```bash
npm run seed
```

This just copies the client id/secret from `.env` into MongoDB so the provider rows exist before anyone connects. It is **not required** — the sign-in callback stores the same values. It never touches a connected user's refresh token.

---

## 5. Start the server

```bash
npm start
```

The server listens on `http://localhost:3000` (or whatever `PORT` you set). Open the frontend (see `frontend-test/`), click **Connect**, and sign in.

---

## Testing the API

### Check which providers are connected

```bash
curl http://localhost:3000/api/providers
```

### Sign in

Sign-in is interactive (it opens the provider's consent screen), so use the frontend's **Connect** button, or open `http://localhost:3000/api/google/auth/start` in a browser.

### List / upload / view / rename / delete

```bash
curl "http://localhost:3000/api/google/files?type=image&order=desc"
curl -F file=@photo.png http://localhost:3000/api/google/files
curl http://localhost:3000/api/google/files/<FILE_ID>/view -o downloaded.png
curl -X PATCH http://localhost:3000/api/google/files/<FILE_ID> \
  -H "Content-Type: application/json" -d '{"name":"renamed.png"}'
curl -X DELETE http://localhost:3000/api/google/files/<FILE_ID>
```

Replace `google` with `dropbox` for the other provider.

---

## Notes

- **File types**: recognized by mime type and file extension. See `src/fileType.js`.
- **Sorting**: always by upload date; `?order=asc` for oldest first (default newest first).
- **Upload limit**: 100 MB per file (`src/upload.js`).
- **Switching accounts**: click **Logout** on a provider, then **Connect** again and pick a different account. Logout revokes the token at the provider and clears it from MongoDB.
- **Refresh tokens**: stored per provider in MongoDB. If a provider revokes it (user removed access, permissions changed), just Connect again.
- **Security**: `.env` holds your app client secrets. Never commit or share it — `.gitignore` already excludes it.

---

## Troubleshooting

**"Not set up (missing client id/secret)"** → Fill in that provider's `CLIENT_ID`/`CLIENT_SECRET` in `.env` and restart the server.

**"redirect_uri_mismatch" (Google) / "redirect_uri" error (Dropbox)** → The redirect URI registered in the developer console must exactly equal `OAUTH_REDIRECT_BASE` + `/api/<provider>/auth/callback`.

**"No refresh token returned"** → Log out and connect again. Google only returns a refresh token when it re-prompts for consent (we force this with `prompt=consent`); Dropbox needs `token_access_type=offline` (already set).

**Popup blocked** → Allow popups for the page and click Connect again.

**"invalid_grant"** → The stored refresh token was revoked or expired. Click Logout, then Connect again.

**MongoDB connection error** → Whitelist your IP in Atlas (or `0.0.0.0/0` during development).

---

## What's next?

- Add **pagination** for providers with thousands of files.
- Add **folder support** and **search** by file name.
- Add **real edit** (replace file content, not just rename).

Enjoy your multi-cloud file dashboard!
