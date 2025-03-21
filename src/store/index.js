import { configureStore } from '@reduxjs/toolkit'

import appReducer from './features/app';
import tabReducer from './features/tab';
import groupReducer from './features/group';
import bookmarkReducer from './features/bookmark';
import windowReducer from './features/window';
import archiveReducer from './features/archive';

export const store = configureStore({
  reducer: {
    app_manager: appReducer,
    tab_manager: tabReducer,
    group_manager: groupReducer,
    bookmark_manager: bookmarkReducer,
    window_manager: windowReducer,
    archive_manager: archiveReducer,
  },
})