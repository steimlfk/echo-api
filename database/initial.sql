CALL `echo`.`accountsCreate`('secret_', 'nimda', '$2a$10$5f3gnmB/Cbe1TjrJhaUvNe6MTT6w87Ckiqyr0j4VxLChMtZFIMHka', 'admin@hospital.de', 'admin', 1, '18:00', 1, 'email', '1337');

CALL `echo`.`grantRolePermissions`(1, 'admin');