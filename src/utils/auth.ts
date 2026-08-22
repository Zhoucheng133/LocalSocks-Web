import axios, { type AxiosRequestConfig } from "axios";
import type { RequestResponse } from "./types";
import type { NavigateFunction } from "react-router";
import { requestWithToken, store, tokenAtom } from "./requests";

export async function initFunc(navigate: NavigateFunction){
  const initResponse=(await axios.get('/api/init')).data as RequestResponse;
  if(initResponse.data === true){
    navigate('/register', { replace: true })
    return;
  }
  const localToken=localStorage.getItem("token");
  if(!localToken){
    navigate('/login', { replace: true });
    return;
  }
  store.set(tokenAtom, localToken);
  const authOk=await requestWithToken({
    method: "GET",
    url: "/api/auth",
  } as AxiosRequestConfig)
  
  if(authOk.ok){
    navigate("/", {replace: true});
  }else{
    navigate("/login", {replace: true});
  }
}