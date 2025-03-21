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
    let tab = await getTabById(tabId, true);
    if (!tab) return;

    let { groupId } = tab;
    if (groupId === -1) return;
    
    // Update tab in group
    let groups = await getStorage(KEY_GROUPS_ARCHIVE);
    let index = groups.findIndex((g) => g.id === groupId);
    if (index !== -1) {

      groups[index] = await getGroupById(groupId, true);

      // Update flag is_current
      if (groups[index]) {
        groups[index].is_current = true;
        let tabs = await getTabsByGroupId(groupId);
        groups[index].tabs = tabs.map((tab) => {
          return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
          };
        });
      }
      else {
        groups[index].is_current = false;
      }

      await setStorage(KEY_GROUPS_ARCHIVE, groups);
    }
  };
  // chrome.tabs.onCreated.addListener((payload) => onTabsChange('created', payload));
  chrome.tabs.onUpdated.addListener(onTabsChange);

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
    // console.log(group);

    // let { id } = group;
    // let tabs = await getTabsByGroupId(id);

    // group.is_current = true;
    // // group.tabs = tabs.map((tab) => {
    // //   return {
    // //     id: tab.id,
    // //     title: tab.title,
    // //     url: tab.url,
    // //     favIconUrl: tab.favIconUrl,
    // //   };
    // // });

    // // Delay 100ms to wait for the tabs to be updated
    // setTimeout(() => {
    //   addGroupArchiveToStorage(group);
    // }, 100);
  };
  const onGroupUpdate = async (group) => {
    let { id } = group;
    let tabs = await getTabsByGroupId(id);

    group.is_current = true;
    group.tabs = tabs.map((tab) => {
      return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
      };
    });

    // Delay 100ms to wait for the tabs to be updated
    // setTimeout(() => {
    console.log(group);
    updateGroupArchiveInStorage(group);
    // }, 100);
  };
  const onGroupRemove = async (group) => {
    let { id } = group;

    // Update flag is_current to false
    let groups = await getStorage(KEY_GROUPS_ARCHIVE);
    let index = groups.findIndex((g) => g.id === id);

    if (index !== -1) {
      groups[index].is_current = false;
      await setStorage(KEY_GROUPS_ARCHIVE, groups);
    }
  };
  // chrome.tabGroups.onCreated.addListener(onGroupCreate);
  chrome.tabGroups.onUpdated.addListener(onGroupUpdate);
  chrome.tabGroups.onRemoved.addListener(onGroupRemove);

}());