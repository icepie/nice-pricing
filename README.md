# nice-pricing

AI 模型定价管理系统，支持多服务商、多模型的价格录入、历史追踪和对比。

## 功能

- 服务商管理（增删改，支持图标）
- 模型管理（增删改，启用/禁用，批量操作）
- 价格录入与历史记录
- 模型价格对比
- 兼容 new-api 的 `/v1/models`、`/api/newapi/models.json`、`/api/pricing` 等接口

## 快速开始

### Docker

```bash
docker run -d \
  -p 8080:8080 \
  -v /your/data:/data \
  your-dockerhub-username/nice-pricing:latest
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8088` | 监听端口 |
| `DB_PATH` | `pricing.db` | SQLite 数据库路径 |
| `CORS_ORIGINS` | `http://localhost:5173` | 允许的 CORS 来源，逗号分隔 |

### 本地开发

```bash
# 前端
cd frontend
pnpm install
pnpm dev

# 后端
cd backend
go run .
```

### 构建

```bash
# 构建前端
cd frontend && pnpm build

# 将 dist 复制到 backend 并构建二进制
cp -r frontend/dist backend/dist
cd backend && go build -o nice-pricing .
```

## CI/CD

每次推送到任意分支都会自动构建 Docker 镜像并推送到 DockerHub。

推送到 `main` 分支时额外打 `latest` 标签。

需要在仓库 Secrets 中配置：
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
