(function () {
  // Initialize the app
  chrome.runtime.onInstalled.addListener((event) => {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  });

  // Register event listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { method, payload } = request;

    switch (method) {
    }
  });

  // On storage change
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
      let storageChange = changes[key];
      // console.log(
      //   `Storage key "${key}" in namespace "${namespace}" changed. ` +
      //   `Old value was "${storageChange.oldValue}", new value is "${storageChange.newValue}".`
      // );
      // console.log(storageChange.oldValue);
      // console.log(storageChange.newValue);
    }
  });

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  // Storage
  const KEY_GROUPS_ARCHIVE = "groups_archive";
  const getStorage = (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || []);
      });
    });
  };
  const setStorage = (key, value) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve(value);
      });
    });
  };
  const addGroupArchiveToStorage = (group) => {
    return new Promise(async (resolve, reject) => {
      let groups = await getStorage(KEY_GROUPS_ARCHIVE);
      let index = groups.findIndex((g) => g.id === group.id);

      if (index === -1) {
        groups.push(group);
      } else {
        groups[index].id = group.id;
      }
      resolve(setStorage(KEY_GROUPS_ARCHIVE, groups));
    });
  };
  const updateGroupArchiveInStorage = (group) => {
    return new Promise(async (resolve, reject) => {
      let groups = await getStorage(KEY_GROUPS_ARCHIVE);
      let index = groups.findIndex((g) => g.id === group.id);

      if (index !== -1) {
        groups[index] = group;
      }
      else {
        groups.push(group);
      }
      resolve(setStorage(KEY_GROUPS_ARCHIVE, groups));
    });
  };

  // Tabs
  const getTabById = (tabId, byQuery = false) => {
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
  };
  const getTabsByGroupId = (groupId) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ groupId: groupId }, (tabs) => {
        resolve(tabs);
      });
    });
  };
  const onTabsChange = async (tabId) => {
    console.log('onTabsChange', tabId);
    await sleep(200);
    
    let tab = await getTabById(tabId, true);
    if (!tab) return;
    let paramsTab = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      // status: tab.status,
    }

    let { groupId } = tab;
    if (groupId === -1) return;
    
    // Update tab in group
    let groups = await getStorage(KEY_GROUPS_ARCHIVE);
    let index = groups.findIndex((g) => g.id === groupId);
    console.log(index);
    
    if (index !== -1) {
      let group = await getGroupById(groupId);
      groups[index] = { ...groups[index], ...group };

      let tabs = groups[index].tabs;
      if (tabs) {
        let indexTab = tabs.findIndex((t) => t.id === tab.id);
        if (indexTab !== -1) {
          let {title, url, favIconUrl, status} = tabs[indexTab];
          tabs[indexTab] = {
            id: tab.id,
            title: title || tab.title,
            url: url || tab.url,
            favIconUrl: favIconUrl || tab.favIconUrl,
            // status: tab.status,
          };
        }
        else {
          tabs.push(paramsTab);
        }
        groups[index].tabs = tabs;
      }
      else {
        // groups[index].tabs = [paramsTab];
      }

      // groups[index].is_current = true;
      console.log(groups[index]);
      
      await setStorage(KEY_GROUPS_ARCHIVE, groups);
    }
  };
  const onTabsMove = async (tabId, moveInfo) => {
    // Sort tabs archive match tabs
    console.log(tabId, moveInfo);
  };
  chrome.tabs.onMoved.addListener(onTabsMove);
  // chrome.tabs.onUpdated.addListener(onTabsChange);

  // Groups
  const getGroupById = (groupId, byQuery = false) => {
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
  };
  const onGroupCreate = async (group) => {
    console.log('onGroupCreate', group);
    // await sleep(50);

    let { id } = group;
    let tabs = await getTabsByGroupId(id);

    // group.is_current = true;
    group.tabs = tabs.map((tab) => {
      return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
      };
    });

    // Delay 100ms to wait for the tabs to be updated
    addGroupArchiveToStorage(group);
  };
  const onGroupUpdate = async (group) => {
    console.log('onGroupUpdate', group);
    // await sleep(100);

    let { id } = group;
    let groups = await getStorage(KEY_GROUPS_ARCHIVE);
    let index = groups.findIndex((g) => g.id === id);

    if (index !== -1) {
      groups[index] = { ...groups[index], ...group };
      // groups[index].is_current = true;

      let groupArchive = groups[index];
      let tabsArchive = groupArchive.tabs;
      
      let tabs = await getTabsByGroupId(id);
      if (!tabsArchive) {
        groups[index].tabs = tabs.map((tab) => {
          return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            // status: tab.status,
          };
        });
      }
      else {
        if (tabs.length > 0) {
          for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            
            let indexTab = tabsArchive.findIndex((t) => t.id === tab.id);
            if (indexTab !== -1) {
              let {title, url, favIconUrl, status} = tabsArchive[indexTab];
              tabsArchive[indexTab] = {
                id: tab.id,
                title: title || tab.title,
                url: url || tab.url,
                favIconUrl: tab.favIconUrl,
                // status: tab.status,
              };
            }
            else {
              tabsArchive.push({
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                // status: tab.status,
              });
            }
          }

          // Sort tabs archive match tabs
          tabsArchive = tabsArchive.sort((a, b) => {
            let indexA = tabs.findIndex((t) => t.id === a.id);
            let indexB = tabs.findIndex((t) => t.id === b.id);
            return indexA - indexB;
          });

          groups[index].tabs = tabsArchive;
        }
      }

      await setStorage(KEY_GROUPS_ARCHIVE, groups);
    }
    else {
      // group.is_current = true;
      addGroupArchiveToStorage(group);
    }
  };
  const onGroupRemove = async (group) => {
    console.log('onGroupRemove', group);
    let { id } = group;

    // Update flag is_current to false
    let groups = await getStorage(KEY_GROUPS_ARCHIVE);
    let index = groups.findIndex((g) => g.id === id);

    if (index !== -1) {
      // groups[index].is_current = false;
      console.log(groups[index]);

      let tabs = await getTabsByGroupId(id);
      console.log('tt', tabs);
      
      await setStorage(KEY_GROUPS_ARCHIVE, groups);
    }
  };
  // chrome.tabGroups.onCreated.addListener(onGroupCreate);
  chrome.tabGroups.onUpdated.addListener(onGroupUpdate);
  // chrome.tabGroups.onRemoved.addListener(onGroupRemove);

}());