set incDir=ext
set srcDir=dist

call npm run build

copy %incDir%\* %srcDir%\*
