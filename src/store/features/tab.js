import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tabsActive: [],
  tabs: []
}

export const counterSlice = createSlice({
  name: 'tabs_manager',
  initialState,
  reducers: {
    setTabs: (state, action) => {
      state.tabs = action.payload
    },
    setTabsActive: (state, action) => {
      state.tabsActive = action.payload
    },
  },
})

export const { setTabs, setTabsActive } = counterSlice.actions

export default counterSlice.reducer