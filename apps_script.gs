// Lucky Dog — Mother Room tracker bridge
//
// Paste this into the "Lucky Dog Mother Room" sheet:
//   Extensions → Apps Script → replace Code.gs with this file → Save
//   Deploy → New deployment → type "Web app"
//     Execute as: Me
//     Who has access: Anyone
//   Copy the Web app URL (ends in /exec) into the tracker's setup screen.
//
// GET  returns the current block and every pallet row.
// POST {taskId, pallets} writes today's date into Last_Root or Last_Prune.

const TZ = Session.getScriptTimeZone();

// Pallet_Master columns (1-based)
const COL = { pallet: 1, block: 2, room: 3, lastRoot: 4, lastSurface: 5, lastPrune: 6, lastSalt: 7, daysSinceSalt: 8 };

// Tracker task → column it stamps with today's date
const DATE_TASKS = { root_log: COL.lastRoot, prune_log: COL.lastPrune };

function doGet() {
  const ss = SpreadsheetApp.getActive();
  const block = Number(ss.getSheetByName('This_Week').getRange('C1').getValue()) || 1;

  const pm = ss.getSheetByName('Pallet_Master');
  const last = pm.getLastRow();
  const rows = last < 2 ? [] : pm.getRange(2, 1, last - 1, 8).getValues();

  const pallets = rows
    .filter(r => r[0] !== '')
    .map(r => ({
      num:           Number(r[COL.pallet - 1]),
      block:         Number(r[COL.block - 1]),
      room:          String(r[COL.room - 1]),
      lastRoot:      fmtDate(r[COL.lastRoot - 1]),
      lastSurface:   fmtDate(r[COL.lastSurface - 1]),
      lastPrune:     fmtDate(r[COL.lastPrune - 1]),
      lastSalt:      fmtDate(r[COL.lastSalt - 1]),
      daysSinceSalt: r[COL.daysSinceSalt - 1] === '' ? null : Number(r[COL.daysSinceSalt - 1]),
    }));

  return json({ ok: true, block, pallets });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Bad request' });
  }

  const col = DATE_TASKS[req.taskId];
  if (!col) return json({ ok: false, error: 'Unknown task: ' + req.taskId });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pm = SpreadsheetApp.getActive().getSheetByName('Pallet_Master');
    const last = pm.getLastRow();
    const nums = last < 2 ? [] : pm.getRange(2, COL.pallet, last - 1, 1).getValues().map(r => Number(r[0]));
    const today = todayInScriptTz();

    const updated = [];
    const missing = [];
    (req.pallets || []).forEach(p => {
      const idx = nums.indexOf(Number(p));
      if (idx < 0) { missing.push(p); return; }
      pm.getRange(idx + 2, col).setValue(today);
      updated.push(Number(p));
    });

    return json({ ok: true, updated, missing });
  } finally {
    lock.releaseLock();
  }
}

function fmtDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'M/d/yyyy');
  return v === '' ? '' : String(v);
}

function todayInScriptTz() {
  const [y, m, d] = Utilities.formatDate(new Date(), TZ, 'yyyy-M-d').split('-').map(Number);
  return new Date(y, m - 1, d);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
