#!/bin/bash
set -e

APP_NAME="beerbear"
BIN_PATH="/usr/local/bin/$APP_NAME"
DESKTOP_ENTRY="/usr/share/applications/${APP_NAME}.desktop"

echo "Post-remove script running for $APP_NAME ..."

# 删除软链接
if [ -L "$BIN_PATH" ]; then
  rm -f "$BIN_PATH"
  echo "Removed symlink $BIN_PATH"
fi

# 删除 desktop 文件
if [ -f "$DESKTOP_ENTRY" ]; then
  rm -f "$DESKTOP_ENTRY"
  echo "Removed desktop entry $DESKTOP_ENTRY"
fi

# 更新菜单数据库
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database >/usr/share/applications || true
fi

echo "$APP_NAME removal post-script completed successfully."
exit 0
