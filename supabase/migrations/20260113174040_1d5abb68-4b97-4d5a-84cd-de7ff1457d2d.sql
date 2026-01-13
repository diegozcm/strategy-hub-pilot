-- Adicionar dtgltda@gmail.com como system admin
INSERT INTO user_roles (user_id, role)
VALUES ('b65211dc-46c1-40e3-9eb9-c7d8a5b3d767', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;