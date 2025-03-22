import React from "react";
import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { setKeySearch } from "../../store/features/app";

import { search_svg, close_svg } from "../../svg_icon";

const FormSearch = () => {
  // i18n
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();
  const keySearch = useSelector((state) => state.app_manager.key_search);

  // Handler func
  const handlerChangeSearch = (event) => {
    dispatch(setKeySearch(event.target.value));
  };

  return (
    <div className="w-full px-2">
      <form className="flex justify-center relative px-3 pt-1">
        <input type="text" placeholder={t('PLACEHOLDER_SEARCH')} value={keySearch} onChange={handlerChangeSearch}
          className="input-search w-full max-w-md py-1 px-2 border-none rounded-md focus:outline-none bg-white"
        />

        <div className="absolute right-5 top-[9px]">
          {keySearch ? (
            <span onClick={() => dispatch(setKeySearch(""))}>
              {close_svg()}
            </span>
          ) : (
            <span>{search_svg()}</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormSearch;
