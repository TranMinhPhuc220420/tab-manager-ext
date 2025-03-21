import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  current: null,
  windows: []
}

export const counterSlice = createSlice({
  name: 'window_manager',
  initialState,
  reducers: {
    setWindows: (state, action) => {
      state.windows = action.payload
    },
    setCurrent: (state, action) => {
      state.current = action.payload
    },
  },
})

export const { setWindows, setCurrent } = counterSlice.actions

export default counterSlice.reducer