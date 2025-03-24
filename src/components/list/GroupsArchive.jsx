import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import {
  setIdEditingTitleGroupsArchive, setIdEditingColorGroupArchive,
  setIdGroupArchiveShowContextMenu, setIsShowContextMenuTabListGroupsArchive, setContextMenuPositionTabListGroupsArchive
} from "../../store/features/app";
import { setTitleGroupArchive, setCollapseGroupArchive, setColorGroupArchive, setFlagIsCurrentGroupArchive } from "../../store/features/archive";

import { COLOR_SETTING } from "../../constants";
import ChromeExt from "../../chrome_ext";
import { getIconUrl, randomBetween, sleep } from "../../utils";

import {
  expand_more_svg, open_in_browser_svg, open_in_new_svg, close_svg, more_vert_svg,
  edit_svg, done_svg, palette_svg, remove_svg, arrow_upward_svg,
  add_svg, delete_svg, expand_content_svg, drive_file_move_svg, refresh_svg, content_copy_svg, move_to_inbox_svg,
  expand_svg
} from "../../svg_icon";

const GroupsArchive = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const tabsActive = useSelector((state) => state.tab_manager.tabsActive);
  const groupsArchive = useSelector((state) => state.archive_manager.groups);
  const groups = useSelector((state) => state.group_manager.groups);
  const keySearch = useSelector((state) => state.app_manager.key_search);
  const groupsEditTitle = useSelector((state) => state.app_manager.id_editing_title_groups_archive);
  const idGroupEditingColor = useSelector((state) => state.app_manager.id_editing_color_group_archive);
  const idGroupShowContextMenu = useSelector((state) => state.app_manager.id_group_archive_show_context_menu);
  const isShowContextMenu = useSelector((state) => state.app_manager.is_show_context_menu_tab_list_groups_archive);
  const contextMenuPosition = useSelector((state) => state.app_manager.context_menu_position_tab_list_groups_archive);

  // State
  const [tabsSelected, setTabsSelected] = useState([]);
  const [showGroupMoveTo, setShowGroupMoveTo] = useState(false);
  const [positionMenuChild, setPositionMenuChild] = useState({ isLeft: true, isTop: true });

  // Process func
  const isTabActive = (tab) => {
    return !!tabsActive.find((t) => t.id === tab.id);
  };
  const isGroupExist = async (group) => {
    return !!ChromeExt.getGroupById(group.id);
  };
  const filterGroupsBeforeShow = (groups) => {
    if (keySearch) {
      // Filter tabs in group
      groups = groups.map((group) => {
        let tabs = group.tabs.filter((tab) =>
          tab.title.toLowerCase().includes(keySearch.toLowerCase()) || tab.url.toLowerCase().includes(keySearch.toLowerCase())
        );
        return { ...group, tabs };
      });
    }

    // Remove group empty
    groups = groups.filter((group) => {
      let tabs = group.tabs;

      if (!tabs || tabs.length === 0) {

        if (!keySearch) {
          ChromeExt.storage.removeGroupsArchiveById(group.id);
        }

        return false;
      }

      return true;
    });

    return groups;
  };
  const processImageError = (event) => {
    event.target.src = getIconUrl("chrome://favicon");
  };
  const getGroupCurrentOfTabsSelected = () => {
    let groupsId = tabsSelected.map((tab) => tab.groupId);
    let isSameGroup = groupsId.every((id) => id === groupsId[0]);
    if (!isSameGroup) return null;

    let groupId = groupsId[0];
    let groupCurrent = groups.find((group) => group.id === groupId);
    return groupCurrent;
  };
  const getIdGroupOfTabsSelected = () => {
    let groupsId = tabsSelected.map((tab) => tab.groupId);
    let isSameGroup = groupsId.every((id) => id === groupsId[0]);
    if (!isSameGroup) return null;

    let groupId = groupsId[0];
    return groupId;
  };
  const isShowActionMenuByTabsSelected = (nameAction) => {
    let groupCurrent = getGroupCurrentOfTabsSelected();

    switch (nameAction) {
      case 'handlerAddNewTabLeftOrRight':
      case 'handlerReloadTabsSelected':
      case 'handlerRemoveTabOutOfGroup':
      case 'handlerCloseTabsSelected':
        return groupCurrent ? true : false;

      default:
        break;
    }

    return true;
  };

  // Handler func
  const handlerClickHeaderGroup = async (event, group) => {
    let { target } = event;
    if (!target.classList.contains("group-card-header")) return;

    // For sure group exist
    let isGroupCurrent = await ChromeExt.getGroupById(group.id, true);
    if (group.is_current) {
      if (!isGroupCurrent) {
        ChromeExt.storage.updateFlagIsCurrentGroupArchive(group.id, false);
        dispatch(setFlagIsCurrentGroupArchive({ id: group.id, is_current: false }));
      }
      else {
        ChromeExt.collapseGroupAndCurrentWindow(group.id, !group.collapsed);
      }
    }
    else {
      // Dispatch action collapse group
      ChromeExt.storage.updateCollapsedGroupArchive(group.id, !group.collapsed);
      dispatch(setCollapseGroupArchive({ id: group.id, collapsed: !group.collapsed }));
    }

    // Close color setting
    if (group.id != idGroupEditingColor) {
      dispatch(setIdEditingColorGroupArchive(null));
    }
  };
  const handleClickTabItemInGroup = async (event, tab, group) => {
    let { id } = tab;
    let { tabs } = group;
    let { target, shiftKey, ctrlKey } = event;

    let tabsSelectedClone = [...tabsSelected];

    // Clear tabsSelected if id group before not math id group current
    let groupsId = tabsSelectedClone.map((tab) => tab.groupId);
    let isSameGroup = groupsId.every((id) => id === groupsId[0]);
    if (!isSameGroup || groupsId[0] !== group.id) {
      tabsSelectedClone = [];
    }

    let tabExt = await ChromeExt.getTabById(id, true);
    if (tabExt) {
      if (!shiftKey && !ctrlKey) {
        ChromeExt.setTabActiveAndCurrentWindow(tab.id);
      }
    }
    else {
      if (!shiftKey && !ctrlKey) {
        let tabResult = await ChromeExt.createTab({ url: tab.url });
      }
    }

    if (ctrlKey) {
      let index = tabsSelectedClone.findIndex((t) => t.id === tab.id);
      if (index !== -1) {
        setTabsSelected(tabsSelectedClone.filter((t) => t.id !== tab.id));
      }
      else {
        setTabsSelected([...tabsSelectedClone, tab]);
      }
    }
    else if (shiftKey) {
      let index = tabs.findIndex((t) => t.id === tab.id);
      let indexStart = tabs.findIndex((t) => t.id === tabsSelected[0].id);
      let indexEnd = tabs.findIndex((t) => t.id === tabsSelected[tabsSelected.length - 1].id);

      if (index < indexStart) {
        setTabsSelected([...tabs.slice(index, indexStart + 1)]);
      }
      else if (index > indexEnd) {
        setTabsSelected([...tabs.slice(indexStart, index + 1)]);
      }
      else {
        setTabsSelected([...tabs.slice(indexStart, index + 1)]);
      }
    }
    else {
      setTabsSelected([tab]);
    }
  };
  const handlerRemoveGroupArchive = (event, group) => {
    // event.stopPropagation();

    ChromeExt.storage.removeGroupsArchiveById(group.id);
  };
  const handlerCreateGroupWithTabsArchive = async (event, isInThisBrowser, group) => {
    // event.stopPropagation();

    let tabs = [...group.tabs];
    if (isInThisBrowser) {
      let tabIds = [];
      let tabIdNeedUpdateList = [];
      for (let i = 0; i < tabs.length; i++) {
        let { id, url } = tabs[i];
        let tabResult = await ChromeExt.createTab({ url });
        tabIds.push(tabResult.id);

        tabIdNeedUpdateList.push({ oldId: id, newId: tabResult.id });
      }

      // Update tab id in group
      await ChromeExt.storage.updateIdTabsForTabsGroupArchive(group.id, tabIdNeedUpdateList);

      let groupIdResult = await ChromeExt.createGroup({ tabIds });
      ChromeExt.updateGroup(groupIdResult, {
        title: group.title,
        color: group.color,
      });

      await ChromeExt.storage.updateIdGroupsArchive(group.id, groupIdResult);
    }
    else {
      let windowResult = await ChromeExt.createWindow({});
      let windowId = windowResult.id;

      let tabIds = [];
      for (let i = 0; i < tabs.length; i++) {
        let url = tabs[i].url;
        let tabResult = await ChromeExt.createTab({ url, windowId });
        tabIds.push(tabResult.id);
      }

      let groupIdResult = await ChromeExt.createGroup({ tabIds, createProperties: { windowId } });
      ChromeExt.updateGroup(groupIdResult, {
        title: group.title,
        color: group.color,
      });

      await ChromeExt.storage.updateIdGroupsArchive(group.id, groupIdResult);
    }
  };
  const handlerShowContextMenuGroupArchive = (event, group) => {
    // event.stopPropagation();
    let { id } = group;
    dispatch(setIdGroupArchiveShowContextMenu((idGroupShowContextMenu === id) ? null : id));
  };
  const handlerClickShowEditTitleGroup = (event, group) => {
    let groupEditingTitleGroup;
    // Add group id to list edit title
    if (!groupsEditTitle.includes(group.id)) {
      groupEditingTitleGroup = [...groupsEditTitle, group.id];

      setTimeout(() => {
        let input = document.querySelector(".group-title-input");
        input.focus();
      }, 100);
    } else {
      ChromeExt.setTitleGroup(group.id, group.title);
      groupEditingTitleGroup = groupsEditTitle.filter((id) => id !== group.id);
    }

    dispatch(setIdEditingTitleGroupsArchive(groupEditingTitleGroup));
  };
  const handlerClickShowConfigColorGroup = (group) => {
    let { id } = group;
    dispatch(setIdEditingColorGroupArchive((idGroupEditingColor === id) ? null : id));
  };
  const handlerClickItemSettingColorGroup = (group, color) => {
    ChromeExt.updateGroup(group.id, { color });
    dispatch(setColorGroupArchive({ id: group.id, color }));
  };

  const handlerShowGroupMoveTo = async () => {
    setShowGroupMoveTo(!showGroupMoveTo);
  };
  const handlerMoveTabsToGroupSelected = async (groupId) => {
    let groupCurrent = await getGroupCurrentOfTabsSelected();

    let tabIds = [];
    if (groupCurrent) {
      tabIds = tabsSelected.map((tab) => tab.id);
    }
    else {
      tabIds = [];
      for (let i = 0; i < tabsSelected.length; i++) {
        let url = tabsSelected[i].url;
        let tabResult = await ChromeExt.createTab({ url });
        tabIds.push(tabResult.id);
      }
    }

    // Remove tabs selected in group archive and update to storage
    let groundIdOfTabsSelected = getIdGroupOfTabsSelected();
    let tabIdsSelected = tabsSelected.map((tab) => tab.id);
    let tabsOfGroupSelected = groupsArchive.find((group) => group.id === groundIdOfTabsSelected).tabs;
    let tabsNew = tabsOfGroupSelected.filter((tab) => !tabIdsSelected.includes(tab.id));
    await ChromeExt.storage.updateTabsInGroupsArchive(groundIdOfTabsSelected, tabsNew);

    // Add tabs in group archive and update to storage
    let tabsOfGroupMoveTo = groupsArchive.find((group) => group.id === groupId).tabs;
    let tabsNewGroup = [...tabsOfGroupMoveTo, ...tabsSelected];
    await ChromeExt.storage.updateTabsInGroupsArchive(groupId, tabsNewGroup);

    await ChromeExt.moveTabsToGroup(tabIds, groupId);

    // Clear tabsSelected
    setTabsSelected([]);
  };
  const handlerRemoveTabOutOfGroup = async () => {
    let groupCurrent = getGroupCurrentOfTabsSelected();
    let groupId = groupCurrent.id;

    let tabIds = tabsSelected.map((tab) => tab.id);
    let tabs = groupCurrent.tabs;

    let tabsNew = tabs.filter((tab) => !tabIds.includes(tab.id));
    ChromeExt.storage.updateTabsInGroupsArchive(groupId, tabsNew);

    ChromeExt.ungroup(groupId, tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };

  const handlerContextMenuTabItem = async (event, { ...tab }, { ...ground }) => {
    let { clientX, clientY } = event;
    event.preventDefault();

    let index = tabsSelected.findIndex((t) => t.id === tab.id);
    if (tabsSelected.length === 0 || index === -1) {

      // Check properties groupId of tab
      if (!tab.groupId) tab.groupId = ground.id;

      setTabsSelected([tab]);
    }

    // Await to get element context menu
    let contextMenuEl = await new Promise((resolve, reject) => {
      let timeInterval = setInterval(() => {
        let contextMenuEl = document.querySelector(".context-menu-tab-list-groups-archive");
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
      if (clientY + selectGroupHeight >= innerHeight - 200) {
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

    dispatch(setIsShowContextMenuTabListGroupsArchive(true));
    dispatch(setContextMenuPositionTabListGroupsArchive({ x: clientX, y: clientY }));
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
    dispatch(setIsShowContextMenuTabListGroupsArchive(false));
  };
  const handlerCreateGroupTabsSelected = async () => {
    let groupCurrent = await getGroupCurrentOfTabsSelected();

    let tabIds;
    let tabsToGroup = [...tabsSelected];
    if (groupCurrent) {
      tabIds = tabsToGroup.map((tab) => tab.id);
    }
    else {
      tabIds = [];
      for (let i = 0; i < tabsToGroup.length; i++) {
        let url = tabsToGroup[i].url;
        let tabResult = await ChromeExt.createTab({ url });
        tabIds.push(tabResult.id);
      }
    }

    let groupIdResult = await ChromeExt.createGroup({ tabIds });

    // Update color for group
    let color = COLOR_SETTING[Math.floor(Math.random() * COLOR_SETTING.length)];
    ChromeExt.updateGroup(groupIdResult, { color });

    // Clear tabsSelected
    setTabsSelected([]);
    dispatch(setIsShowContextMenuTabListGroupsArchive(false));

    dispatch(setIdEditingTitleGroupsArchive([groupIdResult]));
    let timeInterval = setInterval(() => {
      let input = document.querySelector(`div[group-id="${groupIdResult}"] .group-title-input`);
      if (input) {
        clearInterval(timeInterval);
        input.focus();
      }
    }, 100);

  };
  const handlerReloadTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.reloadTabs(tabIds);

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
  const handlerDeleteTabsSelected = () => {
    let groupsId = tabsSelected.map((tab) => tab.groupId);
    let isSameGroup = groupsId.every((id) => id === groupsId[0]);
    if (!isSameGroup) return null;

    let groupId = groupsId[0];
    let group = groupsArchive.find((g) => g.id === groupId);
    if (!group) return null;

    // Remove tabs in group archive and update to storage
    let tabIdsDelete = tabsSelected.map((tab) => tab.id);
    let tabs = group.tabs;

    let tabsNew = tabs.filter((tab) => !tabIdsDelete.includes(tab.id));
    ChromeExt.storage.updateTabsInGroupsArchive(groupId, tabsNew);

    // Clear tabsSelected
    setTabsSelected([]);

    if (group.is_current) {
      ChromeExt.removeTabs(tabIdsDelete);
    }
  };
  const handlerCloseTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.removeTabs(tabIds);

    // Clear tabsSelected
    setTabsSelected([]);
  };

  const handlerAddTabToGroup = async () => {
    let groupId = idGroupShowContextMenu;
    if (!groupId) return;

    let tabResult = await ChromeExt.createTab({});
    let tabId = tabResult.id;

    ChromeExt.addTabsToGroup(groupId, [tabId]);
  };
  const handlerUnGroupTabs = () => {
    const groupId = idGroupShowContextMenu;
    if (!groupId) return;

    let group = groups.find((g) => g.id === groupId);
    if (!group) return;

    let tabIds = group.tabs.map((tab) => tab.id);

    let tabIdNeedUpdateList = tabIds.map((id) => ({ oldId: id, newId: randomBetween() }));
    ChromeExt.storage.updateIdTabsForTabsGroupArchive(groupId, tabIdNeedUpdateList);

    ChromeExt.ungroup(groupId, tabIds);
  };
  const handlerDeleteGroupArchive = () => {
    const groupId = idGroupShowContextMenu;
    if (!groupId) return;

    let group = groups.find((g) => g.id === groupId);
    if (!group) return;

    let tabIds = group.tabs.map((tab) => tab.id);
    ChromeExt.removeTabs(tabIds);

    ChromeExt.storage.removeGroupsArchiveById(groupId);
  };

  // Constants
  const MENU_CONTEXT_GROUP = [
    { label: t('LABEL_ADD_TAB_TO_GROUP'), icon: add_svg, action: handlerAddTabToGroup },
    { label: t('LABEL_UN_GROUP_TABS'), icon: expand_svg, action: handlerUnGroupTabs },
    { type: 'divider' },
    { label: t('LABEL_DELETE_GROUP'), icon: delete_svg, action: handlerDeleteGroupArchive },
  ];

  // Constants

  // Lifecycle
  useEffect(() => {
    setShowGroupMoveTo(false);

    return () => { };
  }, [isShowContextMenu, contextMenuPosition]);

  return (
    <>
      {/* List card group */}
      <div className="group-list">
        {filterGroupsBeforeShow(groupsArchive).length > 0 && (
          <label>
            <div className="group-title flex items-center mx-2 mt-2 mb-1">
              <div className="mr-1 font-semibold">{t('LABEL_GROUPS_ARCHIVE')}</div>
              <div className="total-tab">({filterGroupsBeforeShow(groupsArchive).length})</div>
            </div>
          </label>
        )}
        {filterGroupsBeforeShow(groupsArchive).map((group) => (
          <div key={group.id} group-id={group.id} className={`group-card mx-2 mb-2 shadow-md rounded-bl-md rounded-br-md overflow-visible ${group.color}`}>
            <div className={`group-card-header action flex items-center justify-between px-2 py-2 cursor-pointer transition-all ${group.collapsed ? "rounded-md" : "rounded-tl-md rounded-tr-md "}`}
              onClick={(event) => handlerClickHeaderGroup(event, group)}
            >
              <div className={`w-full mr-2 flex items-center select-none ${!groupsEditTitle.includes(group.id) ? "pointer-events-none" : ""}`}>
                <div className={`${group.collapsed ? "rotate-0" : "rotate-180"} transition w-4 h-4 mr-2 flex align-center justify-center`}>
                  {expand_more_svg()}
                </div>

                {!groupsEditTitle.includes(group.id) ? (
                  <div className="group-title flex items-center">
                    <div className="mr-1 font-semibold">{group.title}</div>
                    <div className="total-tab">({group.tabs.length})</div>
                  </div>
                ) :
                  (
                    <input type="text" value={group.title} className="group-title-input w-full border-b border-white bg-transparent focus:outline-none"
                      onKeyDown={(event) => {
                        // Enter to save
                        if (event.key === "Enter") {
                          let groupEditingTitleGroup = groupsEditTitle.filter((id) => id !== group.id);
                          dispatch(setIdEditingTitleGroupsArchive(groupEditingTitleGroup));
                          ChromeExt.setTitleGroup(group.id, group.title);
                        }
                      }}
                      onBlur={(event) => {
                        let groupEditingTitleGroup = groupsEditTitle.filter((id) => id !== group.id);
                        dispatch(setIdEditingTitleGroupsArchive(groupEditingTitleGroup));
                        ChromeExt.setTitleGroup(group.id, group.title);
                      }}
                      onChange={(event) => {
                        let title = event.target.value;
                        dispatch(setTitleGroupArchive({ id: group.id, title }));
                      }}
                    />
                  )}
              </div>
              <div className="text-xs select-none flex items-center">
                <div className="toolbar-top flex items-center">
                  {!group.is_current ?
                    (<>
                      <div className="create-group-and-tabs-archive ml-2" onClick={(event) => handlerCreateGroupWithTabsArchive(event, true, group)}>
                        <div className="pointer-events-none">{open_in_browser_svg()}</div>
                      </div>
                      <div className="create-group-and-tabs-archive ml-2" onClick={(event) => handlerCreateGroupWithTabsArchive(event, false, group)}>
                        <div className="pointer-events-none">
                          {open_in_new_svg()}
                        </div>
                      </div>
                      <div className="remove-group-archive ml-2" onClick={(event) => handlerRemoveGroupArchive(event, group)}>
                        <div className="pointer-events-none">{close_svg()}</div>
                      </div>
                    </>) :
                    (<>
                      <div className="action edit-title-group ml-2" onClick={(event) => handlerClickShowEditTitleGroup(event, group)}>
                        <div className="pointer-events-none">{edit_svg()}</div>
                      </div>
                      <div className="action edit-color-group ml-2 relative" onClick={(event) => handlerClickShowConfigColorGroup(group)}>
                        <div className="pointer-events-none">{palette_svg()}</div>
                        {idGroupEditingColor && idGroupEditingColor == group.id && (
                          <div className="color-setting absolute z-10 top-3 right-1 w-20 grid grid-cols-3 bg-white shadow-md rounded-md">
                            {COLOR_SETTING.map((color) => (
                              <div key={color} className={`action color-item flex items-center justify-center w-4 h-4 rounded-full m-2 cursor-pointer ${color} ${color === group.color ? "active" : ""}`}
                                onClick={() => {
                                  handlerClickItemSettingColorGroup(group, color);
                                }}
                              >
                                {done_svg()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="context-menu-group-archive ml-2 relative" onClick={(event) => handlerShowContextMenuGroupArchive(event, group)}>
                        <div className="pointer-events-none">{more_vert_svg()}</div>
                        {idGroupShowContextMenu && (idGroupShowContextMenu == group.id) && (
                          <div className="w-max absolute z-10 top-3 right-1 bg-white text-gray-900 overflow-hidden shadow-menu rounded-md">
                            {MENU_CONTEXT_GROUP.map((item, index) => (
                              <>
                                {
                                  (item.type === 'divider') ? <div key={index} className="divider"></div>
                                    : (<div key={index}
                                      className="action context-menu-item flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        item.action();
                                        dispatch(setIdGroupArchiveShowContextMenu(null));
                                      }}
                                    >
                                      <div className="icon w-4 h-4">
                                        {item.icon()}
                                      </div>
                                      <div className="text ml-2">
                                        {item.label}
                                      </div>
                                    </div>)
                                }
                              </>
                            )
                            )}
                          </div>
                        )}
                      </div>
                    </>)
                  }
                </div>
              </div>
            </div>

            <div className="group-card-body overflow-hidden"
              style={{
                transition: "0.25s all",
                height: group.collapsed ? 0 : group.tabs.length * 50,
              }}
            >
              <div className="tab-list">
                {group.tabs.map((tab) => (
                  <div key={tab.id}
                    className={`action tab-item tab-item-in-group-archive group-card-item action flex items-center px-4 py-2 select-none relative
                      status-${tab.status}
                      ${isTabActive(tab) ? "active" : ""}
                      ${tabsSelected.find((t) => t.id === tab.id) ? "selected" : ""} `}
                    onClick={(event) => handleClickTabItemInGroup(event, tab, group)}
                    onContextMenu={(event) => handlerContextMenuTabItem(event, tab, group)}
                  >
                    <img src={tab.favIconUrl || getIconUrl(tab.url)} alt={`${tab.title} icon`} className="w-6 h-6 mr-2 pointer-events-none" onError={processImageError} />
                    <div className="overflow-hidden pointer-events-none">
                      <div className="title text-gray-500 font-semibold truncate"> {tab.title} </div>
                      <div className="text-xs text-gray-500 truncate"> {tab.url} </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context menu */}
      <div className={`context-menu-tab-list-groups-archive shadow-menu absolute bg-white rounded-md
                    ${!isShowContextMenu ? "opacity-0 -z-50" : "z-10"}
                    ${showGroupMoveTo ? "overflow-visible" : "overflow-hidden"}`
      }
        style={{
          top: contextMenuPosition.y,
          left: contextMenuPosition.x,
        }}
      >
        {isShowActionMenuByTabsSelected('handlerAddNewTabLeftOrRight') && (
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
        )}

        {isShowActionMenuByTabsSelected('handlerAddNewTabLeftOrRight') && (
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
        )}

        {isShowActionMenuByTabsSelected('handlerCreateGroupTabsSelected') && (
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
        )}

        {isShowActionMenuByTabsSelected('handlerReloadTabsSelected') && (
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
        )}

        {isShowActionMenuByTabsSelected('handlerCopyUrlTabsSelected') && (
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
        )}

        <div className="divider"></div>

        {isShowActionMenuByTabsSelected('handlerMoveTabsToGroupSelected') && (
          <div className="action context-menu-item-groups-archive flex items-center pl-2 pr-2 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => { handlerShowGroupMoveTo(); }}
          >
            <div className="icon flex items-center justify-center w-4 h-4 pointer-events-none">
              {move_to_inbox_svg()}
            </div>
            <div className="text ml-3 pointer-events-none">
              {t('LABEL_MOVE_TAB_TO_GROUP')}
            </div>
            <div className="icon context-menu-item-groups-archive-open flex items-center justify-center w-4 h-4 ml-2 pl-2 border-l-gray-200 border-l relative">
              <div className="rotate-270 pointer-events-none">
                {expand_more_svg()}
              </div>

              <div className={`select-group shadow-menu absolute bg-white rounded-md overflow-hidden shadow-md z-50 w-max
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
        )}

        {isShowActionMenuByTabsSelected('handlerRemoveTabOutOfGroup') && (
          <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => { handlerRemoveTabOutOfGroup(); }}
          >
            <div className="icon un-inbox flex items-center justify-center w-4 h-4">
              {move_to_inbox_svg()}
            </div>
            <div className="text ml-2">
              {t('LABEL_REMOVE_FROM_GROUP')}
            </div>
          </div>
        )}

        <div className="divider"></div>

        {isShowActionMenuByTabsSelected('handlerDeleteTabsSelected') && (
          <div className="action flex items-center px-2 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => { handlerDeleteTabsSelected(); }}
          >
            <div className="icon flex items-center justify-center w-4 h-4">
              {delete_svg()}
            </div>
            <div className="text ml-2">
              {t('LABEL_DELETE_TABS')}
            </div>
          </div>
        )}

        {isShowActionMenuByTabsSelected('handlerCloseTabsSelected') && (
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
        )}
      </div>
    </>
  );
};

export default GroupsArchive;
