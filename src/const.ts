// アクセストークン
export const ChannelAccessToken: string = PropertiesService.getScriptProperties().getProperty('channel_access_token')!;
// リプライURL
export const ReplyUrl: string = 'https://api.line.me/v2/bot/message/reply';
// 認証ユーザー
export const AuthenticatedUsers: string[] = [
  // yasuto
  PropertiesService.getScriptProperties().getProperty('user_id_yasuto')!,
];
