# mohzzzz Script Hub

Firebase-powered script hub with mohzzzz dark design, key system, and 3-layer Lua obfuscation.

## Setup

### 1. Firebase Console (2 min)

Go to [Firebase Console](https://console.firebase.google.com/) → your **mohzzzz-hub** project:

1. **Authentication** → Sign-in method → Enable **Anonymous** ✅
2. **Firestore Database** → Create database → Start in **production mode**
3. **Firestore** → Rules tab → paste the content of `firestore.rules` → **Publish**

### 2. Deploy to Netlify

⚠️ **DO NOT drag & drop** — Functions need the Netlify CLI!

#### Option A: Double-click `deploy.bat` (Windows)
Just double-click `deploy.bat` — it installs everything and deploys automatically.

#### Option B: Manual (any OS)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install dependencies (firebase-admin)
npm install

# Login to Netlify
netlify login

# Deploy (first time: it will ask to create a new site)
netlify deploy --prod
```

### 3. Set Environment Variable

After first deploy, go to **Netlify Dashboard** → your site → **Site configuration** → **Environment variables** → Add:

| Key | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire content** of your Firebase service account JSON file |

Then **redeploy** (run `netlify deploy --prod` again or trigger a deploy from the dashboard).

### 4. Done! 🎉

Open your site URL. You'll see the hub — log in and your UID matches, you get the ADMIN panel.

## Architecture

| Component | Purpose |
|---|---|
| `index.html` | Full site — public scripts, key redeem, admin panel |
| `netlify/functions/serve.mjs` | Loadstring API — validates keys, serves obfuscated code |
| `netlify/functions/obfuscate.mjs` | 3-layer Lua obfuscator (XOR + ByteTable + junk code) |
| `firestore.rules` | Security — code collection is admin-only |

## Security

- **Script code** stored in `script_code` collection — only your UID can read/write
- **serve.mjs** uses Firebase Admin SDK (service account) to read code server-side
- **3-layer obfuscation**: ByteTable → XOR Encryption → ByteTable wrap
- **No code exposed** in browser — ever
