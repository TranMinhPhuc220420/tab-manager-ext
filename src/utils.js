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

export const ChromeExt = {
  // Tabs

  /**
   * Get all tabs
   * 
   * @returns {Promise<chrome.tabs.Tab[]>}
   */
  getTabs: () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({}, (tabs) => {
        resolve(tabs);
      });
    });
  },

  /**
   * Get active tab
   * 
   * @returns {Promise<chrome.tabs.Tab>}
   */
  getTabActive: () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true }, ([tab]) => {
        resolve(tab);
      });
    });
  },
}