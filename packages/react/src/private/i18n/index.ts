import AppContext from "#context/app";
import locale_store from "#i18n/locale";
import resolve from "@primate/i18n/resolve";
import type Dictionary from "@rcompat/record/Dictionary";
import { useContext } from "react";

export default (key: string, placeholders: Dictionary<string>) => {
  locale_store.init();
  const { locales, locale } = useContext(AppContext).context.i18n;
  return resolve(locales[locale], key, placeholders);
};
