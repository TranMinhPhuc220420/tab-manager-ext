import { KEY_GROUPS_ARCHIVE } from "./constants";

const ChromeExt = {
  // Tabs
  getTabById: (tabId, byQuery = false) => {
    return new Promise((resolve, reject) => {
      if (!byQuery) {
        chrome.tabs.get(tabId, (tab) => {
          resolve(tab);
        });
      }
      else {
        chrome.tabs.query({}, (tabs) => {
          let tab = tabs.find((t) => t.id === tabId);
          resolve(tab);
        });
      }
    });
  },

  /**
   * Set tab active
   * 
   * @param {string} tabId - Tab ID
   * @returns {Promise<chrome.tabs.Tab>}
   */
  setTabActive: (tabId) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { active: true }, (tab) => {
        resolve(tab);
      });
    });
  },

  setTabActiveAndCurrentWindow: (tabId) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { active: true }, (tab) => {
        chrome.windows.update(tab.windowId, { focused: true }, (window) => {
          resolve(tab);
        });
      });
    });
  },

  createTab: (config) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.create(config, (tab) => {
        resolve(tab);
      });
    });
  },

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
  getTabsActive: () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true }, (tabs) => {
        resolve(tabs);
      });
    });
  },

  /**
   * Get tabs by group id
   * 
   * @returns {Promise<chrome.tabs.Tab>}
   */
  getTabsByGroupId: (groupId) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ groupId: groupId }, (tabs) => {
        resolve(tabs);
      });
    });
  },

  /**
   * Add listener active tab change
   * @param {Function} callback 
   */
  onTabActiveChange: (callback) => {
    chrome.tabs.onActivated.addListener(callback);
  },

  /**
   * Add listener move tab change
   * @param {Function} callback 
   */
  onTabChange: (callback) => {
    chrome.tabs.onCreated.addListener(callback);
    chrome.tabs.onMoved.addListener(callback);
    chrome.tabs.onRemoved.addListener(callback);
    chrome.tabs.onReplaced.addListener(callback);
    chrome.tabs.onUpdated.addListener(callback);
  },

  // Groups
  createGroup: (config) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.group(config, (group) => {
        resolve(group);
      });
    });
  },

  updateGroup: (groupId, config) => {
    return new Promise((resolve, reject) => {
      chrome.tabGroups.update(groupId, config, (group) => {
        resolve(group);
      });
    });
  },

  getGroupById: (groupId, byQuery = false) => {
    return new Promise((resolve, reject) => {
      if (!byQuery) {
        chrome.tabGroups.get(groupId, (group) => {
          resolve(group);
        });
      }
      else {
        chrome.tabGroups.query({}, (groups) => {
          let group = groups.find((g) => g.id === groupId);
          resolve(group);
        });
      }
    });
  },

  getGroups: () => {
    return new Promise((resolve, reject) => {
      chrome.tabGroups.query({}, (groups) => {
        resolve(groups);
      });
    });
  },

  setTitleGroup: (groupId, title) => {
    title = title.trim();

    return new Promise((resolve, reject) => {
      chrome.tabGroups.update(groupId, { title }, (group) => {
        resolve(group);
      });
    });
  },

  collapseGroup: (groupId, collapsed) => {
    return new Promise((resolve, reject) => {
      chrome.tabGroups.update(groupId, { collapsed }, (group) => {
        resolve(group);
      });
    });
  },

  collapseGroupAndCurrentWindow: (groupId, collapsed) => {
    return new Promise((resolve, reject) => {
      chrome.tabGroups.update(groupId, { collapsed }, (group) => {
        chrome.windows.update(group.windowId, { focused: true }, (window) => {
          resolve(group);
        });
      });
    });
  },

  /**
   * Add listener active tab change
   * @param {Function} callback 
   */
  onGroupChange: (callback) => {
    chrome.tabGroups.onCreated.addListener(callback);
    chrome.tabGroups.onMoved.addListener(callback);
    chrome.tabGroups.onRemoved.addListener(callback);
    chrome.tabGroups.onUpdated.addListener(callback);
  },

  // Windows
  createWindow: (config) => {
    return new Promise((resolve, reject) => {
      chrome.windows.create(config, (window) => {
        resolve(window);
      });
    });
  },

  /**
   * Get all windows
   * 
   * @returns {Promise<chrome.windows.Window[]>}
   */
  getWindows: () => {
    return new Promise((resolve, reject) => {
      chrome.windows.getAll({ populate: true }, (windows) => {
        resolve(windows);
      });
    });
  },

  /**
   * Get current window
   * 
   * @returns {Promise<chrome.windows.Window>}
   */
  getCurrentWindow: () => {
    return new Promise((resolve, reject) => {
      chrome.windows.getCurrent({ populate: true }, (window) => {
        resolve(window);
      });
    });
  },

  onWindowChange: (callback) => {
    chrome.windows.onCreated.addListener(callback);
    chrome.windows.onRemoved.addListener(callback);
  },

  // Storage
  storage: {
    get: (key) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key]);
        });
      });
    },
    set: (key, value) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve(value);
        });
      });
    },
    remove: (key) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
          resolve();
        });
      });
    },

    // KEY_GROUPS_ARCHIVE
    removeGroupsArchiveById: (groupId) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([KEY_GROUPS_ARCHIVE], (result) => {
          let groupsArchive = result[KEY_GROUPS_ARCHIVE] || [];

          groupsArchive = groupsArchive.filter((group) => group.id !== groupId);

          chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
            resolve(groupsArchive);
          });
        });
      });
    },

    /**
     * Update tab ID in groups archive
     * 
     * @param {number} groupId Group ID
     * @param {Array} tabIdNeedUpdateList List tab ID need update. Ex: [{newId: 1, oldId: 2}]
     * @returns {Promise<Array>} List groups archive
     */
    updateIdTabsForTabsGroupArchive: (groupId, tabIdNeedUpdateList) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([KEY_GROUPS_ARCHIVE], (result) => {
          let groupsArchive = result[KEY_GROUPS_ARCHIVE] || [];

          let index = groupsArchive.findIndex((group) => group.id === groupId);
          if (index !== -1) {
            let tabs = groupsArchive[index].tabs;
            tabIdNeedUpdateList.forEach((item) => {
              let tab = tabs.find((tab) => tab.id === item.oldId);
              if (tab) {
                tab.id = item.newId;
              }
            });
            groupsArchive[index].tabs = tabs;
          }

          chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
            resolve(groupsArchive);
          });
        });
      });
    },

    updateIdGroupsArchive: (groupId, newGroupId) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([KEY_GROUPS_ARCHIVE], (result) => {
          let groupsArchive = result[KEY_GROUPS_ARCHIVE] || [];

          let index = groupsArchive.findIndex((group) => group.id === groupId);
          if (index !== -1) {
            groupsArchive[index].id = newGroupId;
          }

          chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
            resolve(groupsArchive);
          });
        });
      });
    },

    updateCollapsedGroupArchive: (groupId, collapsed) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([KEY_GROUPS_ARCHIVE], (result) => {
          let groupsArchive = result[KEY_GROUPS_ARCHIVE] || [];

          let index = groupsArchive.findIndex((group) => group.id === groupId);
          if (index !== -1) {
            groupsArchive[index].collapsed = collapsed;
          }

          chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
            resolve(groupsArchive);
          });
        });
      });
    },

    updateFlagIsCurrentGroupArchive: (groupId, isCurrent) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([KEY_GROUPS_ARCHIVE], (result) => {
          let groupsArchive = result[KEY_GROUPS_ARCHIVE] || [];

          let index = groupsArchive.findIndex((group) => group.id === groupId);
          if (index !== -1) {
            groupsArchive[index].is_current = isCurrent;
          }

          chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
            resolve(groupsArchive);
          });
        });
      });
    },

    updateTabsInGroupsArchive: (groupsArchive) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [KEY_GROUPS_ARCHIVE]: groupsArchive }, () => {
          resolve(groupsArchive);
        });
      });
    },

    onChange: (callback) => {
      chrome.storage.onChanged.addListener(callback);
    },
  }
}

export default ChromeExt;