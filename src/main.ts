import dayjs = require('dayjs');
import ja = require('dayjs/locale/ja');
import customParseFormat = require('dayjs/plugin/customParseFormat');
import { logging } from './logging';
import { EventData } from './interface';
import { ChannelAccessToken, ReplyUrl } from './const';
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

// 操作対象のシートを取得
const getTargetSheet = (): GoogleAppsScript.Spreadsheet.Sheet => {
  const id: string = PropertiesService.getScriptProperties().getProperty('spread_sheet_id')!;
  const spreadSheet: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.openById(id);
  const now: Date = new Date();
  // デフォルトは当月、入力があればその月のシート
  const sheet: GoogleAppsScript.Spreadsheet.Sheet = spreadSheet.getSheetByName(
    `${now.getFullYear()}${now.getMonth()}`,
  )!;

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

/**
 * POSTの受信処理
 *
 * @param e - POST Data
 */
export const doPost = (e: any) => {
  const eventData: EventData = JSON.parse(e.postData.contents).events[0];
  // ロギング
  logging(e);

  try {
    // ユーザー認証
    userAuthentication(eventData.source.userId);

    // メッセージ
    const message: string = eventData.message.text;

    // 対象日を取得
    const [targetDate, rows]: [dayjs.Dayjs, string[]] = getTargetDate(message);

    const sheet: GoogleAppsScript.Spreadsheet.Sheet = getTargetSheet();

    // @debug オウム返し
    reply(eventData, eventData.message.text);
  } catch (err: any) {
    reply(eventData, err.message);
  }
};
