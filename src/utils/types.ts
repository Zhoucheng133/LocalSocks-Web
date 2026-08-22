export interface RequestResponse{
  ok: boolean,
  data: any
}

export interface Server{
  id: string,
  name: string,
  username: string,
  password: string | undefined,
  host: string,
  running: boolean,
}