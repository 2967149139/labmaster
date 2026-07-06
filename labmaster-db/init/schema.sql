-- LabMaster 实验室管理系统 - 数据库初始化脚本
-- 数据库: test_ai

CREATE DATABASE IF NOT EXISTS test_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE test_ai;

-- 用户/人员表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT '123456',
    real_name VARCHAR(50) NOT NULL,
    role ENUM('admin','researcher','technician','viewer') NOT NULL DEFAULT 'researcher',
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    avatar VARCHAR(10) DEFAULT '',
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 实验室表
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    manager_id INT,
    area FLOAT COMMENT '面积(㎡)',
    description TEXT,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 设备表
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eq_code VARCHAR(50) NOT NULL UNIQUE COMMENT '设备编号',
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) COMMENT '型号',
    category VARCHAR(50) COMMENT '分类',
    lab_id INT,
    status ENUM('available','in_use','maintenance','offline') DEFAULT 'available',
    purchase_date DATE,
    price DECIMAL(12,2),
    supplier VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 实验表
CREATE TABLE IF NOT EXISTS experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exp_code VARCHAR(50) NOT NULL UNIQUE COMMENT '实验编号',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    lab_id INT,
    leader_id INT COMMENT '负责人',
    status ENUM('draft','in_progress','completed','cancelled') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    result TEXT COMMENT '实验结论',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 实验-设备关联表
CREATE TABLE IF NOT EXISTS experiment_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    experiment_id INT NOT NULL,
    equipment_id INT NOT NULL,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 样品表
CREATE TABLE IF NOT EXISTS samples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_code VARCHAR(50) NOT NULL UNIQUE COMMENT '样品编号',
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT DEFAULT 1,
    unit VARCHAR(20) DEFAULT '份',
    storage_location VARCHAR(100),
    storage_condition VARCHAR(100) COMMENT '保存条件',
    lab_id INT,
    experiment_id INT,
    status ENUM('stored','in_use','used','disposed') DEFAULT 'stored',
    received_date DATE,
    expiry_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 预约表
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    experiment_id INT,
    title VARCHAR(200) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 耗材库存表
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE COMMENT '物品编号',
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT DEFAULT 0,
    unit VARCHAR(20),
    min_stock INT DEFAULT 10 COMMENT '最低库存预警',
    storage_location VARCHAR(100),
    supplier VARCHAR(100),
    price DECIMAL(10,2),
    lab_id INT,
    status ENUM('normal','low','out_of_stock') DEFAULT 'normal',
    expiry_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 库存出入库记录
CREATE TABLE IF NOT EXISTS inventory_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    type ENUM('in','out') NOT NULL COMMENT '入库/出库',
    quantity INT NOT NULL,
    operator_id INT,
    remark VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    module VARCHAR(50) COMMENT '模块',
    target_id INT COMMENT '目标ID',
    detail TEXT COMMENT '详细描述',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============ 初始数据 ============

-- 插入默认用户
INSERT INTO users (username, password, real_name, role, email, phone, department, avatar) VALUES
('admin', '123456', '张教授', 'admin', 'admin@labmaster.cn', '13800000001', '实验室管理办公室', 'A'),
('li_bo', '123456', '李博士', 'researcher', 'libo@labmaster.cn', '13800000002', '有机分析室', 'B'),
('wang_res', '123456', '王研究员', 'researcher', 'wang@labmaster.cn', '13800000003', '无机分析室', 'C'),
('zhao_tech', '123456', '赵技术员', 'technician', 'zhao@labmaster.cn', '13800000004', '分析实验室A', 'D'),
('qian_view', '123456', '钱老师', 'viewer', 'qian@labmaster.cn', '13800000005', '教务处', 'E');

-- 插入实验室
INSERT INTO labs (name, location, manager_id, area, description) VALUES
('分析实验室 A', '科研楼 301', 1, 120.5, '主要从事色谱分析和光谱分析'),
('分析实验室 B', '科研楼 302', 2, 98.0, '主要从事质谱分析和元素分析'),
('有机分析室', '科研楼 401', 2, 85.0, '有机化合物分析与合成'),
('无机分析室', '科研楼 402', 3, 75.5, '无机材料表征与分析'),
('物性分析室', '科研楼 501', 4, 60.0, '材料物理性能测试');

-- 插入设备
INSERT INTO equipment (eq_code, name, model, category, lab_id, status, purchase_date, price, supplier) VALUES
('EQ-2024001', '高效液相色谱仪', 'Agilent 1260', '色谱分析', 1, 'available', '2024-01-15', 450000.00, '安捷伦科技'),
('EQ-2024002', '气相色谱-质谱联用仪', 'GCMS-QP2020', '质谱分析', 3, 'in_use', '2024-02-20', 680000.00, '岛津公司'),
('EQ-2024003', '紫外分光光度计', 'UV-2600i', '光谱分析', 2, 'available', '2024-03-10', 120000.00, '岛津公司'),
('EQ-2024004', '原子吸收光谱仪', 'AA-6880', '元素分析', 4, 'maintenance', '2024-01-08', 350000.00, '岛津公司'),
('EQ-2024005', '激光粒度分析仪', 'Mastersizer 3000', '物性分析', 5, 'offline', '2024-04-05', 280000.00, '马尔文帕纳科'),
('EQ-2024006', '傅里叶变换红外光谱仪', 'Nicolet iS50', '光谱分析', 2, 'available', '2024-05-12', 320000.00, '赛默飞'),
('EQ-2024007', '热重分析仪', 'TGA 5500', '热分析', 5, 'available', '2024-06-01', 260000.00, 'TA仪器'),
('EQ-2024008', '扫描电子显微镜', 'SU8220', '电镜', 5, 'in_use', '2024-02-28', 1500000.00, '日立高新');

-- 插入实验
INSERT INTO experiments (exp_code, title, description, category, lab_id, leader_id, status, start_date, end_date, result) VALUES
('EXP-2026001', '饮用水中有机污染物检测', '采用GC-MS方法分析饮用水中的微量有机污染物', '环境分析', 3, 2, 'in_progress', '2026-06-15', '2026-08-15', NULL),
('EXP-2026002', '中药材重金属含量测定', '利用AAS测定5种中药材中铅、镉、砷、汞含量', '药物分析', 4, 3, 'in_progress', '2026-06-20', '2026-07-30', NULL),
('EXP-2026003', '纳米材料粒径分布研究', '使用激光粒度仪研究不同工艺制备的纳米材料粒径分布', '材料科学', 5, 2, 'completed', '2026-05-01', '2026-06-30', '成功制备了粒径在50-100nm的纳米材料，粒径分布均匀'),
('EXP-2026004', '食品中添加剂含量分析', '采用HPLC法同时检测食品中多种添加剂含量', '食品安全', 1, 1, 'draft', '2026-07-10', '2026-08-20', NULL),
('EXP-2026005', '聚合物热稳定性研究', '使用TGA分析不同聚合物的热分解温度及热稳定性', '材料科学', 5, 3, 'draft', '2026-07-15', '2026-09-15', NULL);

-- 插入实验-设备关联
INSERT INTO experiment_equipment (experiment_id, equipment_id) VALUES
(1, 2), (2, 4), (3, 5), (4, 1), (5, 7);

-- 插入样品
INSERT INTO samples (sample_code, name, category, quantity, unit, storage_location, storage_condition, lab_id, experiment_id, status, received_date, expiry_date) VALUES
('S-0892', '饮用水样本 A', '水样', 5, '瓶', '样品柜 A-01', '4℃冷藏', 3, 1, 'in_use', '2026-06-15', '2026-07-15'),
('S-0893', '黄芪药材', '中药材', 3, '份', '样品柜 B-03', '常温干燥', 4, 2, 'in_use', '2026-06-20', '2027-06-20'),
('S-0894', '纳米SiO₂粉末', '纳米材料', 10, '克', '样品柜 C-01', '密封防潮', 5, 3, 'used', '2026-05-01', '2027-05-01'),
('S-0895', '饮料样品 B', '食品', 8, '瓶', '样品柜 A-02', '4℃冷藏', 1, 4, 'stored', '2026-07-05', '2026-08-05'),
('S-0896', 'PMMA聚合物', '高分子材料', 4, '份', '样品柜 C-02', '常温', 5, 5, 'stored', '2026-07-01', '2027-07-01'),
('S-0897', '土壤样本 C', '环境样品', 6, '袋', '样品柜 B-01', '常温干燥', 4, NULL, 'stored', '2026-06-28', '2026-12-28'),
('S-0898', '血液样本 D', '生物样品', 10, '管', '样品柜 A-03', '-20℃冷冻', 2, NULL, 'stored', '2026-07-02', '2026-08-02');

-- 插入预约记录
INSERT INTO reservations (user_id, equipment_id, experiment_id, title, start_time, end_time, status, purpose) VALUES
(2, 2, 1, 'GC-MS有机污染物分析', '2026-07-07 09:00:00', '2026-07-07 12:00:00', 'approved', '分析饮用水样本中的有机污染物'),
(3, 4, 2, 'AAS重金属测定', '2026-07-08 14:00:00', '2026-07-08 17:00:00', 'approved', '测定中药材重金属含量'),
(2, 1, NULL, 'HPLC添加剂分析', '2026-07-10 08:00:00', '2026-07-10 12:00:00', 'pending', '食品添加剂检测预实验'),
(4, 3, NULL, 'UV-Vis光谱扫描', '2026-07-09 15:00:00', '2026-07-09 17:00:00', 'pending', '常规样品检测'),
(1, 7, NULL, 'TGA热稳定性测试', '2026-07-11 09:00:00', '2026-07-11 11:00:00', 'pending', '聚合物热分析');

-- 插入耗材库存
INSERT INTO inventory (item_code, name, category, quantity, unit, min_stock, storage_location, supplier, price, lab_id, status) VALUES
('INV-001', '色谱柱 C18', '色谱耗材', 5, '支', 5, '耗材柜 A-01', '安捷伦科技', 3500.00, 1, 'normal'),
('INV-002', '乙腈(色谱纯)', '化学试剂', 10, '瓶', 5, '试剂柜 B-01', '默克化工', 280.00, 1, 'normal'),
('INV-003', '甲醇(色谱纯)', '化学试剂', 8, '瓶', 5, '试剂柜 B-01', '默克化工', 220.00, 1, 'normal'),
('INV-004', '石英比色皿', '玻璃器皿', 20, '个', 10, '器皿柜 C-01', '国产优质', 45.00, 2, 'normal'),
('INV-005', '进样针 10μL', '色谱耗材', 3, '支', 5, '耗材柜 A-02', '哈密顿', 680.00, 1, 'low'),
('INV-006', '石墨管', '光谱耗材', 4, '支', 5, '耗材柜 A-03', '岛津公司', 1200.00, 4, 'low'),
('INV-007', '硝酸(优级纯)', '化学试剂', 2, '瓶', 3, '试剂柜 B-02', '国药集团', 85.00, 4, 'low'),
('INV-008', '滤纸(定量)', '实验耗材', 50, '盒', 20, '耗材柜 D-01', '国产优质', 35.00, 2, 'normal'),
('INV-009', '氘灯(UV)', '仪器配件', 0, '个', 2, '备件柜 E-01', '岛津公司', 4500.00, 2, 'out_of_stock'),
('INV-010', '样品瓶 2mL', '色谱耗材', 200, '个', 100, '耗材柜 D-02', '安捷伦科技', 8.50, 1, 'normal');

-- 插入操作日志
INSERT INTO operation_logs (user_id, action, module, target_id, detail) VALUES
(1, '登录系统', 'system', NULL, '管理员登录系统'),
(2, '创建实验', 'experiments', 1, '创建实验：饮用水中有机污染物检测'),
(3, '创建实验', 'experiments', 2, '创建实验：中药材重金属含量测定'),
(2, '预约设备', 'reservations', 1, '预约GC-MS设备，时间：2026-07-07 09:00-12:00'),
(3, '预约设备', 'reservations', 2, '预约AAS设备，时间：2026-07-08 14:00-17:00'),
(4, '入库耗材', 'inventory', 1, '入库色谱柱C18 × 5支'),
(1, '添加用户', 'users', 5, '添加新用户：钱老师(观察员)');

-- 插入系统设置
INSERT INTO system_settings (`key`, `value`, `description`) VALUES
('system_name', 'LabMaster 实验室管理系统', '系统名称'),
('system_version', '1.0.0', '系统版本'),
('maintenance_mode', 'false', '维护模式'),
('reservation_max_days', '30', '最大可预约天数');
