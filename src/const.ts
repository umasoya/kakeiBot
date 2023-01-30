// アクセストークン
export const ChannelAccessToken :string = PropertiesService.getScriptProperties().getProperty('channel_access_token')!;
export const ReplyUrl :string = 'https://api.line.me/v2/bot/message/reply';