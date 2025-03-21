import React, { useEffect, useState } from "react";

import { useSelector, useDispatch } from "react-redux";
import { setBookmarks } from "../../store/features/bookmark";

import { getIconUrl } from "../../utils";

import {
  expand_more_svg, open_in_browser_svg, open_in_new_svg, close_svg,
} from "../../svg_icon";

import FormSearch from "../form/FormSearch";

import ChromeExt from "../../chrome_ext";

const BookmarkList = () => {
  // Redux
  const dispatch = useDispatch();
  const groupBookmarks = useSelector((state) => state.bookmark_manager.groups);
  const keySearch = useSelector((state) => state.app_manager.key_search);

  // State
  const [groupsOpen, setGroupsOpen] = useState([]);

  // Process func
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

  // Handler func
  const handlerClickHeaderGroup = (event, index) => {
    let { target } = event;
    if (target.classList.contains("remove-group-bookmark")) return;
    if (target.classList.contains("create-group-and-tabs-bookmark")) return;

    if (groupsOpen.includes(index)) {
      setGroupsOpen(groupsOpen.filter((item) => item !== index));
    } else {
      setGroupsOpen([...groupsOpen, index]);
    }
  };
  const handleClickTabItemInGroup = (event, indexGroup, indexTab) => {
    let newGroups = [...groupBookmarks];
    let group = newGroups[indexGroup];
    let tab = group.tabs[indexTab];

    ChromeExt.createTab({ url: tab.url });
  };
  const handlerRemoveGroupBookmark = (event, index) => {
    event.stopPropagation();
    let newGroups = groupBookmarks.filter((item, i) => i !== index);

    ChromeExt.storage.saveBookmarkGroup(newGroups);
    // dispatch(setBookmarks(newGroups));
  };
  const handlerCreateGroupWithTabsBookmark = async (event, isInThisBrowser, group) => {
    event.stopPropagation();

    let tabs = [...group.tabs];

    if (isInThisBrowser) {
      let tabIds = [];
      for (let i = 0; i < tabs.length; i++) {
        let tabResult = await ChromeExt.createTab({ url: tabs[i].url });
        tabIds.push(tabResult.id);
      }

      let groupIdResult = await ChromeExt.createGroup({ tabIds });
      ChromeExt.updateGroup(groupIdResult, {
        title: group.title,
        color: group.color,
      });
    } else {
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
    }
  };

  // Constants

  // Lifecycle
  useEffect(() => {
    return () => { };
  }, []);

  return (
    <>
      {/* Form position absolute top */}
      <div className="flex items-center sticky top-0 z-10">
        <FormSearch />
      </div>

      {/* List card group */}
      <div className="group-list">
        {filterGroupsBeforeShow(groupBookmarks).map((group, index) => (
          <div key={index} className={`group-card mx-2 my-2 rounded-md shadow-md overflow-hidden ${group.color}`}>
            <div className="group-card-header flex items-center justify-between px-2 py-2 cursor-pointer"
              onClick={(event) => handlerClickHeaderGroup(event, index)}
            >
              <div className="w-full mr-2 flex items-center select-none">
                <div className="group-title flex items-center">
                  <div className={`${groupsOpen.indexOf(index) == -1 ? "rotate-0" : "rotate-180"} transition w-4 h-4 mr-2 flex align-center justify-center`}>
                    {expand_more_svg()}
                  </div>
                  <div className="mr-1 font-semibold">{group.title}</div>
                  <div className="total-tab">({group.tabs.length})</div>
                </div>
              </div>
              <div className="text-xs select-none flex items-center">
                <div className="toolbar-top flex items-center">
                  <div className="create-group-and-tabs-bookmark ml-2" onClick={(event) => handlerCreateGroupWithTabsBookmark(event, true, group)}>
                    <div className="pointer-events-none">
                      {open_in_browser_svg()}
                    </div>
                  </div>
                  <div className="create-group-and-tabs-bookmark ml-2" onClick={(event) => handlerCreateGroupWithTabsBookmark(event, false, group)}>
                    <div className="pointer-events-none">
                      {open_in_new_svg()}
                    </div>
                  </div>
                  <div className="remove-group-bookmark ml-2" onClick={(event) => handlerRemoveGroupBookmark(event, index)}>
                    <div className="pointer-events-none">{close_svg()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group-card-body"
              style={{
                transition: "0.25s all",
                height: groupsOpen.indexOf(index) == -1 ? 0 : group.tabs.length * 50,
              }}
            >
              {group.tabs.map((tab, indexTab) => (
                <div key={indexTab} className={`group-card-item flex items-center px-4 py-2 select-none`} onClick={(event) => handleClickTabItemInGroup(event, index, indexTab)} >
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
      </div>
    </>
  );
};

export default BookmarkList;
