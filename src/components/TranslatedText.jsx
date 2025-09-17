import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslatedText = ({ keyName }) => {
  const { t, i18n } = useTranslation();

  return (
    <span dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {t(keyName)}
    </span>
  );
};

export default TranslatedText;