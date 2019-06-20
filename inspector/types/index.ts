export const PAGE_SIZE: number = 10;

export type ErrorObject = {
  error: string
  code: string
}

export type InspectorContract = {
  island: string;
  skipper: string;
}

export type InspectedAnchor = {
  height: string;
  hash: string;
  valid: boolean;
  offsetID: string;
}