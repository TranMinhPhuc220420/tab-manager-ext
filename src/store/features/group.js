import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  groups: []
}

export const counterSlice = createSlice({
  name: 'groups_manager',
  initialState,
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload
    },

    setTitleGroup: (state, action) => {
      state.groups = state.groups.map(group => {
        if (group.id === action.payload.id) {
          group.title = action.payload.title
        }
        return group
      })
    },
  },
})

export const { setGroups, setTitleGroup } = counterSlice.actions

export default counterSlice.reducer