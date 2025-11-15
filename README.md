软件架构
介绍
崔书豪、王舒睿与贾学成的小组仓库

软件架构
软件架构说明

安装教程
xxxx
xxxx
使用说明
xxxx
xxxx
xxxx
参与贡献
Fork 本仓库
新建 Feat_xxx 分支
提交代码
新建 Pull Request
特技
使用 Readme_XXX.md 来支持不同的语言，例如 Readme_en.md, Readme_zh.md
Gitee 官方博客 blog.gitee.com
你可以 https://gitee.com/explore 这个地址来了解 Gitee 上的优秀开源项目
GVP 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
Gitee 官方提供的使用手册 https://gitee.com/help
Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 https://gitee.com/gitee-stars/
2025.11.6
第一次提交，初始化前后端并添加用户登录注册模块
这里使用了postgreSQL，需要登录或者替换的话看后端.env文件
数据库名：shared_bike
-- Step 1: 创建通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: 创建 users 表
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
phone VARCHAR(15) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
name VARCHAR(100),
role VARCHAR(20) NOT NULL CHECK (role IN ('TENANT', 'OPERATOR', 'MAINTAINER', 'PARK_ADMIN')),
status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: 创建触发器
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 4: 创建 parks 表
CREATE TABLE IF NOT EXISTS parks (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
location VARCHAR(255),
geo_boundary JSON,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_parks_updated_at
BEFORE UPDATE ON parks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 投诉表，使用 PostGIS 地理位置
CREATE TABLE IF NOT EXISTS complaints (
id SERIAL PRIMARY KEY,
type VARCHAR(32) NOT NULL,
description TEXT NOT NULL,
photo_url VARCHAR(255),
location geometry(Point, 4326) NOT NULL,
status VARCHAR(16) DEFAULT '未处理',
created_at TIMESTAMP DEFAULT NOW(),
handled_at TIMESTAMP,
handler VARCHAR(64)
);

CREATE TABLE user_parks (
user_id INT NOT NULL,
park_id INT NOT NULL,
PRIMARY KEY (user_id, park_id),
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE
);

-- 为 parks 表添加经纬度字段
ALTER TABLE parks ADD COLUMN center_lng DECIMAL(10, 6);
ALTER TABLE parks ADD COLUMN center_lat DECIMAL(10, 6);
ALTER TABLE parks ADD COLUMN boundary_coordinates JSON;

-- 更新现有园区的经纬度（示例数据，请根据实际情况修改）
UPDATE parks SET
center_lng = 116.31,
center_lat = 39.91,
boundary_coordinates = '[[116.305, 39.905], [116.315, 39.905], [116.315, 39.915], [116.305, 39.915], [116.305, 39.905]]'
WHERE id = 1;

-- 插入新的园区
INSERT INTO parks (name, location, center_lng, center_lat, boundary_coordinates) VALUES
('上海科技园区', '上海市浦东新区', 121.47, 31.23, '[[121.46, 31.22], [121.48, 31.22], [121.48, 31.24], [121.46, 31.24], [121.46, 31.22]]');


-- 2) 为 rides 表添加 start_location 和 end_location（如果尚不存在）
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS start_location geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS end_location geometry(Point, 4326);

-- 3) 为位置列创建空间索引
CREATE INDEX IF NOT EXISTS idx_rides_start_location ON rides USING GIST (start_location);
CREATE INDEX IF NOT EXISTS idx_rides_end_location ON rides USING GIST (end_location);

-- 4) 一些方便的示例查询，用于分析（仅供参考）
-- 按近 30 天活跃用户数
-- SELECT u.id, u.name, COUNT(r.*) as rides
-- FROM users u JOIN rides r ON u.id = r.user_id
-- WHERE r.start_time >= NOW() - INTERVAL '30 days'
-- GROUP BY u.id, u.name ORDER BY rides DESC;

-- 5) 插入示例用户和骑行数据（仅示例）
-- 注意：请根据实际的 users/vehicles 表结构调整关联 id

-- 示例租客
INSERT INTO users (phone, password_hash, name, role, created_at)
VALUES
('13800000001', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客A', 'TENANT', NOW()),
('13800000002', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客B', 'TENANT', NOW()),
('13800000003', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客C', 'TENANT', NOW())
ON CONFLICT (phone) DO NOTHING;

-- 示例骑行数据（假设 vehicles id 1、2、3 存在）
INSERT INTO rides (user_id, vehicle_id, park_id, start_time, end_time, fee, status, start_location, end_location, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE phone='13800000001' LIMIT 1), 1, 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', 3.0, 'COMPLETED', ST_GeomFromText('POINT(116.397428 39.90923)', 4326), ST_GeomFromText('POINT(116.403875 39.91531)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000002' LIMIT 1), 2, 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '25 minutes', 5.0, 'COMPLETED', ST_GeomFromText('POINT(116.397500 39.90850)', 4326), ST_GeomFromText('POINT(116.404000 39.91500)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000001' LIMIT 1), 1, 1, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days' + INTERVAL '8 minutes', 1.5, 'COMPLETED', ST_GeomFromText('POINT(116.397428 39.90923)', 4326), ST_GeomFromText('POINT(116.399000 39.91000)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000003' LIMIT 1), 3, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', 4.0, 'COMPLETED', ST_GeomFromText('POINT(116.380000 39.900000)', 4326), ST_GeomFromText('POINT(116.390000 39.905000)', 4326), NOW(), NOW())
ON CONFLICT DO NOTHING;

