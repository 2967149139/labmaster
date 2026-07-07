-- 部门管理表
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 从现有用户数据中提取部门并插入
INSERT IGNORE INTO departments (name) VALUES
('实验室管理办公室'),
('有机分析室'),
('无机分析室'),
('分析实验室A'),
('教务处');
