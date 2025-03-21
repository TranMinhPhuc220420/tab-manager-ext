import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setIsShowContextMenuCurrentTabList, setContextMenuPositionCurrentTabList } from "../../store/features/app";

import { getIconUrl } from "../../utils";
import ChromeExt from "../../chrome_ext";

import {
  create_new_folder_svg,
} from "../../svg_icon";

const CurrentTabList = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const tabsActive = useSelector((state) => state.tab_manager.tabsActive);
  const tabs = useSelector((state) => state.tab_manager.tabs);
  const windowActive = useSelector((state) => state.app_manager.window_active_show_tab_list);
  const keySearch = useSelector((state) => state.app_manager.key_search);
  const isShowContextMenu = useSelector((state) => state.app_manager.is_show_context_menu_current_tab_list);
  const contextMenuPosition = useSelector((state) => state.app_manager.context_menu_position_current_tab_list);

  // State
  const [tabsSelected, setTabsSelected] = useState([]);

  // Process func
  const isTabActive = (tab) => {
    return !!tabsActive.find((t) => t.id === tab.id);
  };
  const findTabActiveByWindowId = (windowId) => {
    return tabsActive.find((tab) => tab.windowId === windowId);
  };
  const filterTabsBeforeShow = (tabs) => {
    tabs = tabs.filter((item) => windowActive == "all_window" || item.windowId === windowActive);
    tabs = tabs.filter((item) => item.groupId == -1);
    if (keySearch) {
      tabs = tabs.filter((tab) =>
        tab.title.toLowerCase().includes(keySearch.toLowerCase()) || tab.url.toLowerCase().includes(keySearch.toLowerCase())
      );
    }

    return tabs;
  };

  // Handler func
  const handlerClickOutside = () => {
    let { target } = event;
    if (target.classList.contains("action")) return;
    dispatch(setIsShowContextMenuCurrentTabList(false));
  };
  const handleClickTabItem = (event, tab) => {
    let { target, shiftKey, ctrlKey } = event;
    dispatch(setIsShowContextMenuCurrentTabList(false));

    if (shiftKey) {
      let tabActive = findTabActiveByWindowId(tab.windowId);
      // select range
      let index = tabs.findIndex((t) => t.id === tab.id);
      let indexSelected = tabs.findIndex((t) => t.id === tabActive.id);
      let tabsRange = tabs.slice(
        Math.min(index, indexSelected),
        Math.max(index, indexSelected) + 1
      );

      setTabsSelected(tabsRange);
    } else if (ctrlKey) {
      // select multiple
      let index = tabsSelected.findIndex((t) => t.id === tab.id);
      if (index === -1) {
        setTabsSelected([...tabsSelected, tab]);
      } else {
        setTabsSelected(tabsSelected.filter((t) => t.id !== tab.id));
      }
    } else {
      setTabsSelected([tab]); // clear selected

      ChromeExt.setTabActiveAndCurrentWindow(tab.id);
    }
  };
  const handlerContextMenuTabItem = (event, tab) => {
    event.preventDefault();
    dispatch(setIsShowContextMenuCurrentTabList(true));
    dispatch(setContextMenuPositionCurrentTabList({ x: event.clientX, y: event.clientY }));
  };
    
  const handlerCreateGroupTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.createGroup({ tabIds: tabIds });
  };

  // Constants
  const CONTEXT_MENU_ITEMS = [
    { label: "Create group", icon: create_new_folder_svg, action: handlerCreateGroupTabsSelected },
  ];

  // Lifecycle
  useEffect(() => {
    return () => { };
  }, []);

  return (
    <div onClick={(event) => { handlerClickOutside(event); }}>

      {/* List tabs */}
      <ul className="tab-list">
        <label>
          <div className="group-title flex items-center mx-2 mt-4 mb-1">
            <div className="mr-1 font-semibold">{t('LABEL_TABS_CURRENT')}</div>
            <div className="total-tab">({filterTabsBeforeShow(tabs).length})</div>
          </div>
        </label>
        {filterTabsBeforeShow(tabs).map((tab) => (
          <li key={tab.id} className={`action tab-item flex items-center px-4 py-2 select-none
                          ${isTabActive(tab) ? "active" : ""}
                          ${tabsSelected.find((t) => t.id === tab.id) ? "active" : ""} `}
            onClick={(event) => handleClickTabItem(event, tab)}
            onContextMenu={(event) => handlerContextMenuTabItem(event, tab)}
          >
            <img src={tab.favIconUrl || getIconUrl(tab.url)} alt={`${tab.title} icon`} className="w-6 h-6 mr-2 event-none" />
            <div className="overflow-hidden event-none">
              <div className="title text-gray-500 font-semibold truncate"> {tab.title} </div>
              <div className="text-xs text-gray-500 truncate"> {tab.url} </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Context menu */}
      {isShowContextMenu && (
        <div className="context-menu absolute bg-white rounded-md"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
          }}
        >
          {CONTEXT_MENU_ITEMS.map((item, index) => (
            <div key={index}
              className="action context-menu-item flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                item.action();
                dispatch(setIsShowContextMenuCurrentTabList(false));
              }}
            >
              <div className="icon">
                {item.icon()}
              </div>
              <div className="text ml-2">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentTabList;
