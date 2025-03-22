import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setIdEditingColorGroupArchive } from "../../store/features/app";
import { setTitleGroupArchive, setCollapseGroupArchive, setColorGroupArchive, setFlagIsCurrentGroupArchive } from "../../store/features/archive";

import ChromeExt from "../../chrome_ext";
import { getIconUrl } from "../../utils";

import {
  expand_more_svg, open_in_browser_svg, open_in_new_svg, close_svg, more_vert_svg,
  edit_svg, done_svg, palette_svg,
} from "../../svg_icon";

const GroupsArchive = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const tabsActive = useSelector((state) => state.tab_manager.tabsActive);
  const groups = useSelector((state) => state.archive_manager.groups);
  const keySearch = useSelector((state) => state.app_manager.key_search);
  const idGroupEditingColor = useSelector((state) => state.app_manager.id_editing_color_group_archive);

  // State
  const [tabsSelected, setTabsSelected] = useState([]);
  const [groupsEditTitle, setGroupsEditTitle] = useState([]);

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

      // Remove group empty
      groups = groups.filter((group) => group.tabs.length > 0);

    }
    return groups;
  };
  const processImageError = (event) => {
    event.target.src = getIconUrl("chrome://favicon");
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

    let tabExt = await ChromeExt.getTabById(id, true);
    if (tabExt) {
      ChromeExt.setTabActive(id);
    }
    else {
      let tabResult = await ChromeExt.createTab({ url: tab.url });

      // if (group.is_current) {
      //   // Update tab id in group
      //   await ChromeExt.storage.updateIdTabsForTabsGroupArchive(group.id, [{ oldId: id, newId: tabResult.id }]);
      //   await ChromeExt.createGroup({ tabIds: tabResult.id, groupId: group.id });
      // }
    }
  };
  const handlerRemoveGroupArchive = (event, group) => {
    event.stopPropagation();

    ChromeExt.storage.removeGroupsArchiveById(group.id);
  };
  const handlerCreateGroupWithTabsArchive = async (event, isInThisBrowser, group) => {
    event.stopPropagation();

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
    event.stopPropagation();
  };
  const handlerClickShowEditTitleGroup = (event, group) => {
    // Add group id to list edit title
    if (!groupsEditTitle.includes(group.id)) {
      setGroupsEditTitle([...groupsEditTitle, group.id]);

      setTimeout(() => {
        let input = document.querySelector(".group-title-input");
        input.focus();
      }, 100);
    } else {
      ChromeExt.setTitleGroup(group.id, group.title);
      setGroupsEditTitle(groupsEditTitle.filter((id) => id !== group.id));
    }
  };
  const handlerClickShowConfigColorGroup = (group) => {
    dispatch(setIdEditingColorGroupArchive(group.id));
  };
  const handlerClickItemSettingColorGroup = (group, color) => {
    ChromeExt.updateGroup(group.id, { color });
    dispatch(setColorGroupArchive({ id: group.id, color }));
  };

  // Constants
  const COLOR_SETTING = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",];

  // Constants

  // Lifecycle
  useEffect(() => {
    return () => { };
  }, []);

  return (
    <>
      {/* List card group */}
      <div className="group-list">
        {filterGroupsBeforeShow(groups).length > 0 && (
          <label>
            <div className="group-title flex items-center mx-2 mt-2 mb-1">
              <div className="mr-1 font-semibold">{t('LABEL_GROUPS_ARCHIVE')}</div>
              <div className="total-tab">({filterGroupsBeforeShow(groups).length})</div>
            </div>
          </label>
        )}
        {filterGroupsBeforeShow(groups).map((group) => (
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
                          setGroupsEditTitle(groupsEditTitle.filter((id) => id !== group.id));
                          ChromeExt.setTitleGroup(group.id, group.title);
                        }
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

                      <div className="action edit-title-group ml-2 relative" onClick={(event) => handlerClickShowConfigColorGroup(group)}>
                        <div className="pointer-events-none">{palette_svg()}</div>
                        {idGroupEditingColor && idGroupEditingColor == group.id && (
                          <div className="color-setting absolute z-10 top-1 right-1 w-20 grid grid-cols-3 bg-white shadow-md rounded-md">
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
                      <div className="context-menu-group-archive ml-2" onClick={(event) => handlerShowContextMenuGroupArchive(event, group)}>
                        <div className="pointer-events-none">{more_vert_svg()}</div>
                      </div>
                      <div className="remove-group-archive ml-2" onClick={(event) => handlerRemoveGroupArchive(event, group)}>
                        <div className="pointer-events-none">{close_svg()}</div>
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
              {group.tabs.map((tab) => (
                <div key={tab.id}
                  className={`action group-card-item action flex items-center px-4 py-2 select-none relative
                    status-${tab.status}
                    ${isTabActive(tab) ? "active" : ""}
                    ${tabsSelected.find((t) => t.id === tab.id) ? "active" : ""} `}
                  onClick={(event) => handleClickTabItemInGroup(event, tab, group)}
                >
                  <img src={tab.favIconUrl || getIconUrl(tab.url)} alt={`${tab.title} icon`} className="w-6 h-6 mr-2 event-none" onError={processImageError} />
                  <div className="overflow-hidden event-none">
                    <div className="title text-gray-500 font-semibold truncate"> {tab.title} </div>
                    <div className="text-xs text-gray-500 truncate"> {tab.url} </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default GroupsArchive;
