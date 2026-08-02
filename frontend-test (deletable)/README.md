# Frontend Test Interface

A standalone web interface to test all backend API endpoints.

## What's included

- **index.html** — Main page structure
- **styles.css** — Modern, clean UI styling
- **app.js** — All the frontend logic (API calls, UI updates)
- **config.js** — Backend API URL (change if needed)

## How to use

### 1. Start the backend

In the main project folder:
```bash
cd /root/cloud-file-dashboard
npm start
```

The backend runs on `http://localhost:3000` by default.

### 2. Open the frontend

**Option A: From Windows (if using WSL)**
- Navigate to `\\wsl$\Ubuntu\root\cloud-file-dashboard\frontend-test\index.html`
- Double-click to open in your browser

**Option B: Direct open**
- Open `index.html` in any modern browser (Chrome, Firefox, Edge)

### 3. Test the features

**Provider selection**
- The top row shows Google, Dropbox, and OneDrive
- Green checkmark = connected, red X = not configured
- Click a connected provider to select it

**List & filter files**
- Once a provider is selected, files load automatically
- Use the "File type" dropdown to filter (all/images/videos/audio/documents)
- Use the "Sort" dropdown to change order (newest/oldest first)

**Upload a file**
- Click or drag a file into the upload zone
- Click "Upload" — the file goes to the selected provider
- Supports any file type (images, videos, PDFs, etc.)

**View a file**
- Click any file card to open/download it in a new tab

**Rename a file**
- Click "Rename" on a file card
- Enter the new name in the modal
- Press Enter or click "Save"

**Delete a file**
- Click "Delete" on a file card
- Confirm the deletion

## Configuration

If your backend runs on a different port or host, edit `config.js`:

```javascript
const API_BASE = "http://localhost:3000/api";
```

## Notes

- This frontend is **completely separate** from the backend — it only talks to it via API calls
- All data comes from your MongoDB database through the Express API
- You can delete this entire `frontend-test/` folder when you're done testing — it won't affect the backend at all
- The backend must be running for this to work (CORS is enabled so browsers can call it)

## Troubleshooting

**"Backend offline"** at the top?
- Make sure the backend is running (`npm start` in the main folder)
- Check that `config.js` has the correct API URL

**Providers show "Not connected"?**
- Run `npm run seed` in the main folder to store credentials from `.env` into MongoDB

**Files don't load?**
- Check the browser console (F12) for errors
- Verify the provider's refresh token is valid (expired tokens cause 400/401 errors)
