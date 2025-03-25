set incDir=ext
set srcDir=dist

call npm run build

call ext_build.bat
