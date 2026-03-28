# TISA Journal
### Track. Improve. Study. Ace.
> *Write together. Grow together.*

A minimalist, aesthetically beautiful journaling platform for personal reflection and shared journaling between two people.

---

## ✨ Features

| Feature | Status |
|---|---|
| Personal private journal | ✅ |
| Shared journal (2 users) | ✅ |
| Mood selector (emoji-based) | ✅ |
| Tags system | ✅ |
| Reactions (❤️ 🌱 ⭐) | ✅ |
| Comments / Reflections | ✅ |
| Reflection Mode (random past entry) | ✅ |
| Growth Tracker (streak + stats) | ✅ |
| Silent Mode (read-only) | ✅ |
| Focus Mode (distraction-free writing) | ✅ |
| Real-time sync | 🔧 Requires Firebase |
| Google Sign-In | 🔧 Requires Firebase Auth |

---

## 🚀 Quick Start (Demo Mode)

The app ships with demo data and a mock user — no setup required.

```bash
npx create-react-app tisa-journal
cd tisa-journal
# Replace src/App.js content with tisa-journal.jsx
npm start
```

Or with Vite (recommended):

```bash
npm create vite@latest tisa-journal -- --template react
cd tisa-journal
npm install
# Replace src/App.jsx with tisa-journal.jsx
npm run dev
```

---

## 🔥 Firebase Setup (Full Features)

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `tisa-journal`
3. Enable Google Analytics (optional)

### 2. Enable Authentication

- Firebase Console → **Authentication** → **Sign-in method**
- Enable **Google**
- Enable **Email/Password**

### 3. Enable Firestore

- Firebase Console → **Firestore Database** → **Create database**
- Start in **production mode**
- Choose a region close to your users

### 4. Get Your Config

- Firebase Console → **Project Settings** → **Your apps** → **Web app**
- Copy the config object

### 5. Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> For Create React App, use `REACT_APP_` prefix instead of `VITE_`.

### 6. Install Firebase SDK

```bash
npm install firebase
```

### 7. Initialize Firebase (replace mock config)

In `tisa-journal.jsx`, find `FIREBASE_CONFIG` and replace with:

```js
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

Then add at the top of the file:

```js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";

const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 📁 Recommended Folder Structure

```
tisa-journal/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EntriesView.jsx
│   │   ├── EntryCard.jsx
│   │   ├── EntryDetail.jsx
│   │   ├── EditorPanel.jsx
│   │   ├── SharedSetup.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useEntries.js
│   │   ├── useAuth.js
│   │   └── useSharedJournal.js
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   └── firestore.js
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .gitignore
└── README.md
```

---

## 🗄️ Firestore Data Structure

```
users/
  {userId}/
    displayName: string
    email: string
    photoURL: string
    sharedJournalId: string | null
    streak: number
    lastJournaled: timestamp

entries/
  {entryId}/
    userId: string
    journalId: string          # "personal-{userId}" or shared journal ID
    title: string
    content: string
    mood: string               # emoji
    tags: string[]
    createdAt: timestamp
    reactions: {
      "❤️": string[],          # array of userIds
      "🌱": string[],
      "⭐": string[]
    }
    comments: [
      { userId, author, text, createdAt }
    ]

sharedJournals/
  {journalId}/
    members: string[]          # [userId1, userId2], max 2
    inviteCode: string
    createdAt: timestamp
    name: string
```

---

## 🔒 Firestore Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Entries: read/write if it's your entry or you're in the shared journal
    match /entries/{entryId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         isJournalMember(resource.data.journalId));
      allow update: if request.auth.uid == resource.data.userId ||
        (isJournalMember(resource.data.journalId) &&
         onlyUpdatingReactionsOrComments());
      allow delete: if request.auth.uid == resource.data.userId;
    }

    // Shared journals: readable by members only
    match /sharedJournals/{journalId} {
      allow read: if request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth.uid in resource.data.members &&
        resource.data.members.size() <= 2;
    }

    function isJournalMember(journalId) {
      return request.auth.uid in
        get(/databases/$(database)/documents/sharedJournals/$(journalId)).data.members;
    }

    function onlyUpdatingReactionsOrComments() {
      return request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['reactions', 'comments']);
    }
  }
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
# Follow prompts — add environment variables in dashboard
```

### Netlify

```bash
npm run build
# Drag dist/ folder to netlify.com/drop
# Or: netlify deploy --prod --dir=dist
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🌿 Customization Tips

- **Colors**: Edit CSS variables in the `STYLES` constant (`:root` block)
- **Fonts**: Change the Google Fonts import URL for different typography
- **Moods**: Edit the `MOODS` array to add/remove mood options
- **Reactions**: Edit the `REACTIONS` array

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "firebase": "^10.x"
  }
}
```

No Tailwind needed — all styles are in the component itself for easy portability.

---

## 📝 License

MIT — free to use, modify, and deploy.

---

*Built with intention. For quiet souls who write to understand.*
