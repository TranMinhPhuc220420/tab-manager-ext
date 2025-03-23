import historySVG from './assets/icons/history.svg';
import extensionSVG from './assets/icons/extension.svg';
import publicSVG from './assets/icons/public.svg';

export const getIconUrl = (url) => {
  url = url.trim();

  // Regex valid url with chrome://
  if (/^chrome:\/\//.test(url)) {
    if (url == 'chrome://history/') {
      return historySVG;
    }
    if (url == 'chrome://extensions/') {
      return extensionSVG;
    }
  }
  
  return publicSVG;
};

export const randomBetween = (min, max) => {
  if (!min) min = 1_000_000;
  if (!max) max = 9_999_999;
  
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};