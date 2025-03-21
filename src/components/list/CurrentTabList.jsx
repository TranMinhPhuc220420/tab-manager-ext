import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setGroups, setTitleGroup } from "../../store/features/group";

import { getIconUrl } from "../../utils";
import ChromeExt from "../../chrome_ext";

import {
  palette_svg, edit_svg, bookmarks_svg, expand_more_svg, done_svg, create_new_folder_svg,
} from "../../svg_icon";

import FormSearch from "../form/FormSearch";

// Redux
const CurrentTabList = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const tabsActive = useSelector((state) => state.tab_manager.tabsActive);
  const tabs = useSelector((state) => state.tab_manager.tabs);
  const groups = useSelector((state) => state.group_manager.groups); // { id, title, color, collapsed, windowId, tabs: [] }
  const windowActive = useSelector((state) => state.app_manager.window_active_show_tab_list);
  const keySearch = useSelector((state) => state.app_manager.key_search);

  // State
  const [tabsSelected, setTabsSelected] = useState([]);
  const [groupsEditTitle, setGroupsEditTitle] = useState([]);
  const [showDoneIcon, setShowDoneIcon] = useState([]);
  const [groupConfigColor, setGroupConfigColor] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0, });

  // Process func
  const isTabActive = (tab) => {
    return !!tabsActive.find((t) => t.id === tab.id);
  };
  const findTabActiveByWindowId = (windowId) => {
    return tabsActive.find((tab) => tab.windowId === windowId);
  };
  const filterGroupsBeforeShow = (groups) => {
    groups = groups.filter(
      (group) => windowActive == "all_window" || group.windowId === windowActive
    );

    if (keySearch) {
      // groups = groups.filter((group) => {
      //   // Search by title group
      //   if (group.title.toLowerCase().includes(keySearch.toLowerCase())) {
      //     return true;
      //   }
      //   // Search by title tab
      //   let tabs = group.tabs.filter((tab) =>
      //     tab.title.toLowerCase().includes(keySearch.toLowerCase())
      //   );
      //   return tabs.length > 0;
      // });

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
    setShowContextMenu(false);
    setGroupConfigColor(null);
  };
  const handleClickTabItem = (event, tab) => {
    let { target, shiftKey, ctrlKey } = event;
    setShowContextMenu(false);

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
  const handleClickTabItemInGroup = (event, tab) => {
    let { target, shiftKey, ctrlKey } = event;
    setShowContextMenu(false);

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
      setTabsSelected([]); // clear selected

      ChromeExt.setTabActiveAndCurrentWindow(tab.id);
    }
  };
  const handlerContextMenuTabItem = (event, tab) => {
    event.preventDefault();
    setShowContextMenu(true);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };
  const handlerCreateGroupTabsSelected = () => {
    let tabIds = tabsSelected.map((tab) => tab.id);
    ChromeExt.createGroup({ tabIds: tabIds });
  };
  const handlerClickHeaderGroup = (event, group) => {
    let { target } = event;
    if (!target.classList.contains("group-card-header")) return;

    ChromeExt.collapseGroupAndCurrentWindow(group.id, !group.collapsed);
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
  const handlerClickAddGroupToBookmark = (event, group) => {
    let params = {
      title: group.title,
      color: group.color,
      tabs: group.tabs.map((tab) => ({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
      })),
    };
    ChromeExt.storage.addBookmarkGroup(params);

    // Add done icon and after 3s remove it
    setShowDoneIcon([...showDoneIcon, group.id]);
    setTimeout(() => {
      setShowDoneIcon(showDoneIcon.filter((id) => id !== group.id));
    }, 2000);
  };
  const handlerClickShowConfigColorGroup = (group) => {
    setGroupConfigColor(group);
  };
  const handlerClickItemSettingColorGroup = (group, color) => {
    ChromeExt.updateGroup(group.id, {
      color,
    });
  };

  // Constants
  const CONTEXT_MENU_ITEMS = [
    { label: "Create group", icon: create_new_folder_svg, action: handlerCreateGroupTabsSelected },
  ];
  const COLOR_SETTING = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",];

  // Lifecycle
  useEffect(() => {
    return () => { };
  }, []);

  return (
    <div onClick={(event) => { handlerClickOutside(event); }}>

      {/* Form position absolute top */}
      {/* <div className="flex items-center sticky top-0 z-10">
        <FormSearch />
      </div> */}

      {/* List card group */}
      {/* <div className="group-list">
        {filterGroupsBeforeShow(groups).length > 0 && (
          <label>
            <div className="group-title flex items-center mx-2 mt-2 mb-1">
              <div className="mr-1 font-semibold">Groups</div>
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
                          ChromeExt.setTitleGroup(group.id, group.title);
                          setGroupsEditTitle(
                            groupsEditTitle.filter((id) => id !== group.id)
                          );
                        }
                      }}
                      onChange={(event) => {
                        let title = event.target.value;
                        dispatch(setTitleGroup({ id: group.id, title }));
                      }}
                    />
                  )}
              </div>
              <div className="text-xs select-none flex items-center">
                <div className="toolbar-top flex items-center">
                  <div className="action edit-title-group ml-2" onClick={(event) => handlerClickShowEditTitleGroup(event, group)}>
                    <div className="pointer-events-none">{edit_svg()}</div>
                  </div>

                  <div className="action edit-title-group ml-2 relative" onClick={(event) => handlerClickShowConfigColorGroup(group)}>
                    <div className="pointer-events-none">{palette_svg()}</div>
                    {groupConfigColor && groupConfigColor.id == group.id && (
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

                  <div className="action add-group-to-bookmark ml-2" onClick={(event) => handlerClickAddGroupToBookmark(event, group)}>
                    <div className="pointer-events-none">
                      {showDoneIcon.includes(group.id) ? done_svg() : bookmarks_svg()}
                    </div>
                  </div>
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
                  className={`action group-card-item action flex items-center px-4 py-2 select-none 
                    ${isTabActive(tab) ? "active" : ""}
                    ${tabsSelected.find((t) => t.id === tab.id) ? "active" : ""} `}
                  onClick={(event) => handleClickTabItemInGroup(event, tab)}
                >
                  <img src={tab.favIconUrl || getIconUrl(tab.url)} alt={`${tab.title} icon`} className="w-6 h-6 mr-2 event-none" />
                  <div className="overflow-hidden event-none">
                    <div className="title text-gray-500 font-semibold truncate"> {tab.title} </div>
                    <div className="text-xs text-gray-500 truncate"> {tab.url} </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div> */}

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
      {showContextMenu && (
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
                setShowContextMenu(false);
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
