const SHEET_NAME = 'Projects';

function doGet(e) {
  e = e || {};
  e.parameter = e.parameter || {};

  const action = e.parameter.action || 'list';
  const callback = e.parameter.callback || '';
  let result;

  if (action === 'list') {
    result = listProjects();
  } else if (action === 'get') {
    result = getProject(e.parameter.id);
  } else {
    result = { ok: false, message: 'Action không hợp lệ' };
  }

  return jsonResponse(result, callback);
}

function doPost(e) {
  try {
    e = e || {};
    e.postData = e.postData || {};

    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || 'save';

    if (action === 'save') {
      return jsonResponse(saveProject(body.project));
    }

    if (action === 'delete') {
      return jsonResponse(deleteProject(body.id));
    }

    return jsonResponse({ ok: false, message: 'Action không hợp lệ' });
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'ID', 'Ngày cập nhật', 'Mã CT', 'Tên công trình', 'Khách hàng',
      'SĐT', 'Trạng thái', 'Tổng tiền', 'Đã thanh toán', 'Còn lại', 'JSON'
    ]);
  }

  return sheet;
}

function listProjects() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return { ok: true, projects: [] };

  const projects = values.slice(1).map(row => ({
    id: row[0],
    updatedAt: row[1],
    code: row[2],
    name: row[3],
    customer: row[4],
    contact: row[5],
    status: row[6],
    total: row[7],
    paid: row[8],
    remain: row[9]
  })).filter(p => p.id);

  return { ok: true, projects };
}

function getProject(id) {
  if (!id) return { ok: false, message: 'Thiếu ID dự án' };

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return { ok: true, project: JSON.parse(values[i][10]) };
    }
  }

  return { ok: false, message: 'Không tìm thấy dự án' };
}

function saveProject(project) {
  if (!project) return { ok: false, message: 'Thiếu dữ liệu dự án' };

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  const id = project.cloudId || project.id || createId();
  project.cloudId = id;
  project.id = id;

  const summary = extractSummary(project);
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  const rowData = [
    id,
    now,
    summary.code,
    summary.name,
    summary.customer,
    summary.contact,
    summary.status,
    summary.total,
    summary.paid,
    summary.remain,
    JSON.stringify(project)
  ];

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { ok: true, id, message: 'Đã lưu dự án' };
}

function deleteProject(id) {
  if (!id) return { ok: false, message: 'Thiếu ID dự án' };

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok: true, message: 'Đã xóa dự án' };
    }
  }

  return { ok: false, message: 'Không tìm thấy dự án' };
}

function extractSummary(project) {
  const p = project.project || {};
  const totals = project.totals || calculateTotalsFromProject(project);

  return {
    code: p.code || '',
    name: p.name || '',
    customer: p.customer || '',
    contact: p.contact || '',
    status: p.status || '',
    total: totals.grand || totals.total || 0,
    paid: totals.paid || 0,
    remain: totals.remain || 0
  };
}

function calculateTotalsFromProject(project) {
  const groups = Array.isArray(project.groups) ? project.groups : [];
  const payments = Array.isArray(project.payments) ? project.payments : [];
  const finance = project.finance || {};
  let subtotal = 0;

  groups.forEach(group => {
    const unitPrice = toNumber(group.unitPrice);
    const lines = Array.isArray(group.lines) ? group.lines : [];
    let groupBase = 0;

    lines.forEach(line => {
      const type = line.type || 'normal';
      if (type === 'nocharge') return;

      const len = toNumber(line.len);
      const wid = toNumber(line.wid);
      const factor = toNumber(line.factor) || 1;
      let qty = group.unit === 'm²' ? len * wid * factor : len * factor;

      if (type === 'deduct') qty = -Math.abs(qty);
      groupBase += qty * unitPrice;
    });

    groupBase += groupBase * toNumber(group.wastePercent) / 100;
    groupBase -= groupBase * toNumber(group.deductPercent) / 100;
    groupBase += toNumber(group.surcharge);
    groupBase -= toNumber(group.discount);

    const groupVat = toNumber(group.vatRate);
    if (groupVat > 0) groupBase += groupBase * groupVat / 100;

    subtotal += groupBase;
  });

  const transport = toNumber(finance.transportFee);
  const extra = toNumber(finance.extraFee);
  const discountValue = toNumber(finance.discountValue);
  const discount = finance.discountType === 'percent'
    ? (subtotal + transport + extra) * discountValue / 100
    : discountValue;

  const beforeVat = subtotal + transport + extra - discount;
  const vat = beforeVat * toNumber(finance.vatRate) / 100;
  let grand = beforeVat + vat;

  const rounding = toNumber(finance.rounding);
  if (rounding > 0) grand = Math.round(grand / rounding) * rounding;

  const paid = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const remain = grand - paid;

  return { total: grand, grand, paid, remain };
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  let s = String(value).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, '');
  const hasComma = s.indexOf(',') > -1;
  const hasDot = s.indexOf('.') > -1;

  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasComma && !hasDot) s = s.replace(',', '.');
  else s = s.replace(/\.(?=\d{3}(\D|$))/g, '');

  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function createId() {
  return 'P' + new Date().getTime() + '_' + Math.random().toString(36).slice(2, 8);
}

function jsonResponse(data, callback) {
  const json = JSON.stringify(data);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
