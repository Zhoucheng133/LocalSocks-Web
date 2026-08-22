import axios, { type AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import type { RequestResponse } from "../utils/types";
import { requestWithToken, store, tokenAtom } from "../utils/requests";
import { useNavigate } from "react-router";

export default function AuthProvider({ children } : {children: React.ReactNode}){
  const [loading,setLoading] = useState(true)
  const navigate = useNavigate()

  const initFunc=async ()=>{
    const initResponse=(await axios.get('/api/init')).data as RequestResponse;
    if(initResponse.data === true){
      navigate('/register', { replace: true })
      setLoading(false);
      return;
    }
    const localToken=localStorage.getItem("token");
    if(!localToken){
      navigate('/login', { replace: true });
      setLoading(false);
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
    setLoading(false);
  }

  useEffect(()=>{
    initFunc()
  }, [])

  if(loading){
    return <div></div>
  }
  return children
  
}