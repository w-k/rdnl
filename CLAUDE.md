# Visual inspection

After making UI changes, take a screenshot of the running app to verify the result.

Start the dev server in the background:
```
npx vite --port 5199
```

Take a screenshot with Playwright:
```
npx playwright screenshot --browser chromium --viewport-size 1200,900 http://localhost:5199 /tmp/rdnl-screenshot.png
```

If Playwright browsers are not installed, run `npx playwright install chromium` first.
