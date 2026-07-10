#!/bin/bash
# LabMaster API - 腾讯云 Lighthouse 部署初始化脚本
# 在 Lighthouse 服务器上以 root 执行

set -e

echo "========================================="
echo "  LabMaster API 服务器部署初始化"
echo "========================================="

# 1. 安装 Node.js 18+ (如果未安装)
if ! command -v node &> /dev/null; then
  echo "[1/5] 安装 Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
else
  echo "[1/5] Node.js 已安装: $(node -v)"
fi

# 2. 安装 PM2 进程管理
echo "[2/5] 安装 PM2..."
npm install -g pm2

# 3. 安装项目依赖
echo "[3/5] 安装项目依赖..."
cd /opt/labmaster-api
npm install --production

# 4. 配置环境变量
echo "[4/5] 配置环境变量..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "请编辑 .env 文件填写数据库连接信息:"
  echo "  nano .env"
fi

# 5. 启动服务
echo "[5/5] 启动 PM2 服务..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "========================================="
echo "  部署完成!"
echo "  检查状态: pm2 status"
echo "  查看日志: pm2 logs labmaster-api"
echo "  重启服务: pm2 restart labmaster-api"
echo "========================================="
