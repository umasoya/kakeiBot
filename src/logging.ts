// デバッグ用シートに書き込み
export const logging = (e: any) => {
  const sheetID = '1wfEk7bHM-qGnhdkhuWCnNsbAsse81DEEUybTdSfan-o';
  const sheet = SpreadsheetApp.openById(sheetID).getSheets()[0];

  sheet.getRange('1:1').insertCells(SpreadsheetApp.Dimension.ROWS);
  sheet.getRange(1, 1).setValue(new Date().toLocaleString('ja-JP')); // timestamp
  sheet.getRange(1, 2).setValue(e); // GET data
  sheet.getRange(1, 3).setValue(e.postData.contents); // POST data

  const output = ContentService.createTextOutput(JSON.stringify({ result: 'Ok' }));
  output.setMimeType(ContentService.MimeType.JSON);
};
