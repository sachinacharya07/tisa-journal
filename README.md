# TISA Journal 🌿

**Track. Improve. Study. Ace.**

TISA Journal is a premium, minimalist, and glassmorphic journaling sanctuary designed for personal reflection and shared growth. Built with React, Tailwind CSS, and Firebase, it offers a distraction-free environment to capture your thoughts, lyrics, and timeless memories.

## ✨ Key Features

### 🧘 Distraction-Free Writing
- **Sleek Editor**: A clean canvas that focuses entirely on your words.
- **Floating Action Menu**: Mood selection, tags, and formatting tools are tucked away in a minimalistic "✨ Options" toggle.
- **Digital Signature**: Every entry features a beautiful, handwritten-style signature at the bottom.

### 📚 Creative Sections
- **Personal Journal**: Your private sanctuary for daily reflections.
- **Songbook (Lyrics)**: A dedicated space for musicians and poets to capture verses and choruses.
- **Vintage Pages**: Write on simulated aged paper for a timeless feel.
- **The Archive**: A powerful hub to view, sort, and search all your entries across all sections.

### 🤝 Shared Journal V2
- **Multi-User Collaboration**: Create a shared space and invite multiple partners via a unique code.
- **Creator Controls**: The journal creator can manage members and remove users at any time.
- **Real-Time Sync**: Read and react to your partner's entries as they happen.

### 🛠️ Advanced Management
- **Recycle Bin**: Soft-delete entries with the ability to restore them or permanently erase them.
- **Favorites & Pinning**: Keep your most important reflections at the top or in a dedicated favorites tab.
- **Export Options**: Download individual entries as `.txt` or `.pdf` files. Export your entire journal as `.json` or `.txt`.

### 🎨 Premium Aesthetics
- **Glassmorphism**: A modern, translucent UI that feels light and airy.
- **Custom Themes**: Choose from "Ivory", "Nude", "Oat Milk", "Clay Wash", "Onyx", and "OLED Black".
- **Fluid Typography**: Adjustable font sizes and beautiful serif typefaces.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tisa-journal.git
   cd tisa-journal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Google Sign-In and Email/Password).
   - Create a **Firestore Database**.
   - Copy your Firebase configuration and create a `firebase-applet-config.json` in the root directory:
     ```json
     {
       "apiKey": "YOUR_API_KEY",
       "authDomain": "YOUR_AUTH_DOMAIN",
       "projectId": "YOUR_PROJECT_ID",
       "storageBucket": "YOUR_STORAGE_BUCKET",
       "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
       "appId": "YOUR_APP_ID",
       "firestoreDatabaseId": "(default)"
     }
     ```

4. **Deploy Security Rules**:
   - Copy the contents of `firestore.rules` to the "Rules" tab of your Firestore database in the Firebase Console.

5. **Run the app**:
   ```bash
   npm run dev
   ```

## 📱 PWA Support
TISA Journal is a Progressive Web App. You can install it on your Desktop (Chrome/Edge/Safari) or iOS/Android device for a native-like experience.

## 🔒 Security
Your data is protected by Firebase Security Rules, ensuring that your private journal remains private and shared journals are only accessible to authorized members.

---

© 2026 Sachin Bhattacharya. All rights reserved.
