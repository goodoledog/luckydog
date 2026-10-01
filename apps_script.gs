// Lucky Dog — Mother Room tracker bridge
//
// Setup steps are in SETUP.md.
//
// GET  returns the current block and every pallet row.
// POST {action: 'complete', taskId, taskName, pallets, staff}
//      appends a row to Task_Log, and for the two "Log ... Date" tasks
//      writes today's date into Last_Root or Last_Prune.
// POST {action: 'setBlock', block} writes This_Week!C1.
//
// After pasting a new version, use Deploy → Manage deployments → edit →
// Version: New version, so the /exec URL keeps working with the new code.

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

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (req.action === 'setBlock') return setBlock(req);
    if (req.action === 'complete') return completeTask(req);
    return json({ ok: false, error: 'Unknown action: ' + req.action });
  } finally {
    lock.releaseLock();
  }
}

function setBlock(req) {
  const block = Number(req.block);
  if (!(block >= 1 && block <= 5)) return json({ ok: false, error: 'Block must be 1 to 5' });
  SpreadsheetApp.getActive().getSheetByName('This_Week').getRange('C1').setValue(block);
  return json({ ok: true, block });
}

function completeTask(req) {
  const ss = SpreadsheetApp.getActive();
  const pallets = (req.pallets || []).map(Number);

  let log = ss.getSheetByName('Task_Log');
  if (!log) {
    log = ss.insertSheet('Task_Log');
    log.appendRow(['Timestamp', 'Staff', 'Task', 'Pallets']);
    log.getRange('A1:D1').setFontWeight('bold');
    log.setFrozenRows(1);
    log.getRange('A:A').setNumberFormat('m/d/yyyy h:mm am/pm');
  }
  log.appendRow([new Date(), String(req.staff || ''), String(req.taskName || req.taskId), pallets.join(', ')]);

  const col = DATE_TASKS[req.taskId];
  if (!col) return json({ ok: true, updated: [], missing: [] });

  const pm = ss.getSheetByName('Pallet_Master');
  const last = pm.getLastRow();
  const nums = last < 2 ? [] : pm.getRange(2, COL.pallet, last - 1, 1).getValues().map(r => Number(r[0]));
  const today = todayInScriptTz();

  const updated = [];
  const missing = [];
  pallets.forEach(p => {
    const idx = nums.indexOf(p);
    if (idx < 0) { missing.push(p); return; }
    pm.getRange(idx + 2, col).setValue(today);
    updated.push(p);
  });

  return json({ ok: true, updated, missing });
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
