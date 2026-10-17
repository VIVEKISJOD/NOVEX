# Hindi StoryVerse — setup (Android, no coding)

Files: index.html, style.css, app.js, manifest.json (website) · worker.js (backend) · README.md

## 1. Put the website on GitHub Pages
1. Open https://github.com/signup (or sign in) in Chrome.
2. Tap **+ → New repository**. Name: `storyverse`. Choose **Public**. Tap **Create repository**.
3. Tap **uploading an existing file**. Choose index.html, style.css, app.js, manifest.json (unzip the ZIP first with the Files app). Do NOT upload worker.js with any key in it (it has none, so it is safe either way). Tap **Commit changes**.
4. **Settings → Pages → Build and deployment → Branch: main, folder /(root) → Save**.
5. After ~1 minute your site is `https://YOURNAME.github.io/storyverse/`. Your ALLOWED_ORIGIN is only `https://YOURNAME.github.io` (no path, no slash at the end).

## 2. Free Gemini key
Open https://aistudio.google.com/apikey → **Create API key**. Never paste it in GitHub or in the website. Free-tier limits and model names change; check https://ai.google.dev/gemini-api/docs/pricing. The app uses `gemini-2.5-flash` by default; you can change it with the `GEMINI_MODEL` variable.

## 3. Backend on Cloudflare (free plan)
1. Sign up at https://dash.cloudflare.com/sign-up (no card needed for Workers Free).
2. **Workers & Pages → Create → Create Worker → Deploy**, then **Edit code**. Delete everything, paste all of worker.js, **Deploy**.
3. Worker **Settings → Variables and Secrets → Add**:
   - Type **Secret**, name `GEMINI_API_KEY`, value = your key.
   - Type **Text**, name `ALLOWED_ORIGIN`, value = `https://YOURNAME.github.io`.
   - Optional Text `GEMINI_MODEL`.
4. Optional images: **Settings → Bindings → Add → Workers AI**, variable name `AI`. Image model `flux-1-schnell` must be available on your account and has a daily free allowance (see https://developers.cloudflare.com/workers-ai/platform/pricing/). If not, skip it; everything else works.
5. Copy the Worker URL (`https://xxx.workers.dev`).

## 4. Connect
Open your site → **Settings** → paste the Worker URL → **Check backend**. It should say Gemini key: set.

## 5. Use
Library → add chapter (or **Add sample**) → Editor → **Translate pending parts** → edit the Hindi if you like → Player → Play. In Settings press **Prepare images** to match images (and generate, if enabled). Upload your own pictures in **Images** with tags like `forest, night, castle`; they get reused automatically.

## Test the image fallback
Upload 2 images tagged `forest, dark` → add the sample chapter → Player → Play: the forest scene shows your image labeled "matched by tags". Turn off Wi-Fi and reload: images and narration still work. In Settings, with image generation off or backend unreachable, scenes without a match show "approximate fallback" or the built-in placeholder; narration never stops.

## Android Hindi voice
If the Player says no Hindi voice: Settings → System → Languages → Text-to-speech output → Google Text-to-speech → ⚙ → Install voice data → Hindi.

## Limits and honesty
- The Worker's rate limit is per instance only; anyone who knows your Worker URL could try it, but only requests from your ALLOWED_ORIGIN browser origin are accepted (a determined person can fake that). Keep the URL private; if abused, rotate the key.
- Pause stops and resumes from the start of the current sentence (Android browsers pause unreliably). Background playback depends on Chrome; locking the screen may interrupt speech.
- Backup JSON contains text, scenes and image info, not image files; save images from the Images tab.
- Scene analysis is keyword-based and local, not AI.
- Troubleshooting: "Cannot reach backend" → URL wrong or ALLOWED_ORIGIN has a typo/trailing slash. "Key missing/invalid" → re-add GEMINI_API_KEY and Deploy.
