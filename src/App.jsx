import React, { useState, useEffect } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setWindowActiveShowTabList, setIdEditingColorGroupArchive, setIsShowContextMenuCurrentTabList } from "./store/features/app";
import { setTabsActive, setTabs } from "./store/features/tab";
import { setGroups } from "./store/features/group";
import { setBookmarks } from "./store/features/bookmark";
import { setCurrent, setWindows } from "./store/features/window";
import { setGroupsArchive } from "./store/features/archive";

import ChromeExt from "./chrome_ext";
import { KEY_GROUPS_ARCHIVE } from "./constants";
import { web_asset_svg, bookmark_svg } from "./svg_icon";

import FormSearch from "./components/form/FormSearch";
import BottomToolbar from "./components/toolbar/BottomToolbar";
import CurrentTabList from "./components/list/CurrentTabList";
import BookmarkList from "./components/list/BookmarkList";
import GroupsArchive from "./components/list/GroupsArchive";

const App = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const windows = useSelector((state) => state.window_manager.windows);
  const windowActiveShowTabList = useSelector((state) => state.app_manager.window_active_show_tab_list);

  // State
  const [pageActive, setPageActive] = useState("tab_list_in_window");

  // Process func
  const loadTabs = async () => {
    let tabs = await ChromeExt.getTabs();

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
    dispatch(setGroups(groups));
  };
  // const loadBookmarks = async () => {
  //   let bookmarks = await ChromeExt.storage.getBookmarkGroups();
  //   dispatch(setBookmarks(bookmarks));
  // };
  const loadWindows = async () => {
    let windowsRes = await ChromeExt.getWindows();
    dispatch(setWindows(windowsRes));

    if (windowsRes.length === 1) {
      dispatch(setWindowActiveShowTabList(windowsRes[0].id));
    } else {
      dispatch(setWindowActiveShowTabList("all_window"));
    }
  };
  const loadGroupsArchive = async () => {
    let groupsArchive = await ChromeExt.storage.get(KEY_GROUPS_ARCHIVE) ?? [];

    // Check tabs in group archive
    // groupsArchive = groupsArchive.map((group) => {
    //   if (!group.tabs) {
    //     group.tabs = [];
    //   }
    //   return group;
    // });

    // Filter group not have tabs
    groupsArchive = groupsArchive.filter((group) => group.tabs && group.tabs.length > 0);

    console.log(groupsArchive);
    
    
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
    });
    // ChromeExt.onGroupChange((event) => {
    //   loadTabs();
    //   loadGroups();
    // });
    // ChromeExt.onWindowChange((event) => {
    //   loadWindows();
    // });
    ChromeExt.storage.onChange((changes, area) => {
      console.log(`Storage key "${KEY_GROUPS_ARCHIVE}" in namespace "${area}" changed.`);
      
      if (KEY_GROUPS_ARCHIVE in changes) {
        let groupsArchive = changes[KEY_GROUPS_ARCHIVE].newValue;
        if (groupsArchive) {

          // groupsArchive = groupsArchive.map((group) => {
          //   if (!group.tabs) {
          //     group.tabs = [];
          //   }
          //   return group;
          // });

          // Filter group not have tabs
          groupsArchive = groupsArchive.filter((group) => group.tabs && group.tabs.length > 0);
          
          dispatch(setGroupsArchive(groupsArchive));
        }
      }
    });
  };

  // Handler func
  const handlerClickOutside = () => {
    let { target } = event;
    if (target.classList.contains("action")) return;

    dispatch(setIdEditingColorGroupArchive(null));
    dispatch(setIsShowContextMenuCurrentTabList(false));
  };
  const handlerWindowActiveShowTabList = (windowId) => {
    setPageActive("tab_list_in_window");
    dispatch(setWindowActiveShowTabList(windowId));
  };
  const handlerClickShowBookmarkList = () => {
    setPageActive("bookmark");
    dispatch(setWindowActiveShowTabList(null));
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

        <div className="flex-grow bg-white overflow-y-auto" onClick={(event) => { handlerClickOutside(event); }}>
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
