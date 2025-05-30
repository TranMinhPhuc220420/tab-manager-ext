import React, { useState, useEffect } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import {
  setWindowActiveShowTabList, setIdEditingColorGroupArchive, setIsShowContextMenuCurrentTabList,
  setIsShowContextMenuTabListGroupsArchive,
  setIdGroupArchiveShowContextMenu
} from "./store/features/app";
import { setWindows } from "./store/features/window";
import { setTabsActive, setTabs } from "./store/features/tab";
import { setGroups } from "./store/features/group";
import { setGroupsArchive } from "./store/features/archive";

import ChromeExt from "./chrome_ext";
import { KEY_GROUPS_ARCHIVE } from "./constants";

import FormSearch from "./components/form/FormSearch";
import BottomToolbar from "./components/toolbar/BottomToolbar";
import CurrentTabList from "./components/list/CurrentTabList";
import GroupsArchive from "./components/list/GroupsArchive";

const App = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const groupsArchive = useSelector((state) => state.archive_manager.groups);

  // State

  // Process func
  const loadTabs = async () => {
    let tabs = await ChromeExt.getTabs();

    // // Update tabs in groups archive
    // const groupsArchiveClone = [...groupsArchive];
    // for (let i = 0; i < groupsArchiveClone.length; i++) {
    //   let {id, tabs} = groupsArchiveClone[i];
    //   // let tabsArchive = group.tabs;

    //   for (let i = 0; i < tabs.length; i++) {
    //     const tabArchive = tabs[i];

    //     let indexTab = tabs.findIndex((t) => (t.id === tabArchive.id && t.groupId === id));
    //     if (indexTab !== -1) {
    //       let { title, url, favIconUrl, status } = tabs[indexTab];
    //       tabs[i] = {
    //         title: title || tabArchive.title,
    //         url: url || tabArchive.url,
    //         favIconUrl: favIconUrl || tabArchive.favIconUrl || tabArchive.pendingUrl,
    //         status: status,
    //       };
    //     }

    //   }

    //   group.tabs = tabs;
    //   groupsArchiveClone[i] = group;
    // }
    // dispatch(setGroupsArchive(groupsArchiveClone));

    // Filter tab have groupId
    tabs = tabs.filter((tab) => tab.groupId === -1);
    // Filter tab empty url or title
    tabs = tabs.filter((tab) => tab.url && tab.title);

    dispatch(setTabs(tabs));
  };
  const loadTabActive = async () => {
    let tabs = await ChromeExt.getTabsActive();
    dispatch(setTabsActive(tabs));
  };
  const loadGroups = async () => {
    let groups = await ChromeExt.getGroups();
    for (let i = 0; i < groups.length; i++) {
      groups[i].tabs = await ChromeExt.getTabsByGroupId(groups[i].id);
    }

    // Sort groups by index tab first
    groups = groups.sort((a, b) => {
      let { tabs: tabsA, is_current: isCurrentA } = a;
      let { tabs: tabsB, is_current: isCurrentB } = b;

      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;

      if (!tabsA && !tabsB) return 0;
      if (tabsA && !tabsB) return -1;
      if (!tabsA && tabsB) return 1;

      let indexA = (tabsA.length > 0) ? tabsA[0].index : 0;
      let indexB = (tabsB.length > 0) ? tabsB[0].index : 0;

      return indexA - indexB;
    });


    dispatch(setGroups(groups));
  };
  const loadWindows = async () => {
    let windowsRes = await ChromeExt.getWindows();
    dispatch(setWindows(windowsRes));

    if (windowsRes.length === 1) {
      dispatch(setWindowActiveShowTabList(windowsRes[0].id));
    } else {
      dispatch(setWindowActiveShowTabList("all_window"));
    }
  };
  const loadGroupsArchive = async (action) => {
    let groupsArchive = await ChromeExt.storage.get(KEY_GROUPS_ARCHIVE) ?? [];

    // Set flag is_current for group
    for (let i = 0; i < groupsArchive.length; i++) {
      let { id } = groupsArchive[i];
      let group = await ChromeExt.getGroupById(id, true);
      groupsArchive[i] = { ...groupsArchive[i], ...group };
      groupsArchive[i].is_current = group ? true : false;

      // if (action == 'load_tabs') {
      let tabs = groupsArchive[i].tabs;
      let tabsCurrent = await ChromeExt.getTabsByGroupId(id);
      if (!tabs || tabsCurrent.length > 0) {
        groupsArchive[i].tabs = tabsCurrent;
      }
      // }
    }

    // Sort groups archive by index tab first
    groupsArchive = groupsArchive.sort((a, b) => {
      let { tabs: tabsA, is_current: isCurrentA } = a;
      let { tabs: tabsB, is_current: isCurrentB } = b;

      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;

      if (!tabsA && !tabsB) return 0;
      if (tabsA && !tabsB) return -1;
      if (!tabsA && tabsB) return 1;

      let indexA = (tabsA.length > 0) ? tabsA[0].index : 0;
      let indexB = (tabsB.length > 0) ? tabsB[0].index : 0;

      return indexA - indexB;
    });

    // if (action == 'load_tabs') {
    //   // Remove group have tabs empty
    //   for (let i = 0; i < groupsArchive.length; i++) {
    //     const { id, tabs } = groupsArchive[i];
    //     if (!tabs || tabs.length === 0) {
    //       ChromeExt.storage.removeGroupsArchiveById(id);
    //     }
    //   }
    // }

    // Filter group not have tabs
    console.log(groupsArchive);
    // groupsArchive = groupsArchive.filter((group) => group.tabs && group.tabs.length > 0);
    // console.log(groupsArchive);

    dispatch(setGroupsArchive(groupsArchive));
  };
  const loadData = () => {
    loadTabs();
    loadTabActive();
    loadGroups();
    // loadBookmarks();
    loadWindows();
    loadGroupsArchive();
  };
  const events = () => {
    ChromeExt.onTabActiveChange((activeInfo) => {
      loadTabActive();
    });
    ChromeExt.onTabChange((event) => {
      loadTabs();
      loadGroups();
      loadTabActive();
      loadGroupsArchive('load_tabs');
    });
    ChromeExt.onGroupChange((event) => {
      loadTabs();
      loadGroups();
      loadGroupsArchive();
    });
    ChromeExt.onWindowChange((event) => {
      loadWindows();
    });
    ChromeExt.storage.onChange((changes, area) => {
      // console.log(`Storage key "${KEY_GROUPS_ARCHIVE}" in namespace "${area}" changed.`);

      if (KEY_GROUPS_ARCHIVE in changes) {
        let groupsArchive = changes[KEY_GROUPS_ARCHIVE].newValue;
        if (groupsArchive) {
          loadGroupsArchive();
        }
      }
    });
  };

  // Handler func
  const handlerClickOutside = () => {
    let { target } = event;

    if (!target.classList.contains("edit-color-group")) {
      dispatch(setIdEditingColorGroupArchive(null));
    }

    if (!target.classList.contains("context-menu-group-archive")) {
      dispatch(setIdGroupArchiveShowContextMenu(null));
    }

    if (!target.classList.contains("context-menu-item") && !target.classList.contains("context-menu-item-open")) {
      dispatch(setIsShowContextMenuCurrentTabList(false));
    }

    if (!target.classList.contains("context-menu-item-groups-archive") && !target.classList.contains("context-menu-item-groups-archive-open")) {
      dispatch(setIsShowContextMenuTabListGroupsArchive(false));
    }
  };

  const handlerContextMenuOutside = () => {
    let { target } = event;

    if (!target.classList.contains("tab-item-in-current")) {
      dispatch(setIsShowContextMenuCurrentTabList(false));
    }
    if (!target.classList.contains("tab-item-in-group-archive")) {
      dispatch(setIsShowContextMenuTabListGroupsArchive(false));
    }
  };

  const handlerOnScroll = (event) => {
    dispatch(setIsShowContextMenuCurrentTabList(false));
    dispatch(setIsShowContextMenuTabListGroupsArchive(false));
  };

  // Lifecycle
  useEffect(() => {
    loadData();
    events();

    return () => { };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow flex flex-col" style={{ height: "100px" }}>

        {/* <div className="toolbar bg-white flex items-center gap-2 px-2 pb-1 pt-2 mb-1 shadow-sm">
          <div className={`group-card-header w-full flex items-center cursor-pointer ${windows.length > 1 ? "justify-between" : "justify-start"}`}>
            <div className={`font-semibold mr-2 flex flex-wrap items-center select-none ${windows.length > 1 ? "w-full" : ""}`}>
              {windows.length > 1 && (
                <button className={`toolbar-item px-2 py-1 rounded-full cursor-pointer flex items-center 
                                  ${(pageActive === "tab_list_in_window" && windowActiveShowTabList === "all_window") ? "active" : ""}`}
                  onClick={() => handlerWindowActiveShowTabList("all_window")}
                >
                  {t("TXT_ALL_TABS")}
                </button>
              )}
              {windows.map((window, index) => (
                <button className={`toolbar-item px-2 py-1 rounded-full cursor-pointer flex items-center 
                                  ${(pageActive === "tab_list_in_window" && windowActiveShowTabList === window.id) ? "active" : ""}`}
                  onClick={() => handlerWindowActiveShowTabList(window.id)}
                >
                  <span className="mr-1">{web_asset_svg()}</span>
                  {windows.length > 1 ? `${t('TXT_WINDOW')} ${index + 1}` : t('TXT_CURRENT_WINDOW')}
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold select-none flex items-center">
              <button className={`toolbar-item px-2 py-1 rounded-full cursor-pointer flex items-center ${pageActive === "bookmark" ? "active" : ""}`}
                onClick={() => handlerClickShowBookmarkList()}
              >
                <span className="">{bookmark_svg()}</span>
                {windows.length > 1 ? `` : t('TXT_BOOKMARK')}
              </button>
            </div>
          </div>
        </div> */}

        <div className="flex items-center sticky mt-2 top-0 z-10">
          <FormSearch />
        </div>

        <div className="flex-grow bg-white overflow-y-auto overflow-x-hidden"
          onClick={(event) => { handlerClickOutside(event); }}
          onContextMenu={(event) => { handlerContextMenuOutside(event); }}
          onScroll={(event) => { handlerOnScroll(event); }}
        >
          {/* {pageActive === "tab_list_in_window" && <CurrentTabList />}
          {pageActive === "bookmark" && <BookmarkList />} */}
          <GroupsArchive />

          <CurrentTabList />
        </div>
      </div>

      <div className="w-full shadow-inner flex items-center justify-center">
        <BottomToolbar />
      </div>
    </div >
  );
};

export default App;
