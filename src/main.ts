import dayjs = require('dayjs');
import ja = require('dayjs/locale/ja');
import customParseFormat = require('dayjs/plugin/customParseFormat');
import { logging } from './logging';
import { EventData } from './interface';
import {
  ChannelAccessToken,
  HelpMessage,
  ReplyUrl,
  Separator,
} from './const';
import { userAuthentication } from './auth';

dayjs.locale(ja);
dayjs.extend(customParseFormat);

/**
 * Return Line Reply
 *
 * @param eventData - Line Messaging Api EventData
 * @param message  - Reply Message
 */
const reply = (eventData: EventData, message: string) => {
  const { replyToken } = eventData;
  const payload: any = {
    replyToken,
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer  ${ChannelAccessToken}`,
    },
    method: 'post',
    payload: JSON.stringify(payload),
  };
  UrlFetchApp.fetch(ReplyUrl, options);
};

/**
 *  Get target sheet from date.
 *
 * @param dayjs- target date
 * @returns Target sheet.
 */
const getTargetSheet = (date: dayjs.Dayjs): GoogleAppsScript.Spreadsheet.Sheet => {
  const id: string = PropertiesService.getScriptProperties().getProperty('spread_sheet_id')!;
  const spreadSheet: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.openById(id);
  const sheet: GoogleAppsScript.Spreadsheet.Sheet | null = spreadSheet.getSheetByName(
    `${date.format('YYYYMM')}`,
  );

  if (sheet === null) {
    throw new Error(`Target sheet is not exists. [${date.year()}${date.month() + 1}]`);
  }

  return sheet;
};

/**
 * Get target date from text
 * If arg is not date format, return today.
 *
 * @param string - text
 * @returns dayjs object and string array.
 */
const getTargetDate = (text: string): [dayjs.Dayjs, string[]] => {
  const textArr: string[] = text.split(/\r\n|\n/);
  if (textArr[0].match(/(\d{4})\/(\d{2})\/(\d{2})/)) {
    return [dayjs(textArr.shift()), textArr];
  }
  return [dayjs(), textArr];
};

const findRow = (date: dayjs.Dayjs, sheet: GoogleAppsScript.Spreadsheet.Sheet): number => {
  const dateStr: string = date.format('MM月DD日');
  for (let i = 3; i <= sheet.getRange(3, 2, 31).getNumRows(); i++) {
    if (sheet.getRange(i, 2).getDisplayValue() === dateStr) {
      return i;
    }
  }
  throw new Error('Cannot find target row.');
};

/**
 *
 * @param sheet - Target sheet.
 * @param rows  - Items. 'ex. 日用品 1500'
 */
const writeItems = (
  date: dayjs.Dayjs,
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  lines: string[],
) => {
  const typeList: string[] = [
    '食材費', // col: 3
    '外食費', // col: 4
    '日用品', // col: 5
    '家賃代', // col: 6
    '水道代', // col: 7
    '電気代', // col: 8
    'ガス代', // col: 9
    '通信費', // col: 10
    '貯金', // col: 11
  ];
  const row: number = findRow(date, sheet); // target row number

  // eslint-disable-next-line
  for (const line of lines) {
    const arr: string[] = line.split(/\s+/, 2);
    // invalid type
    if (!typeList.includes(arr[0])) {
      throw new Error(`unknown type.[${arr[0]}]`);
    }
    // non-numeric
    if (!arr[1].match(/-?\d+/)) {
      throw new Error(`invalid value.[${arr[1]}]`);
    }
    const type: string = arr[0];
    const value: number = Number(arr[1]);
    let col: number;

    switch (type) {
      case '食材費':
        col = 3;
        break;
      case '外食費':
        col = 4;
        break;
      case '日用品':
        col = 5;
        break;
      case '家賃代':
        col = 6;
        break;
      case '水道代':
        col = 7;
        break;
      case '電気代':
        col = 8;
        break;
      case 'ガス代':
        col = 9;
        break;
      case '通信費':
        col = 10;
        break;
      case '貯金':
        col = 11;
        break;
      default:
        throw new Error(`failed type parse.[${type}]`);
        break;
    }
    // write to cell
    const cell = sheet.getRange(row, col);
    const formula = cell.getFormula();

    // if empty
    if (formula === '=0' || formula === '') {
      cell.setFormula(`=${value}`);
      continue;
    }

    // not empty
    if (value < 0) {
      cell.setFormula(`${formula}${value}`);
      continue;
    }

    cell.setFormula(`${formula}+${value}`);
  }
};

/**
 * Get summary data text
 *
 * @param sheet - target sheet
 */
const getSummaryText = (
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  targetDate: dayjs.Dayjs,
): string => {
  const summaries: string[] = [];

  // target YYYY/MM
  summaries.push(`${targetDate.format('YYYY/MM')}`);

  // separator
  summaries.push(Separator);

  // item summary
  for (let col = 3; col < 13; col += 1) {
    let type: string;
    switch (col) {
      case 3:
        type = '食材費';
        break;
      case 4:
        type = '外食費';
        break;
      case 5:
        type = '日用品';
        break;
      case 6:
        type = '家賃   ';
        break;
      case 7:
        type = '水道代';
        break;
      case 8:
        type = '電気代';
        break;
      case 9:
        type = 'ガス代';
        break;
      case 10:
        type = '通信費';
        break;
      case 11:
        type = '貯金   ';
        break;
      default:
        type = '合計   ';
        break;
    }
    // separator
    if (col === 12) summaries.push(Separator);
    summaries.push(`${type}: ${sheet.getRange(34, col).getDisplayValue()}`);
  }

  // remaining money
  summaries.push(`今月の残金: ${sheet.getRange(22, 16).getDisplayValue()}`);

  return summaries.join('\n');
};

/**
 *  If message is 'help', return help text.
 * @param message - userMessage
 */
const checkHelp = (message: string) :string => {
  if (
    (message.match(/[a-zA-Z]{4}/) && message.toLowerCase() === 'help')
    || message === 'へるぷ'
    || message === 'ヘルプ'
  ) {
    return HelpMessage;
  }
  return '';
};

/**
 * Receive HTTP POST
 *
 * @param e - POST Data
 */
export const doPost = (e: GoogleAppsScript.Events.DoPost) => {
  const eventData: EventData = JSON.parse(e.postData.contents).events[0];
  // logging
  logging(e);

  try {
    // User authentication
    userAuthentication(eventData.source.userId);

    // message from user
    const message: string = eventData.message.text;

    const help: string = checkHelp(message);
    if (help) {
      reply(eventData, help);
      return;
    }

    // Get target YYYY/MM/DD
    const [targetDate, rows]: [dayjs.Dayjs, string[]] = getTargetDate(message);

    // Get target sheet from targetDay.
    const sheet: GoogleAppsScript.Spreadsheet.Sheet = getTargetSheet(targetDate);

    // Write items to sheet.
    writeItems(targetDate, sheet, rows);

    // Get summary text
    const summary: string = getSummaryText(sheet, targetDate);

    reply(eventData, summary);
  } catch (err: any) {
    reply(eventData, err.message);
  }
};
