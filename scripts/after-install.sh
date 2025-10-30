#!/bin/bash
set -e

APP_NAME="beerbear"
INSTALL_DIR="/opt/beerbear"
BIN_PATH="/usr/local/bin/$APP_NAME"
DESKTOP_ENTRY="/usr/share/applications/${APP_NAME}.desktop"

echo "Post-install script running for $APP_NAME ..."

# 确保安装目录存在
if [ -d "$INSTALL_DIR" ]; then
  echo "Application installed to $INSTALL_DIR"
else
  echo "Error: $INSTALL_DIR not found"
  exit 1
fi

# 创建命令行启动软链接
if [ -f "$INSTALL_DIR/$APP_NAME" ]; then
  ln -sf "$INSTALL_DIR/$APP_NAME" "$BIN_PATH"
  echo "Linked command: $BIN_PATH"
else
  echo "Warning: Executable not found at $INSTALL_DIR/$APP_NAME"
fi

# 复制 desktop 文件到系统目录（如果 electron-builder 没自动安装）
if [ -f "/opt/$APP_NAME/build/bear.desktop" ]; then
  cp "/opt/$APP_NAME/build/bear.desktop" "$DESKTOP_ENTRY"
  chmod 644 "$DESKTOP_ENTRY"
  echo "Desktop entry installed to $DESKTOP_ENTRY"
fi

# 更新图标缓存（可选）
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database >/usr/share/applications || true
fi

echo "$APP_NAME installation post-script completed successfully."
exit 0
