export interface IPubSubMessage<TPayload = unknown> {
  type: 'video-script-request';
  payload: TPayload;
}

export interface IVideoScriptRequestPayload {
  scriptId: string;
}
