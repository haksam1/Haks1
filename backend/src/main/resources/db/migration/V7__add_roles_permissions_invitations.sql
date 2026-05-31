-- Add new columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS person_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add new columns to persons
ALTER TABLE persons ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS modify_permission VARCHAR(50);
ALTER TABLE persons ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id BIGSERIAL PRIMARY KEY,
    tree_id BIGINT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    temp_password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Clear existing data (optional, safe to skip if fresh)
TRUNCATE public.role_permissions;
TRUNCATE public.roles CASCADE;

-- Insert Roles
INSERT INTO public.roles (id, name) VALUES
(1, 'System Admin'),
(2, 'Family Head'),
(3, 'Family Member')
ON CONFLICT (name) DO NOTHING;

-- Insert Role Permissions
INSERT INTO public.role_permissions (role_id, permission) VALUES

-- System Admin
(1, 'view_dashboard'),
(1, 'view_search'),
(1, 'view_settings'),
(1, 'view_roles'),
(1, 'manage_all'),

-- Family Head
(2, 'view_dashboard'),
(2, 'view_search'),
(2, 'view_settings'),
(2, 'manage_family'),

-- Family Member
(3, 'view_dashboard'),
(3, 'manage_self')

ON CONFLICT (role_id, permission) DO NOTHING;

