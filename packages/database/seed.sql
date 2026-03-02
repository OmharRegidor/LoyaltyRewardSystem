-- ============================================================
-- NOXALOYALTY SEED DATA
-- Realistic Philippine small business loyalty platform data
-- ============================================================

-- Clean existing seed data (reverse dependency order)
DELETE FROM referral_completions;
DELETE FROM referral_codes;
DELETE FROM redemptions;
DELETE FROM transactions;
DELETE FROM scan_logs;
DELETE FROM notifications;
DELETE FROM customer_businesses;
DELETE FROM customers;
DELETE FROM rewards;
DELETE FROM staff_invites;
DELETE FROM staff;
DELETE FROM branches;
DELETE FROM subscriptions;
DELETE FROM usage_tracking;
DELETE FROM businesses;
DELETE FROM users WHERE id::text LIKE 'a0000000-%' OR id::text LIKE 'd0000000-%';

-- Remove previously seeded auth users (safe: only deletes fake seed UUIDs)
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000014',
  'a0000000-0000-0000-0000-000000000015',
  'a0000000-0000-0000-0000-000000000016',
  'a0000000-0000-0000-0000-000000000017',
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000006',
  'd0000000-0000-0000-0000-000000000007',
  'd0000000-0000-0000-0000-000000000008',
  'd0000000-0000-0000-0000-000000000009',
  'd0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000011',
  'd0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000013',
  'd0000000-0000-0000-0000-000000000014',
  'd0000000-0000-0000-0000-000000000015',
  'd0000000-0000-0000-0000-000000000016',
  'd0000000-0000-0000-0000-000000000017',
  'd0000000-0000-0000-0000-000000000018',
  'd0000000-0000-0000-0000-000000000019',
  'd0000000-0000-0000-0000-000000000020'
);

-- ============================================================
-- AUTH USERS (fake users to satisfy FK constraints)
-- ============================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone, phone_change, phone_change_token, created_at, updated_at) VALUES
  -- Business owners
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'juan@kapeni.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Juan Dela Cruz"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '8 months', NOW()),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'maria@glowup.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Lopez"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '6 months', NOW()),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'chef@lutongbahay.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chef Ramon"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '10 months', NOW()),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'coach@fitzone.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Coach Mike"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '4 months', NOW()),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'doc@petpals.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sarah Chen"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  -- Staff members
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'ana@kapeni.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Santos"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '7 months', NOW()),
  ('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'carlo@kapeni.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlo Reyes"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  ('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'bea@kapeni.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bea Garcia"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '2 months', NOW()),
  ('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'jasmine@glowup.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jasmine Tan"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  ('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'rica@glowup.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rica Mendoza"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '3 months', NOW()),
  ('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'lito@lutongbahay.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lito Bautista"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '8 months', NOW()),
  ('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'trisha@fitzone.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Trisha Villanueva"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '3 months', NOW()),
  ('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'kevin@petpals.ph', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kevin Cruz"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '4 months', NOW()),
  -- Customers
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'patricia@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Patricia Gonzales"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'miguel@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Miguel Torres"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'sofia@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sofia Ramirez"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'daniel@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Daniel Aquino"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '8 months', NOW()),
  ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'isabella@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Isabella Cruz"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'rafael@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rafael Mendoza"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'camille@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Camille Santos"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'marco@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marco Villanueva"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'angela@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Angela Rivera"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '9 months', NOW()),
  ('d0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'jerome@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jerome Bautista"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'hannah@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hannah Lim"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'paolo@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paolo Fernandez"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'bianca@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bianca Reyes"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'luis@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Luis Garcia"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '2 months', NOW()),
  ('d0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'ella@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ella Mae Tan"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'ryan@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ryan Pascual"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'christine@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Christine Uy"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '8 months', NOW()),
  ('d0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'jr@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"JR Navarro"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'denise@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Denise Chua"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'mark@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mark Soriano"}', 'authenticated', 'authenticated', '', '', '', '', '', '', NULL, '', '', NOW() - INTERVAL '6 months', NOW());

-- ============================================================
-- PUBLIC USERS (role assignments - references roles table)
-- Note: role IDs are from the existing roles table
-- business_owner: 3a4858ff-9869-49c1-82fb-a562d3df9aa5
-- staff: 6f7ae22e-2f02-4353-b393-423d3ee76268
-- customer: 3c0b887d-8cba-4584-9db2-925fa8f8d937
-- ============================================================
INSERT INTO users (id, role_id, email, created_at, updated_at) VALUES
  -- Business owners
  ('a0000000-0000-0000-0000-000000000001', '3a4858ff-9869-49c1-82fb-a562d3df9aa5', 'juan@kapeni.ph', NOW() - INTERVAL '8 months', NOW()),
  ('a0000000-0000-0000-0000-000000000002', '3a4858ff-9869-49c1-82fb-a562d3df9aa5', 'maria@glowup.ph', NOW() - INTERVAL '6 months', NOW()),
  ('a0000000-0000-0000-0000-000000000003', '3a4858ff-9869-49c1-82fb-a562d3df9aa5', 'chef@lutongbahay.ph', NOW() - INTERVAL '10 months', NOW()),
  ('a0000000-0000-0000-0000-000000000004', '3a4858ff-9869-49c1-82fb-a562d3df9aa5', 'coach@fitzone.ph', NOW() - INTERVAL '4 months', NOW()),
  ('a0000000-0000-0000-0000-000000000005', '3a4858ff-9869-49c1-82fb-a562d3df9aa5', 'doc@petpals.ph', NOW() - INTERVAL '5 months', NOW()),
  -- Staff members
  ('a0000000-0000-0000-0000-000000000010', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'ana@kapeni.ph', NOW() - INTERVAL '7 months', NOW()),
  ('a0000000-0000-0000-0000-000000000011', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'carlo@kapeni.ph', NOW() - INTERVAL '5 months', NOW()),
  ('a0000000-0000-0000-0000-000000000012', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'bea@kapeni.ph', NOW() - INTERVAL '2 months', NOW()),
  ('a0000000-0000-0000-0000-000000000013', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'jasmine@glowup.ph', NOW() - INTERVAL '5 months', NOW()),
  ('a0000000-0000-0000-0000-000000000014', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'rica@glowup.ph', NOW() - INTERVAL '3 months', NOW()),
  ('a0000000-0000-0000-0000-000000000015', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'lito@lutongbahay.ph', NOW() - INTERVAL '8 months', NOW()),
  ('a0000000-0000-0000-0000-000000000016', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'trisha@fitzone.ph', NOW() - INTERVAL '3 months', NOW()),
  ('a0000000-0000-0000-0000-000000000017', '6f7ae22e-2f02-4353-b393-423d3ee76268', 'kevin@petpals.ph', NOW() - INTERVAL '4 months', NOW()),
  -- Customers
  ('d0000000-0000-0000-0000-000000000001', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'patricia@gmail.com', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000002', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'miguel@gmail.com', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000003', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'sofia@gmail.com', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000004', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'daniel@gmail.com', NOW() - INTERVAL '8 months', NOW()),
  ('d0000000-0000-0000-0000-000000000005', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'isabella@gmail.com', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000006', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'rafael@gmail.com', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000007', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'camille@gmail.com', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000008', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'marco@gmail.com', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000009', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'angela@gmail.com', NOW() - INTERVAL '9 months', NOW()),
  ('d0000000-0000-0000-0000-000000000010', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'jerome@gmail.com', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000011', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'hannah@gmail.com', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000012', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'paolo@gmail.com', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000013', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'bianca@gmail.com', NOW() - INTERVAL '7 months', NOW()),
  ('d0000000-0000-0000-0000-000000000014', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'luis@gmail.com', NOW() - INTERVAL '2 months', NOW()),
  ('d0000000-0000-0000-0000-000000000015', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'ella@gmail.com', NOW() - INTERVAL '6 months', NOW()),
  ('d0000000-0000-0000-0000-000000000016', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'ryan@gmail.com', NOW() - INTERVAL '5 months', NOW()),
  ('d0000000-0000-0000-0000-000000000017', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'christine@gmail.com', NOW() - INTERVAL '8 months', NOW()),
  ('d0000000-0000-0000-0000-000000000018', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'jr@gmail.com', NOW() - INTERVAL '4 months', NOW()),
  ('d0000000-0000-0000-0000-000000000019', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'denise@gmail.com', NOW() - INTERVAL '3 months', NOW()),
  ('d0000000-0000-0000-0000-000000000020', '3c0b887d-8cba-4584-9db2-925fa8f8d937', 'mark@gmail.com', NOW() - INTERVAL '6 months', NOW());

-- ============================================================
-- BUSINESSES (5 diverse Philippine businesses)
-- ============================================================
INSERT INTO businesses (id, owner_id, name, slug, description, business_type, address, city, phone, owner_email, subscription_status, is_free_forever, points_per_purchase, max_points_per_transaction, min_purchase_for_points, pesos_per_point, points_expiry_days, referral_reward_points, created_at, updated_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kape ni Juan', 'kape-ni-juan', 'Specialty Filipino coffee shop chain', 'cafe', '123 Maginhawa St, Teachers Village', 'Quezon City', '+639171234567', 'juan@kapeni.ph', 'active', false, 10, 100, 100, 1, 365, 50, NOW() - INTERVAL '8 months', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Glow Up Salon', 'glow-up-salon', 'Premium hair and nail salon', 'salon', '45 Jupiter St, Bel-Air', 'Makati', '+639181234567', 'maria@glowup.ph', 'active', false, 15, 200, 200, 2, 365, 75, NOW() - INTERVAL '6 months', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Lutong Bahay Express', 'lutong-bahay', 'Home-style Filipino food delivery', 'restaurant', '78 Katipunan Ave', 'Quezon City', '+639191234567', 'chef@lutongbahay.ph', 'active', true, 5, 50, 50, 1, 180, 25, NOW() - INTERVAL '10 months', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'FitZone Gym', 'fitzone-gym', 'Community fitness center', 'gym', '200 Shaw Blvd', 'Mandaluyong', '+639201234567', 'coach@fitzone.ph', 'active', false, 20, 300, 500, 5, 365, 100, NOW() - INTERVAL '4 months', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Pet Pals Veterinary', 'pet-pals-vet', 'Full-service pet clinic and grooming', 'veterinary', '15 Tomas Morato Ave', 'Quezon City', '+639211234567', 'doc@petpals.ph', 'active', false, 10, 150, 300, 3, 365, 50, NOW() - INTERVAL '5 months', NOW());

-- ============================================================
-- BRANCHES
-- ============================================================
INSERT INTO branches (id, business_id, name, address, city, is_active, created_at) VALUES
  -- Kape ni Juan: 3 branches
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Maginhawa Main', '123 Maginhawa St', 'Quezon City', true, NOW() - INTERVAL '8 months'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'BGC Branch', 'High Street, BGC', 'Taguig', true, NOW() - INTERVAL '5 months'),
  ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Eastwood Branch', 'Eastwood City', 'Quezon City', true, NOW() - INTERVAL '2 months'),
  -- Glow Up Salon: 2 branches
  ('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Makati Main', '45 Jupiter St', 'Makati', true, NOW() - INTERVAL '6 months'),
  ('b1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Alabang Branch', 'Festival Mall', 'Muntinlupa', true, NOW() - INTERVAL '3 months'),
  -- Lutong Bahay: 1 branch
  ('b1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'Katipunan Main', '78 Katipunan Ave', 'Quezon City', true, NOW() - INTERVAL '10 months'),
  -- FitZone: 1 branch
  ('b1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 'Shaw Main', '200 Shaw Blvd', 'Mandaluyong', true, NOW() - INTERVAL '4 months'),
  -- Pet Pals: 1 branch
  ('b1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000005', 'Tomas Morato Main', '15 Tomas Morato Ave', 'Quezon City', true, NOW() - INTERVAL '5 months');

-- ============================================================
-- STAFF (owners + team members)
-- ============================================================
INSERT INTO staff (id, business_id, user_id, branch_id, name, email, role, is_active, created_at) VALUES
  -- Kape ni Juan
  ('50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Juan Dela Cruz', 'juan@kapeni.ph', 'owner', true, NOW() - INTERVAL '8 months'),
  ('50000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'Ana Santos', 'ana@kapeni.ph', 'manager', true, NOW() - INTERVAL '7 months'),
  ('50000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002', 'Carlo Reyes', 'carlo@kapeni.ph', 'cashier', true, NOW() - INTERVAL '5 months'),
  ('50000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 'Bea Garcia', 'bea@kapeni.ph', 'cashier', true, NOW() - INTERVAL '2 months'),
  -- Glow Up Salon
  ('50000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Maria Lopez', 'maria@glowup.ph', 'owner', true, NOW() - INTERVAL '6 months'),
  ('50000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000004', 'Jasmine Tan', 'jasmine@glowup.ph', 'manager', true, NOW() - INTERVAL '5 months'),
  ('50000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000005', 'Rica Mendoza', 'rica@glowup.ph', 'cashier', true, NOW() - INTERVAL '3 months'),
  -- Lutong Bahay
  ('50000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'Chef Ramon', 'chef@lutongbahay.ph', 'owner', true, NOW() - INTERVAL '10 months'),
  ('50000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000006', 'Lito Bautista', 'lito@lutongbahay.ph', 'cashier', true, NOW() - INTERVAL '8 months'),
  -- FitZone
  ('50000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000007', 'Coach Mike', 'coach@fitzone.ph', 'owner', true, NOW() - INTERVAL '4 months'),
  ('50000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000007', 'Trisha Villanueva', 'trisha@fitzone.ph', 'manager', true, NOW() - INTERVAL '3 months'),
  -- Pet Pals
  ('50000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000008', 'Dr. Sarah Chen', 'doc@petpals.ph', 'owner', true, NOW() - INTERVAL '5 months'),
  ('50000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000008', 'Kevin Cruz', 'kevin@petpals.ph', 'cashier', true, NOW() - INTERVAL '4 months');

-- ============================================================
-- CUSTOMERS (20 customers, each joined 2-4 businesses)
-- ============================================================
INSERT INTO customers (id, user_id, full_name, email, phone, is_verified, verified_at, total_points, lifetime_points, tier, last_visit, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Patricia Gonzales', 'patricia@gmail.com', '+639171000001', true, NOW() - INTERVAL '7 months', 850, 2100, 'gold', NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 months'),
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Miguel Torres', 'miguel@gmail.com', '+639171000002', true, NOW() - INTERVAL '6 months', 420, 1200, 'silver', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 months'),
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Sofia Ramirez', 'sofia@gmail.com', '+639171000003', true, NOW() - INTERVAL '5 months', 1500, 3200, 'gold', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 months'),
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Daniel Aquino', 'daniel@gmail.com', '+639171000004', true, NOW() - INTERVAL '8 months', 200, 800, 'bronze', NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 months'),
  ('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'Isabella Cruz', 'isabella@gmail.com', '+639171000005', true, NOW() - INTERVAL '4 months', 3000, 5500, 'platinum', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 months'),
  ('c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', 'Rafael Mendoza', 'rafael@gmail.com', '+639171000006', true, NOW() - INTERVAL '7 months', 600, 1800, 'silver', NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 months'),
  ('c0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'Camille Santos', 'camille@gmail.com', '+639171000007', true, NOW() - INTERVAL '3 months', 150, 400, 'bronze', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 months'),
  ('c0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 'Marco Villanueva', 'marco@gmail.com', '+639171000008', true, NOW() - INTERVAL '6 months', 950, 2800, 'gold', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 months'),
  ('c0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000009', 'Angela Rivera', 'angela@gmail.com', '+639171000009', true, NOW() - INTERVAL '9 months', 75, 300, 'bronze', NOW() - INTERVAL '14 days', NOW() - INTERVAL '9 months'),
  ('c0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000010', 'Jerome Bautista', 'jerome@gmail.com', '+639171000010', true, NOW() - INTERVAL '5 months', 2200, 4000, 'platinum', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 months'),
  ('c0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000011', 'Hannah Lim', 'hannah@gmail.com', '+639171000011', true, NOW() - INTERVAL '4 months', 500, 1100, 'silver', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 months'),
  ('c0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000012', 'Paolo Fernandez', 'paolo@gmail.com', '+639171000012', true, NOW() - INTERVAL '3 months', 310, 700, 'bronze', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 months'),
  ('c0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000013', 'Bianca Reyes', 'bianca@gmail.com', '+639171000013', true, NOW() - INTERVAL '7 months', 1800, 3800, 'gold', NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 months'),
  ('c0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000014', 'Luis Garcia', 'luis@gmail.com', '+639171000014', true, NOW() - INTERVAL '2 months', 90, 200, 'bronze', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 months'),
  ('c0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', 'Ella Mae Tan', 'ella@gmail.com', '+639171000015', true, NOW() - INTERVAL '6 months', 1100, 2600, 'gold', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 months'),
  ('c0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000016', 'Ryan Pascual', 'ryan@gmail.com', '+639171000016', true, NOW() - INTERVAL '5 months', 700, 1500, 'silver', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 months'),
  ('c0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000017', 'Christine Uy', 'christine@gmail.com', '+639171000017', true, NOW() - INTERVAL '8 months', 2500, 4500, 'platinum', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 months'),
  ('c0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000018', 'JR Navarro', 'jr@gmail.com', '+639171000018', true, NOW() - INTERVAL '4 months', 380, 900, 'bronze', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 months'),
  ('c0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000019', 'Denise Chua', 'denise@gmail.com', '+639171000019', true, NOW() - INTERVAL '3 months', 650, 1400, 'silver', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 months'),
  ('c0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000020', 'Mark Soriano', 'mark@gmail.com', '+639171000020', true, NOW() - INTERVAL '6 months', 1650, 3100, 'gold', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 months');

-- ============================================================
-- CUSTOMER_BUSINESSES (each customer follows 2-4 businesses with different points)
-- ============================================================
INSERT INTO customer_businesses (id, customer_id, business_id, points, followed_at) VALUES
  -- Patricia: Kape, Glow Up, Lutong Bahay
  ('cb000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 350, NOW() - INTERVAL '7 months'),
  ('cb000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 400, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 100, NOW() - INTERVAL '3 months'),
  -- Miguel: Kape, FitZone
  ('cb000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 220, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 200, NOW() - INTERVAL '4 months'),
  -- Sofia: Glow Up, Pet Pals, Kape, FitZone
  ('cb000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 600, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 300, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 400, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 200, NOW() - INTERVAL '2 months'),
  -- Daniel: Lutong Bahay, Kape
  ('cb000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 120, NOW() - INTERVAL '8 months'),
  ('cb000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 80, NOW() - INTERVAL '5 months'),
  -- Isabella: Kape, Glow Up, FitZone, Pet Pals
  ('cb000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 800, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 900, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 800, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 500, NOW() - INTERVAL '2 months'),
  -- Rafael: Kape, Lutong Bahay, Pet Pals
  ('cb000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 250, NOW() - INTERVAL '7 months'),
  ('cb000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 200, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 150, NOW() - INTERVAL '3 months'),
  -- Camille: Glow Up, FitZone
  ('cb000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 100, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 50, NOW() - INTERVAL '2 months'),
  -- Marco: Kape, Lutong Bahay, FitZone
  ('cb000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 400, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 250, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 300, NOW() - INTERVAL '3 months'),
  -- Angela: Lutong Bahay, Pet Pals
  ('cb000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 50, NOW() - INTERVAL '9 months'),
  ('cb000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 25, NOW() - INTERVAL '6 months'),
  -- Jerome: Kape, Glow Up, FitZone, Lutong Bahay
  ('cb000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 700, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 500, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 600, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', 400, NOW() - INTERVAL '2 months'),
  -- Hannah: Glow Up, Pet Pals
  ('cb000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 300, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000005', 200, NOW() - INTERVAL '3 months'),
  -- Paolo: Kape, FitZone, Lutong Bahay
  ('cb000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 150, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000004', 100, NOW() - INTERVAL '2 months'),
  ('cb000000-0000-0000-0000-000000000034', 'c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000003', 60, NOW() - INTERVAL '1 month'),
  -- Bianca: Kape, Glow Up, Pet Pals
  ('cb000000-0000-0000-0000-000000000035', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 600, NOW() - INTERVAL '7 months'),
  ('cb000000-0000-0000-0000-000000000036', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 800, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000037', 'c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000005', 400, NOW() - INTERVAL '4 months'),
  -- Luis: Lutong Bahay, Kape
  ('cb000000-0000-0000-0000-000000000038', 'c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000003', 50, NOW() - INTERVAL '2 months'),
  ('cb000000-0000-0000-0000-000000000039', 'c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 40, NOW() - INTERVAL '1 month'),
  -- Ella Mae: Glow Up, Kape, FitZone
  ('cb000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002', 500, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 350, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000004', 250, NOW() - INTERVAL '3 months'),
  -- Ryan: Kape, Lutong Bahay, Pet Pals
  ('cb000000-0000-0000-0000-000000000043', 'c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 300, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000003', 250, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000045', 'c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000005', 150, NOW() - INTERVAL '2 months'),
  -- Christine: all 5 businesses
  ('cb000000-0000-0000-0000-000000000046', 'c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', 700, NOW() - INTERVAL '8 months'),
  ('cb000000-0000-0000-0000-000000000047', 'c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000002', 600, NOW() - INTERVAL '7 months'),
  ('cb000000-0000-0000-0000-000000000048', 'c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000003', 500, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000049', 'c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000004', 400, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000005', 300, NOW() - INTERVAL '4 months'),
  -- JR: Kape, FitZone
  ('cb000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', 180, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000052', 'c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000004', 200, NOW() - INTERVAL '3 months'),
  -- Denise: Glow Up, Lutong Bahay, Pet Pals
  ('cb000000-0000-0000-0000-000000000053', 'c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000002', 300, NOW() - INTERVAL '3 months'),
  ('cb000000-0000-0000-0000-000000000054', 'c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 200, NOW() - INTERVAL '2 months'),
  ('cb000000-0000-0000-0000-000000000055', 'c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000005', 150, NOW() - INTERVAL '1 month'),
  -- Mark: Kape, Glow Up, FitZone, Lutong Bahay
  ('cb000000-0000-0000-0000-000000000056', 'c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', 500, NOW() - INTERVAL '6 months'),
  ('cb000000-0000-0000-0000-000000000057', 'c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000002', 450, NOW() - INTERVAL '5 months'),
  ('cb000000-0000-0000-0000-000000000058', 'c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000004', 400, NOW() - INTERVAL '4 months'),
  ('cb000000-0000-0000-0000-000000000059', 'c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000003', 300, NOW() - INTERVAL '3 months');

-- ============================================================
-- REWARDS (per business)
-- ============================================================
INSERT INTO rewards (id, business_id, title, description, category, points_cost, discount_type, discount_value, is_active, is_visible, created_at) VALUES
  -- Kape ni Juan
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Free Brewed Coffee', 'Any size brewed coffee', 'drinks', 100, 'free_item', 100, true, true, NOW() - INTERVAL '8 months'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '20% Off Any Drink', 'Valid for specialty drinks', 'drinks', 200, 'percentage', 20, true, true, NOW() - INTERVAL '8 months'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Free Pastry', 'Any pastry item', 'food', 150, 'free_item', 100, true, true, NOW() - INTERVAL '6 months'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Buy 1 Take 1 Latte', 'Any latte variant', 'drinks', 500, 'bogo', 100, true, true, NOW() - INTERVAL '4 months'),
  -- Glow Up Salon
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Free Hair Treatment', 'Deep conditioning treatment', 'hair', 300, 'free_item', 100, true, true, NOW() - INTERVAL '6 months'),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', '₱200 Off Any Service', 'Minimum ₱500 spend', 'general', 200, 'fixed', 200, true, true, NOW() - INTERVAL '6 months'),
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'Free Manicure', 'Classic manicure', 'nails', 250, 'free_item', 100, true, true, NOW() - INTERVAL '4 months'),
  -- Lutong Bahay
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Free Rice', 'Extra rice on any order', 'food', 30, 'free_item', 100, true, true, NOW() - INTERVAL '10 months'),
  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'Free Halo-Halo', 'Regular size halo-halo', 'dessert', 80, 'free_item', 100, true, true, NOW() - INTERVAL '8 months'),
  ('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', '₱100 Off Order', 'Minimum ₱300 order', 'general', 150, 'fixed', 100, true, true, NOW() - INTERVAL '5 months'),
  -- FitZone
  ('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004', 'Free Day Pass', 'One day gym access', 'access', 200, 'free_item', 100, true, true, NOW() - INTERVAL '4 months'),
  ('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000004', 'Free PT Session', '1-hour personal training', 'training', 500, 'free_item', 100, true, true, NOW() - INTERVAL '3 months'),
  ('e0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000004', '30% Off Monthly', 'Discount on monthly plan', 'membership', 800, 'percentage', 30, true, true, NOW() - INTERVAL '2 months'),
  -- Pet Pals
  ('e0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000005', 'Free Grooming Bath', 'Basic pet bath', 'grooming', 200, 'free_item', 100, true, true, NOW() - INTERVAL '5 months'),
  ('e0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000005', '₱300 Off Checkup', 'Regular veterinary checkup', 'medical', 300, 'fixed', 300, true, true, NOW() - INTERVAL '4 months'),
  ('e0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000005', 'Free Nail Trim', 'Pet nail trimming service', 'grooming', 100, 'free_item', 100, true, true, NOW() - INTERVAL '3 months');

-- ============================================================
-- TRANSACTIONS (spread across 8 months for analytics trends)
-- Uses generate_series to create realistic volume
-- ============================================================

-- Helper: Kape ni Juan earn transactions (high volume coffee shop)
INSERT INTO transactions (id, business_id, customer_id, type, points, amount_spent, description, created_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000001',
  c.customer_id,
  'earn',
  (ARRAY[10,10,20,20,30,10,15,20,25,10])[1 + (ROW_NUMBER() OVER () % 10)],
  (ARRAY[150,200,250,180,300,120,350,280,160,220])[1 + (ROW_NUMBER() OVER () % 10)],
  (ARRAY['Americano','Latte','Cappuccino','Cold Brew','Matcha Latte','Espresso','Mocha','Flat White','Brewed Coffee','Caramel Macchiato'])[1 + (ROW_NUMBER() OVER () % 10)],
  NOW() - (random() * INTERVAL '240 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000016','c0000000-0000-0000-0000-000000000017','c0000000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000020'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 8) AS s(i);

-- Glow Up Salon earn transactions (medium volume)
INSERT INTO transactions (id, business_id, customer_id, type, points, amount_spent, description, created_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000002',
  c.customer_id,
  'earn',
  (ARRAY[15,30,45,60,30,15,45,30])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY[500,800,1200,1500,700,400,1000,600])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY['Haircut','Hair Color','Manicure','Pedicure','Facial','Rebond','Hair Spa','Nail Art'])[1 + (ROW_NUMBER() OVER () % 8)],
  NOW() - (random() * INTERVAL '180 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000015','c0000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000019','c0000000-0000-0000-0000-000000000020'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 5) AS s(i);

-- Lutong Bahay earn transactions (high volume food)
INSERT INTO transactions (id, business_id, customer_id, type, points, amount_spent, description, created_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000003',
  c.customer_id,
  'earn',
  (ARRAY[5,10,5,10,15,5,10,5,15,10])[1 + (ROW_NUMBER() OVER () % 10)],
  (ARRAY[200,350,180,400,500,150,300,250,450,280])[1 + (ROW_NUMBER() OVER () % 10)],
  (ARRAY['Adobo','Sinigang','Kare-Kare','Lechon Kawali','Sisig','Bulalo','Bicol Express','Crispy Pata','Tinola','Pancit Canton'])[1 + (ROW_NUMBER() OVER () % 10)],
  NOW() - (random() * INTERVAL '300 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000017','c0000000-0000-0000-0000-000000000019','c0000000-0000-0000-0000-000000000020'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 7) AS s(i);

-- FitZone earn transactions (medium volume)
INSERT INTO transactions (id, business_id, customer_id, type, points, amount_spent, description, created_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000004',
  c.customer_id,
  'earn',
  (ARRAY[20,40,20,60,20,40,80,20])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY[500,1000,500,1500,500,1000,2000,500])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY['Day Pass','Monthly Plan','Day Pass','PT Session','Day Pass','Monthly Plan','Annual Plan','Day Pass'])[1 + (ROW_NUMBER() OVER () % 8)],
  NOW() - (random() * INTERVAL '120 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000015','c0000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000018','c0000000-0000-0000-0000-000000000020'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 4) AS s(i);

-- Pet Pals earn transactions (lower volume, higher value)
INSERT INTO transactions (id, business_id, customer_id, type, points, amount_spent, description, created_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000005',
  c.customer_id,
  'earn',
  (ARRAY[10,30,20,50,10,30,40,20])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY[500,1500,800,2500,400,1200,2000,700])[1 + (ROW_NUMBER() OVER () % 8)],
  (ARRAY['Grooming Bath','Vaccination','Checkup','Surgery','Nail Trim','Dental Clean','Spay/Neuter','Deworming'])[1 + (ROW_NUMBER() OVER () % 8)],
  NOW() - (random() * INTERVAL '150 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000016','c0000000-0000-0000-0000-000000000017','c0000000-0000-0000-0000-000000000019'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 3) AS s(i);

-- ============================================================
-- REDEEM TRANSACTIONS (some customers redeeming rewards)
-- ============================================================
INSERT INTO transactions (id, business_id, customer_id, reward_id, type, points, description, created_at) VALUES
  -- Kape ni Juan redemptions
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'redeem', 100, 'Redeemed: Free Brewed Coffee', NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002', 'redeem', 200, 'Redeemed: 20% Off Any Drink', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000004', 'redeem', 500, 'Redeemed: Buy 1 Take 1 Latte', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000001', 'redeem', 100, 'Redeemed: Free Brewed Coffee', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000020', 'e0000000-0000-0000-0000-000000000003', 'redeem', 150, 'Redeemed: Free Pastry', NOW() - INTERVAL '15 days'),
  -- Glow Up redemptions
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000006', 'redeem', 200, 'Redeemed: ₱200 Off Any Service', NOW() - INTERVAL '50 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'redeem', 300, 'Redeemed: Free Hair Treatment', NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000007', 'redeem', 250, 'Redeemed: Free Manicure', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000006', 'redeem', 200, 'Redeemed: ₱200 Off Any Service', NOW() - INTERVAL '10 days'),
  -- Lutong Bahay redemptions
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000008', 'redeem', 30, 'Redeemed: Free Rice', NOW() - INTERVAL '55 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000009', 'redeem', 80, 'Redeemed: Free Halo-Halo', NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000010', 'redeem', 150, 'Redeemed: ₱100 Off Order', NOW() - INTERVAL '18 days'),
  -- FitZone redemptions
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000011', 'redeem', 200, 'Redeemed: Free Day Pass', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000012', 'redeem', 500, 'Redeemed: Free PT Session', NOW() - INTERVAL '15 days'),
  -- Pet Pals redemptions
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000014', 'redeem', 200, 'Redeemed: Free Grooming Bath', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000016', 'redeem', 100, 'Redeemed: Free Nail Trim', NOW() - INTERVAL '12 days');

-- ============================================================
-- REDEMPTIONS (matching the redeem transactions above)
-- ============================================================
INSERT INTO redemptions (id, business_id, customer_id, reward_id, redemption_code, points_used, status, expires_at, completed_at, created_at) VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'KNJ-001', 100, 'completed', NOW() + INTERVAL '30 days', NOW() - INTERVAL '59 days', NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002', 'KNJ-002', 200, 'completed', NOW() + INTERVAL '30 days', NOW() - INTERVAL '44 days', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000004', 'KNJ-003', 500, 'completed', NOW() + INTERVAL '30 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000006', 'GUS-001', 200, 'completed', NOW() + INTERVAL '30 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '50 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'GUS-002', 300, 'completed', NOW() + INTERVAL '30 days', NOW() - INTERVAL '34 days', NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000011', 'FZG-001', 200, 'pending', NOW() + INTERVAL '7 days', NULL, NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000016', 'PPV-001', 100, 'pending', NOW() + INTERVAL '7 days', NULL, NOW() - INTERVAL '1 day');

-- ============================================================
-- SCAN LOGS (staff scanning customer QR codes)
-- ============================================================
INSERT INTO scan_logs (id, business_id, customer_id, staff_id, points_awarded, transaction_amount, scanned_at)
SELECT
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000001',
  c.customer_id,
  (ARRAY['50000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000004']::uuid[])[1 + (ROW_NUMBER() OVER () % 3)],
  (ARRAY[10,20,15,10,25])[1 + (ROW_NUMBER() OVER () % 5)],
  (ARRAY[150,250,200,180,300])[1 + (ROW_NUMBER() OVER () % 5)],
  NOW() - (random() * INTERVAL '180 days')
FROM (
  SELECT unnest(ARRAY[
    'c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000017','c0000000-0000-0000-0000-000000000020'
  ]::uuid[]) AS customer_id
) c
CROSS JOIN generate_series(1, 5) AS s(i);

-- ============================================================
-- USAGE TRACKING (per business)
-- ============================================================
INSERT INTO usage_tracking (id, business_id, customer_count, branch_count, staff_count, transactions_this_month, points_issued_this_month, last_reset_at, updated_at) VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 16, 3, 4, 45, 680, date_trunc('month', NOW()), NOW()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 11, 2, 3, 28, 520, date_trunc('month', NOW()), NOW()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 12, 1, 2, 38, 310, date_trunc('month', NOW()), NOW()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 11, 1, 2, 22, 440, date_trunc('month', NOW()), NOW()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 9, 1, 2, 15, 280, date_trunc('month', NOW()), NOW());

-- ============================================================
-- Done! Summary:
-- 5 businesses (cafe, salon, restaurant, gym, vet clinic)
-- 8 branches across businesses
-- 13 staff members (owners, managers, cashiers)
-- 20 customers, each following 2-5 businesses
-- 59 customer_businesses records (points per business)
-- 16 rewards across all businesses
-- ~450+ earn transactions spread over 8 months
-- 16 redeem transactions
-- 7 redemption records (mix of completed/pending)
-- 30 scan logs
-- 5 usage tracking records
-- ============================================================
