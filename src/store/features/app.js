import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  window_active_show_tab_list: '',
  key_search: '',

  // groups_archive
  id_editing_color_group_archive: null,
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

    // groups_archive
    setIdEditingColorGroupArchive: (state, action) => {
      state.id_editing_color_group_archive = action.payload;
    },
  },
})

export const {
  setWindowActiveShowTabList,
  setKeySearch,
  setIdEditingColorGroupArchive
} = counterSlice.actions;

export default counterSlice.reducer