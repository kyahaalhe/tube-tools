TubeTools v3 - sari files ek hi level par hain (koi folder nahi).

1) Zip ki SARI files GitHub repo ki root par upload karein (index.html ke barabar). Purani files overwrite ho jayengi.
   Repo se ye purani files delete karein (agar maujood hon): script.js, dev-server.js, api/ folder, netlify/ folder, netlify.toml
2) Vercel > Settings > Environment Variables:
   YOUTUBE_API_KEY            (zaroori)
   YOUTUBE_API_KEY_2          (optional backup key, SAME Google Cloud project ki; sirf kharab key par switch hoti hai)
   FEEDBACK_WEBHOOK_URL       (optional: Tubi ka feedback Discord/Slack mein bhejne ke liye; warna Vercel > Logs mein "[FEEDBACK]" dikhega)
   Phir Redeploy.
3) Test: /api/youtube?mode=status

Google Search Console:
- Agar site pehle se verified hai: index.html mein PASTE_YOUR_GOOGLE_VERIFICATION_CODE_HERE ki jagah apna purana code daalein.
  Agar verification HTML file se hui thi (google....html), file ka naam bata dein, route add karna padega.
- Sitemap: https://tube-tools.vercel.app/sitemap.xml
