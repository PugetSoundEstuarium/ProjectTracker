const SHEET_NAMES = {
  team: 'Team',
  projects: 'Projects',
  tasks: 'Tasks',
  updates: 'Updates'
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ImpactFlow Operations Hub')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEET_NAMES.team, [
    'id','name','active','createdAt'
  ], [
    ['tm_1','Hap',true,new Date()],
    ['tm_2','Kylie',true,new Date()],
    ['tm_3','Anthony',true,new Date()]
  ]);

  ensureSheet_(ss, SHEET_NAMES.projects, [
    'id','title','category','status','startDate','endDate','budget','spent','description','owner','createdBy','createdAt','updatedAt'
  ]);

  ensureSheet_(ss, SHEET_NAMES.tasks, [
    'id','projectId','projectTitle','title','assignee','createdBy','status','priority','dueDate','blocker','nextStep','notes','createdAt','updatedAt','completedAt'
  ]);

  ensureSheet_(ss, SHEET_NAMES.updates, [
    'id','projectId','projectTitle','type','message','author','decisionOwner','decisionDueDate','createdAt'
  ]);

  return { ok: true, message: 'Workbook setup complete.' };
}

function seedSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupWorkbook();

  const projectsSheet = ss.getSheetByName(SHEET_NAMES.projects);
  const tasksSheet = ss.getSheetByName(SHEET_NAMES.tasks);
  const updatesSheet = ss.getSheetByName(SHEET_NAMES.updates);

  if (projectsSheet.getLastRow() > 1) {
    return { ok: false, message: 'Seed skipped because data already exists.' };
  }

  const now = new Date();
  const p1 = 'prj_' + new Date().getTime();
  const p2 = 'prj_' + (new Date().getTime() + 1);

  projectsSheet.getRange(2,1,2,13).setValues([
    [p1,'Summer Camps Marketing','Marketing','active','2026-04-01','2026-06-30',0,0,'Marketing push for seasonal camp registrations.','Kylie','Hap',now,now],
    [p2,'Night at the Estuary Gala','Events','active','2026-04-01','2026-05-30',7500,1500,'Fundraising event coordination and promotion.','Hap','Hap',now,now]
  ]);

  tasksSheet.getRange(2,1,4,15).setValues([
    ['tsk_' + (Date.now()+1),p1,'Summer Camps Marketing','Build camp landing page','Kylie','Hap','in_progress','high','2026-04-10','','Homepage link and calendar cleanup needed','',now,now,''],
    ['tsk_' + (Date.now()+2),p1,'Summer Camps Marketing','Draft parent-facing social posts','Kylie','Hap','not_started','medium','2026-04-08','','Write 3 posts with registration links','',now,now,''],
    ['tsk_' + (Date.now()+3),p2,'Night at the Estuary Gala','Confirm sponsor packet language','Hap','Hap','waiting','high','2026-04-07','Awaiting final sponsor benefits confirmation','Revise packet once approved','',now,now,''],
    ['tsk_' + (Date.now()+4),p2,'Night at the Estuary Gala','Finalize actor clue logistics','Anthony','Hap','not_started','medium','2026-04-15','','Schedule planning call','',now,now,'']
  ]);

  updatesSheet.getRange(2,1,3,9).setValues([
    ['upd_' + (Date.now()+1),p1,'Summer Camps Marketing','update','Camp registrations are low. Registration links need stronger placement.','Hap','','',now],
    ['upd_' + (Date.now()+2),p2,'Night at the Estuary Gala','decision','Approve final sponsor packet language.','Kylie','Hap','2026-04-07',now],
    ['upd_' + (Date.now()+3),p2,'Night at the Estuary Gala','announcement','Catering meeting is scheduled for this week.','Hap','','',now]
  ]);

  return { ok: true, message: 'Sample data created.' };
}

function getAppData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupWorkbook();
  return {
    team: getSheetObjects_(ss.getSheetByName(SHEET_NAMES.team)),
    projects: getSheetObjects_(ss.getSheetByName(SHEET_NAMES.projects)),
    tasks: getSheetObjects_(ss.getSheetByName(SHEET_NAMES.tasks)),
    updates: getSheetObjects_(ss.getSheetByName(SHEET_NAMES.updates))
  };
}

function saveProject(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.projects);
  const now = new Date();
  const row = [
    payload.id || ('prj_' + now.getTime()),
    payload.title || '',
    payload.category || '',
    payload.status || 'planning',
    payload.startDate || '',
    payload.endDate || '',
    Number(payload.budget || 0),
    Number(payload.spent || 0),
    payload.description || '',
    payload.owner || '',
    payload.createdBy || '',
    payload.createdAt || now,
    now
  ];
  upsertById_(sheet, row);
  return { ok: true };
}

function saveTask(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.tasks);
  const now = new Date();
  const row = [
    payload.id || ('tsk_' + now.getTime()),
    payload.projectId || '',
    payload.projectTitle || '',
    payload.title || '',
    payload.assignee || '',
    payload.createdBy || '',
    payload.status || 'not_started',
    payload.priority || 'medium',
    payload.dueDate || '',
    payload.blocker || '',
    payload.nextStep || '',
    payload.notes || '',
    payload.createdAt || now,
    now,
    payload.completedAt || ''
  ];
  if (row[6] === 'complete' && !row[14]) row[14] = now;
  upsertById_(sheet, row);
  return { ok: true };
}

function saveUpdate(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.updates);
  const now = new Date();
  const row = [
    payload.id || ('upd_' + now.getTime()),
    payload.projectId || '',
    payload.projectTitle || '',
    payload.type || 'update',
    payload.message || '',
    payload.author || '',
    payload.decisionOwner || '',
    payload.decisionDueDate || '',
    payload.createdAt || now
  ];
  upsertById_(sheet, row);
  return { ok: true };
}

function saveTeamMember(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.team);
  const now = new Date();
  const row = [
    payload.id || ('tm_' + now.getTime()),
    payload.name || '',
    payload.active !== false,
    payload.createdAt || now
  ];
  upsertById_(sheet, row);
  return { ok: true };
}

function archiveTeamMember(id) {
  return setFieldById_(SHEET_NAMES.team, id, 'active', false);
}

function removeRecord(type, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const map = { project: SHEET_NAMES.projects, task: SHEET_NAMES.tasks, update: SHEET_NAMES.updates, team: SHEET_NAMES.team };
  const sheet = ss.getSheetByName(map[type]);
  if (!sheet) throw new Error('Unknown type');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, message: 'Record not found.' };
}

function ensureSheet_(ss, name, headers, seedRows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const currentHeaders = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  const needsHeader = headers.some((h, idx) => currentHeaders[idx] !== h);
  if (needsHeader) {
    sheet.clear();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
  }
  if (seedRows && seedRows.length && sheet.getLastRow() === 1) {
    sheet.getRange(2,1,seedRows.length,headers.length).setValues(seedRows);
  }
}

function getSheetObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = normalizeValue_(r[idx]));
    return obj;
  });
}

function normalizeValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }
  return value;
}

function upsertById_(sheet, row) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == row[0]) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function setFieldById_(sheetName, id, fieldName, fieldValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const fieldIndex = headers.indexOf(fieldName);
  if (fieldIndex === -1) throw new Error('Field not found');
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      sheet.getRange(i + 1, fieldIndex + 1).setValue(fieldValue);
      return { ok: true };
    }
  }
  return { ok: false, message: 'Record not found.' };
}
