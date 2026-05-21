ALTER TABLE persons ADD COLUMN phone_number VARCHAR(50);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission)
);

ALTER TABLE users ADD COLUMN role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL;

CREATE TABLE sms_queue (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (name) VALUES ('System Admin') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('Parent Admin') ON CONFLICT DO NOTHING;

-- Seed role permissions
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_dashboard' FROM roles WHERE name = 'System Admin';
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_search' FROM roles WHERE name = 'System Admin';
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_settings' FROM roles WHERE name = 'System Admin';
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_roles' FROM roles WHERE name = 'System Admin';

INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_dashboard' FROM roles WHERE name = 'Parent Admin';
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_search' FROM roles WHERE name = 'Parent Admin';
INSERT INTO role_permissions (role_id, permission) 
SELECT id, 'view_settings' FROM roles WHERE name = 'Parent Admin';

-- Associate existing users with 'System Admin' so they don't lose access
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'System Admin') WHERE role_id IS NULL;
