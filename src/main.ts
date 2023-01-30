import { debug } from "./debug";
import { EventData } from "./interface"
import { ChannelAccessToken, ReplyUrl } from './const';

// POSTの受信処理
export const doPost = (e: any) => {
    const eventData: EventData = JSON.parse(e.postData.contents).events[0];

    debug(e);

    reply(eventData);
};

export const reply = (eventData: EventData) => {
    const replyToken: string = eventData.replyToken;
    const userMessage: string = eventData.message.text;
    const payload :any = {
        'replyToken': replyToken,
        'messages': [
            {
                'type': 'text',
                'text': userMessage,
            }
        ],
    };
    const options :GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        'headers': {
            'Content-Type': 'application/json',
            "Authorization": `Bearer  ${ChannelAccessToken}`,
        },
        'method': 'post',
        'payload': JSON.stringify(payload),
    };
    UrlFetchApp.fetch(ReplyUrl, options);
};