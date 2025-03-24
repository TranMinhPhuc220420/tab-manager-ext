import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setIdEditingTitleGroupsArchive, setIsShowContextMenuCurrentTabList, setContextMenuPositionCurrentTabList } from "../../store/features/app";

import { COLOR_SETTING } from "../../constants";
import { getIconUrl } from "../../utils";
import ChromeExt from "../../chrome_ext";

import {
  expand_more_svg, drive_file_move_svg, arrow_upward_svg,
  refresh_svg, add_svg, close_svg, move_to_inbox_svg, content_copy_svg, push_pin_svg
} from "../../svg_icon";

const CurrentTabList = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const tabsActive = useSelector((state) => state.tab_manager.tabsActive);
  const tabs = useSelector((state) => state.tab_manager.tabs);
  const groups = useSelector((state) => state.group_manager.groups);
  const windowActive = useSelector((state) => state.app_manager.window_active_show_tab_list);
  const keySearch = useSelector((state) => state.app_manager.key_search);
  const isShowContextMenu = useSelector((state) => state.app_manager.is_show_context_menu_current_tab_list);
  const contextMenuPosition = useSelector((state) => state.app_manager.context_menu_position_current_tab_list);

  // State
  const [tabsSelected, setTabsSelected] = useState([]);
  const [showGroupMoveTo, setShowGroupMoveTo] = useState(false);
  const [positionMenuChild, setPositionMenuChild] = useState({ isLeft: true, isTop: true });

  // Process func
  const isTabActive = (tab) => {
    return !!tabsActive.find((t) => t.id === tab.id);
  };
  const isTabsSelectedPin = () => {
    return tabsSelected.every((tab) => tab.pinned);
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
  const handleClickTabItem = (event, tab) => {
    let { target, shiftKey, ctrlKey } = event;

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
  const handlerUnPinThisTab = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();

    ChromeExt.unPinTabs([tab.id]);
  };
  const handlerContextMenuTabItem = async (event, tab) => {
    let { clientX, clientY } = event;
    event.preventDefault();

    let index = tabsSelected.findIndex((t) => t.id === tab.id);
    if (tabsSelected.length === 0 || index === -1) {
      setTabsSelected([tab]);
    }

    // Await to get element context menu
    let contextMenuEl = await new Promise((resolve, reject) => {
      let timeInterval = setInterval(() => {
        let contextMenuEl = document.querySelector(".context-menu");
        if (contextMenuEl) {
          clearInterval(timeInterval);
          resolve(contextMenuEl);
        }
      });
    });

    let positionMenuChild = { isLeft: true, isTop: true };

    // Check if context menu out of screen
    let contextMenuWidth = contextMenuEl.clientWidth;
    if (clientX + contextMenuWidth > innerWidth) {
      clientX = innerWidth - contextMenuWidth;
    }

    let selectGroupEl = contextMenuEl.querySelector(".select-group");
    if (selectGroupEl) {
      let selectGroupWidth = selectGroupEl.clientWidth;
      if (clientX + contextMenuWidth + selectGroupWidth >= innerWidth) {
        positionMenuChild.isLeft = false;
      }

      let selectGroupHeight = selectGroupEl.clientHeight;
      if (clientY + selectGroupHeight >= innerHeight - 50) {
        positionMenuChild.isTop = false;
      }

      setPositionMenuChild(positionMenuChild);
    } else {
      setPositionMenuChild(positionMenuChild);
    }

    let contextMenuHeight = contextMenuEl.clientHeight;
    if (clientY + contextMenuHeight > innerHeight) {
      clientY = innerHeight - contextMenuHeight;
    }

    dispatch(setIsShowContextMenuCurrentTabList(true));

    dispatch(setContextMenuPositionCurrentTabList({ x: clientX, y: clientY }));
  };
  const handlerAddNewTabLeftOrRight = (isLeft, isRight) => {
    let tab;
    if (isLeft) {
      tab = tabsSelected[0];
    }
    if (isRight) {
      tab = tabsSelected[tabsSelected.length - 1];
    }

    let { index, windowId } = tab;
    let createProperties = { index: isLeft ? index : index + 1 };

    ChromeExt.createTab(createProperties);

    // Clear tabsSelected
    setTabsSelected([]);
    dispatch(setIsShowContextMenuCurrentTabList(false));
  };
  const handlerCreateGroupTabsSelected = async () => {
    let tabsToGroup = [...tabsSelected];

    let color = COLOR_SETTING[Math.floor(Math.random() * COLOR_SETTING.length)];

    let tabIds = tabsToGroup.map((tab) => tab.id);
    let groupIdResult = await ChromeExt.createGroup({ tabIds });

    // Update color for group
    ChromeExt.updateGroup(groupIdResult, { color });

    // Clear tabsSelected
    setTabsSelected([]);
    dispatch(setIsShowContextMenuCurrentTabList(false));

    dispatch(setIdEditingTitleGroupsArchive([groupIdResult]));
    let timeInterval = setInterval(() => {
      let input = document.querySelector(`div[group-id="${groupIdResult}"] .group-title-input`);
      if (input) {
        clearInterval(timeInterval);
        input.focus();
      }
    }, 100);

  };
  const handlerShowGroupMoveTo = async () => {
    setShowGroupMoveTo(!showGroupMoveTo);
  };
  const handlerPinTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.pinTabs(tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerUnPinTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.unPinTabs(tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerReloadTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.reloadTabs(tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerCloseTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.removeTabs(tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerMoveTabsToGroupSelected = (groupId) => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.moveTabsToGroup(tabIds, groupId);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerCopyUrlTabsSelected = () => {
    let urls = tabsSelected.map((tab) => tab.url);

    // Copy to clipboard
    let text = urls.join("\n");
    navigator.clipboard.writeText(text);

    // Clear tabsSelected
    setTabsSelected([]);
  };

  // Lifecycle
  useEffect(() => {
    setShowGroupMoveTo(false);

    return () => { };
  }, [isShowContextMenu, contextMenuPosition]);

  return (
    <div>

      {/* List tabs */}
      <ul className="tab-list">
        <label>
          <div className="group-title flex items-center mx-2 mt-4 mb-1">
            <div className="mr-1 font-semibold">{t('LABEL_TABS_CURRENT')}</div>
            <div className="total-tab">({filterTabsBeforeShow(tabs).length})</div>
          </div>
        </label>
        {filterTabsBeforeShow(tabs).map((tab) => (
          <li key={tab.id} className={`action tab-item tab-item-in-current flex items-center px-4 py-2 select-none  
                          status-${tab.status}
                          ${isTabActive(tab) ? "active" : ""}
                          ${tabsSelected.find((t) => t.id === tab.id) ? "selected" : ""} `}
            onClick={(event) => handleClickTabItem(event, tab)}
            onContextMenu={(event) => handlerContextMenuTabItem(event, tab)}
          >
            <img src={tab.favIconUrl || getIconUrl(tab.url)} alt={`${tab.title} icon`} className="w-6 h-6 mr-2 event-none" />
            <div className="overflow-hidden pointer-events-none">
              <div className="title text-gray-500 font-semibold truncate"> {tab.title} </div>
              <div className="text-xs text-gray-500 truncate"> {tab.url} </div>
            </div>

            {tab.pinned && (
              <div className="tab-pin icon w-3 h-3" onClick={(event) => { handlerUnPinThisTab(event, tab); }}>
                {push_pin_svg()}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Context menu */}
      <div className={`context-menu absolute bg-white rounded-md ${!isShowContextMenu ? "opacity-0 -z-50 pointer-events-none" : "overflow-visible"}`}
        style={{
          top: contextMenuPosition.y,
          left: contextMenuPosition.x,
        }}
      >
        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerAddNewTabLeftOrRight(true, false); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4">
            {arrow_upward_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_NEW_TAB_LEFT')}
          </div>
        </div>
        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerAddNewTabLeftOrRight(false, true); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4 rotate-180">
            {arrow_upward_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_NEW_TAB_RIGHT')}
          </div>
        </div>
        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerCreateGroupTabsSelected(); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4">
            {drive_file_move_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_CREATE_GROUP')}
          </div>
        </div>
        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerReloadTabsSelected(); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4">
            {refresh_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_RELOAD_TABS')}
          </div>
        </div>
        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerCopyUrlTabsSelected(); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4">
            {content_copy_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_COPY_URL_TABS')}
          </div>
        </div>

        <div className="divider"></div>

        <div className="action context-menu-item flex items-center pl-2 pr-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerShowGroupMoveTo(); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4 pointer-events-none">
            {move_to_inbox_svg()}
          </div>
          <div className="text ml-3 pointer-events-none">
            {t('LABEL_MOVE_TAB_TO_GROUP')}
          </div>
          <div className="icon context-menu-item-open flex items-center justify-center w-4 h-4 ml-2 pl-2 border-l-gray-200 border-l relative">
            <div className="rotate-270 pointer-events-none">
              {expand_more_svg()}
            </div>

            <div className={`select-group shadow-menu absolute bg-white rounded-md overflow-hidden shadow-md z-10 w-max
              ${!showGroupMoveTo ? 'opacity-0 -z-50 pointer-events-none' : ''} 
              ${positionMenuChild.isLeft ? 'left-5' : 'right-1'}
              ${positionMenuChild.isTop ? 'top-0' : 'bottom-1'}`}
            >
              <div className="title px-2 py-1 cursor-default bg-gray-200">{t('LABEL_GROUP')}</div>
              {groups.map((group) => (
                <div key={group.id} className={`select-group-item text-white flex items-center px-2 py-1 cursor-pointer ${group.color}`}
                  onClick={() => { handlerMoveTabsToGroupSelected(group.id); }}
                >
                  <div className="dot w-3 h-3 mr-2 rounded-full"></div>
                  <div className="text ml-2">
                    {group.title}
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="flex items-center px-3 py-2 cursor-default">
                  <div className="text ml-2">
                    {t('LABEL_NO_GROUP')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {isTabsSelectedPin() ?
          (
            <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => { handlerUnPinTabsSelected(); }}
            >
              <div className="icon flex items-center justify-center un-pin w-4 h-4">
                {push_pin_svg()}
              </div>
              <div className="text ml-2">
                {t('LABEL_UNPIN_TABS')}
              </div>
            </div>
          ) :
          (
            <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => { handlerPinTabsSelected(); }}
            >
              <div className="icon flex items-center justify-center w-4 h-4">
                {push_pin_svg()}
              </div>
              <div className="text ml-2">
                {t('LABEL_PIN_TABS')}
              </div>
            </div>
          )}

        <div className="divider"></div>

        <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => { handlerCloseTabsSelected(); }}
        >
          <div className="icon flex items-center justify-center w-4 h-4">
            {close_svg()}
          </div>
          <div className="text ml-2">
            {t('LABEL_CLOSE_TABS')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentTabList;
