import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { zhCN } from "./contents/zh_cn";
import { zhTW } from "./contents/zh_tw";
import { enUS } from "./contents/en_us";

const resources = {
  zh_CN: {
    translation: zhCN,
  },
  zh_TW: {
    translation: zhTW,
  },
  en_US: {
    translation: enUS,
  },
};

const savedLanguage = localStorage.getItem("language") || "zh_CN";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en_US",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
