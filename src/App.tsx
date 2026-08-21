import { Route, Routes } from 'react-router'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import { useEffect } from 'react'

export default function App() {

  function toggleDark(dark: boolean){
    const html = document.documentElement; 
    html.classList.toggle("dark", dark);
  }

  function syncDarkMode(){
    const dark=localStorage.getItem("dark");
    if(dark){
      const darkMode=dark=='true';
      toggleDark(darkMode);
    }else{
      const isDark = window.matchMedia( "(prefers-color-scheme: dark)" ).matches;
      toggleDark(isDark);
    }
  }

  useEffect(()=>{
    syncDarkMode();
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handler = () => {
      syncDarkMode();
    };
    media.addEventListener(
      "change",
      handler
    );
    return () => {
      media.removeEventListener(
        "change",
        handler
      );
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
