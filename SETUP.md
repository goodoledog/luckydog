# Mother Room Task Tracker — setup

The tracker (`lucky_dog_tasks.html`) reads and writes the **Lucky Dog Mother Room** Google Sheet
through a small Apps Script (`apps_script.gs`) attached to that sheet. No API key is needed, and the
sheet can stay private.

## One-time setup

1. Open the **Lucky Dog Mother Room** sheet in Google Drive.
2. **Extensions → Apps Script.** Delete everything in `Code.gs`, paste in all of `apps_script.gs`, and click Save.
3. **Deploy → New deployment.** Click the gear and pick **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and approve access. Google warns about unverified apps; click
   **Advanced → Go to (project name)**. This is normal for your own script.
5. Copy the **Web app URL** (it ends in `/exec`).
6. Open `lucky_dog_tasks.html` on your phone, paste the URL, enter your name, and tap **Connect & Start**.

Anyone with the `/exec` URL can read the pallet dates and log tasks, so share it only with the crew.

## What it does with the sheet

| Tracker action | Sheet change |
|---|---|
| Opens or taps **Sync** | Reads `This_Week!C1` (block) and every row of `Pallet_Master` |
| Taps a block number (1 to 5) | Writes that number to `This_Week!C1` |
| Ticks any task | Adds a row to `Task_Log` (created on first use): time, staff, task, pallets |
| Ticks **Log Last_Root Date** | Also writes today's date to `Last_Root` for each pallet in the block |
| Ticks **Log Last_Prune Date** | Also writes today's date to `Last_Prune` for each pallet in the prune block |

Pallets are matched by the number in column A, so you can add, remove, or re-sort rows freely.

## Updating the script later

After pasting a new version of `apps_script.gs`, go to **Deploy → Manage deployments**, click the
pencil, set **Version** to **New version**, and click Deploy. The URL stays the same. A *new*
deployment would give a new URL that each phone would need to re-enter.

## Troubleshooting

- **"Sync failed — check Web App URL"**: the URL is wrong, or the deployment's access isn't set to *Anyone*.
- **"Write failed"**: usually the script was edited without deploying a new version (see above).
- **Changing the URL**: Settings → Change Settings.
