export interface EventData {
  type: string
  message: {
    type: string
    id: string
    text: string
  }
  timestamp: number
  source: {
    type: string
    userId: string
  }
  replyToken: string
  mode: string
}
