import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  window_active_show_tab_list: '',
  key_search: '',

  // current_tab
  is_show_context_menu_current_tab_list: false,
  context_menu_position_current_tab_list: { x: 0, y: 0 },

  // groups_archive
  id_editing_title_groups_archive: [],
  id_editing_color_group_archive: null,
  id_group_archive_show_context_menu: null,
}

export const counterSlice = createSlice({
  name: 'app_manager',
  initialState,
  reducers: {
    setWindowActiveShowTabList: (state, action) => {
      state.window_active_show_tab_list = action.payload;
    },
    setKeySearch: (state, action) => {
      state.key_search = action.payload;
    },

    // current_tab
    setIsShowContextMenuCurrentTabList: (state, action) => {
      state.id_group_archive_show_context_menu = null;

      state.is_show_context_menu_current_tab_list = action.payload;
    },
    setContextMenuPositionCurrentTabList: (state, action) => {
      state.context_menu_position_current_tab_list = action.payload;
    },

    // groups_archive
    setIdEditingTitleGroupsArchive: (state, action) => {
      state.id_editing_title_groups_archive = action.payload;
    },
    setIdEditingColorGroupArchive: (state, action) => {
      state.id_editing_color_group_archive = action.payload;
    },
    setIdGroupArchiveShowContextMenu: (state, action) => {
      state.is_show_context_menu_current_tab_list = false;
      
      state.id_group_archive_show_context_menu = action.payload;
    },

  },
})

export const {
  setWindowActiveShowTabList,
  setKeySearch,

  setIsShowContextMenuCurrentTabList,
  setContextMenuPositionCurrentTabList,
  
  setIdEditingTitleGroupsArchive,
  setIdEditingColorGroupArchive,
  setIdGroupArchiveShowContextMenu,
} = counterSlice.actions;

export default counterSlice.reducer