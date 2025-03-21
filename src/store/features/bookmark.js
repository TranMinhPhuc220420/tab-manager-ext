import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  groups: []
}

export const counterSlice = createSlice({
  name: 'bookmark_manager',
  initialState,
  reducers: {
    setBookmarks: (state, action) => {
      state.groups = action.payload
    },
  },
})

export const { setBookmarks } = counterSlice.actions

export default counterSlice.reducer