// アクセストークン
export const ChannelAccessToken: string = PropertiesService.getScriptProperties().getProperty('channel_access_token')!;
// リプライURL
export const ReplyUrl: string = 'https://api.line.me/v2/bot/message/reply';
// 認証ユーザー
export const AuthenticatedUsers: string[] = [
  // yasuto
  PropertiesService.getScriptProperties().getProperty('user_id_yasuto')!,
  // miko
  PropertiesService.getScriptProperties().getProperty('user_id_miko')!,
];
// ヘルプメッセージ
export const helpMessage = `特定のフォーマットで発言することで、家計簿を更新できます。
例)
2023/01/01
食材費 4000
日用品 1500

1行目に更新対象日を指定できます。
省略した場合は発言した日が対象日になります。
上の例では、2023/01/01の食材費に4000円、日用品に1500円を加算します。
数値部分にはマイナス値を入れることも可能です。

使用できる項目は以下の通り。
- 食材費
- 外食費
- 日用品
- 家賃
- 水道代
- 電気代
- ガス代
- 通信費
- 貯金
`;
