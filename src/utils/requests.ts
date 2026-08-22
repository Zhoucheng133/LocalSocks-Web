import axios, { type AxiosRequestConfig } from "axios";
import type { RequestResponse } from "./types";
import { atom, getDefaultStore } from "jotai";

export const store = getDefaultStore();
export const refreshLockAtom = atom<Promise<any> | null>(null);

export const tokenAtom = atom("")

export async function requestWithToken(request: AxiosRequestConfig): Promise<RequestResponse>{

  const requestData = (await axios({
    ...request,
    headers: {
      ...request.headers,
      token: store.get(tokenAtom)
    }
  })).data as RequestResponse;

  if(!requestData.ok && (requestData.data as string).includes("expired")){
    let refreshLock=store.get(refreshLockAtom);

    if(refreshLock!=null){
      await refreshLock;
    }else{
      const promise=axios.get("/api/refresh");
      store.set(refreshLockAtom, promise)
      try {
        const tokenResponse = (await promise).data as RequestResponse;
        if(tokenResponse.ok){
          store.set(tokenAtom,tokenResponse.data);
        }
      } finally {
        store.set(refreshLockAtom, null);
      }
    }
    const retryRequest = {
      ...request,
      headers: {
        ...request.headers,
        token: store.get(tokenAtom)
      }
    };

    return (await axios(retryRequest)).data as RequestResponse;
  }
  return requestData;
}