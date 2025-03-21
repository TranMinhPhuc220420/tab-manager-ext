import { createSlice } from '@reduxjs/toolkit'
import { setTitleGroup } from './group'

const initialState = {
  groups: []
}

export const counterSlice = createSlice({
  name: 'archive_manager',
  initialState,
  reducers: {
    setGroupsArchive: (state, action) => {
      state.groups = action.payload
    },
    setCollapseGroupArchive: (state, action) => {
      let { id, collapsed } = action.payload;

      state.groups = state.groups.map((group) => {
        if (group.id === id) {
          group.collapsed = collapsed;
        }
        return group;
      })
    },
    setTitleGroupArchive: (state, action) => {
      state.groups = state.groups.map(group => {
        if (group.id === action.payload.id) {
          group.title = action.payload.title
        }
        return group
      })
    },
    setColorGroupArchive: (state, action) => {
      state.groups = state.groups.map(group => {
        if (group.id === action.payload.id) {
          group.color = action.payload.color
        }
        return group
      })
    },
    setFlagIsCurrentGroupArchive: (state, action) => {
      state.groups = state.groups.map(group => {
        if (group.id === action.payload.id) {
          group.is_current = action.payload.is_current
        }
        return group
      })
    },
  },
})

export const { setGroupsArchive, setCollapseGroupArchive, setTitleGroupArchive, setColorGroupArchive, setFlagIsCurrentGroupArchive } = counterSlice.actions
export default counterSlice.reducer