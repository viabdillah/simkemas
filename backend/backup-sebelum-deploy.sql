PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, is_active INTEGER DEFAULT 1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('e78bf3ef-3647-4292-a713-73e7f326e7e8','admin_divi','9935882b5931d4c4fa2a8030ad2a08d3e0295ecd20db2b8869718e991a6ee19c','74397e9ec44dafc43a8029f39600c113','Super Administrasi','2026-07-25 19:12:00',1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('f83355ce-9808-4d39-b6d1-09d2d79affa2','kasir_budi','f2cbee219424555c7785b8c24d36edd5e762bbe28669edd380b4b570c99e43cb','6cb1bd9c6a8fce1a95411f055f7ec175','Kasir','2026-07-26 11:20:20',1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('7990e187-5518-434c-a71c-5bd100d30113','desainer_budi','d167051526cc73be0ba81b57d95a81edfecc5c9031d10fcecdb628d5f39b633f','30e85d1c5a3d99263509c885b1b209a3','Desainer','2026-07-28 18:42:04',1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('e367fffd-5155-4b13-b2b2-00d76f416387','opmesin_budi','7e061c200dc9fe0b2b0b52757ecee498da6198ce9016a04cd8dad62d73197b17','cad4840c7add73ae206f2b141e4dab4c','Operator Mesin','2026-07-29 04:57:58',1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('b93d8c2b-0c42-49c5-97cc-dce89f36f14b','oppackaging_budi','deaa62921a126cfc29de7fb71a31188390e14adc8a8c05d5eeb255532d65b775','a8368b47992674fba4366b118c2930e0','Operator Packaging','2026-07-29 05:15:34',1);
INSERT INTO "users" ("id","username","password_hash","password_salt","role","created_at","is_active") VALUES('b6b656c6-1dbc-49da-8637-56d9f62e1f56','manajer_budi','0991ab62263a8e0a50e33b17ef94b9c2830c7e972fb578b15ea0a4c1a9df8bd0','d5368da5c0a28b86f8b05c279644765f','Manajer','2026-07-29 19:31:40',1);
CREATE TABLE audit_logs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL, details TEXT, ip_address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('0fb14505-00bd-418b-8b82-f9e82a6b69c4','e78bf3ef-3647-4292-a713-73e7f326e7e8','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 04:45:34');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('a8a0a218-2f96-4444-ad04-d1ae5154084d','e78bf3ef-3647-4292-a713-73e7f326e7e8','CREATE_USER','Mendaftarkan pengguna baru: opmesin_budi dengan hak akses Operator Mesin','Local','2026-07-29 04:57:59');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('84aa2259-ed21-4e1c-92ed-55e89e53a9b1','e367fffd-5155-4b13-b2b2-00d76f416387','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 04:58:13');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('0497466e-0845-4235-aa6f-bb91cd68e9a6','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 04:58:19');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('b8031759-22f2-4bdc-8f25-8253a95e9cba','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Menunggu','Local','2026-07-29 04:58:36');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('28baad8c-c569-4375-9203-c5e957860311','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 04:58:38');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('c332bd31-0220-4be2-9f9c-aef41a6c6ddc','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Kendala','Local','2026-07-29 04:58:44');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('34126d10-fe55-4ede-93aa-cf19d61d994d','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Menunggu','Local','2026-07-29 05:05:53');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('75549907-3531-4255-8704-f694fd678e15','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 05:05:59');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('43ec9658-5292-42d5-b986-2f91e9ff1897','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Menunggu','Local','2026-07-29 05:06:00');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('967ccd87-5b55-4e56-9105-7bacace51e5b','e78bf3ef-3647-4292-a713-73e7f326e7e8','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 05:15:00');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('23295bbb-7e00-40cf-9604-6413f7704d5d','e78bf3ef-3647-4292-a713-73e7f326e7e8','CREATE_USER','Mendaftarkan pengguna baru: oppackaging_budi dengan hak akses Operator Packaging','Local','2026-07-29 05:15:34');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('a76262fe-1e81-4412-9514-f300379ff9aa','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 05:29:41');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('59d846e6-9532-4ad5-9445-1166b68540e9','e367fffd-5155-4b13-b2b2-00d76f416387','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 05:45:30');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('5071cac9-b5a0-45c2-8a21-a6a4bb87a8cc','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 05:45:49');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('54531651-c3a3-462a-a8f0-0288c4e50a65','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Packaging, Status: Menunggu','Local','2026-07-29 05:46:04');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('68e99dbf-6b65-4a65-af21-750ffff496ff','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 05:47:30');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('332db768-0160-4e84-b85e-e2d7aaa203cb','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Operator Packaging, Status: Dikerjakan','Local','2026-07-29 05:47:54');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('d8882ff3-30b3-4bb0-ba22-56e93e8f4ab4','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260728-6990 di-update -> Divisi: Kasir, Status: Menunggu','Local','2026-07-29 05:48:04');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('ab7be944-855d-44a6-81fe-4eb64dffccf8','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 05:48:26');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('5c769b61-3603-4f52-bfc0-646186a6a2b0','f83355ce-9808-4d39-b6d1-09d2d79affa2','UPDATE_PICKUP_STATUS','Update invoice INV-20260728-6990 -> Pengambilan: Diambil Sebagian, Tambahan Bayar: Rp 150000, Status Bayar: Belum Lunas','Local','2026-07-29 05:49:13');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('66ffee68-574b-4784-8bf0-dccf92b3c6cc','f83355ce-9808-4d39-b6d1-09d2d79affa2','UPDATE_PICKUP_STATUS','Update invoice INV-20260728-6990 -> Pengambilan: Sudah Diambil, Tambahan Bayar: Rp 270000, Status Bayar: Lunas','Local','2026-07-29 05:49:27');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('3e2a5051-ee13-49b6-8f96-7828d4028077','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 12:58:40');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('1c50ed8a-e4f1-4184-91a1-70b66241e28a','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 13:23:04');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('1f416080-aaff-4b8e-b6ab-3d1a8659e96e','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 13:49:49');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('d33940b7-6465-41d8-840b-c17bb2ddaf5b','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 14:08:32');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('00537af6-0b2f-499f-a55e-0362675d2250','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 16:09:03');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('444ffa71-8933-49e0-9c5d-3a998d24103a','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 16:55:46');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('a058d5af-f75a-4b9c-9f76-97e42384ad60','e367fffd-5155-4b13-b2b2-00d76f416387','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 16:56:05');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('c8023c07-d716-4cd2-9239-46ecfd742c32','f83355ce-9808-4d39-b6d1-09d2d79affa2','CREATE_ORDER','Membuat pesanan baru INV-20260729-1748 untuk UMKM JUNED','Local','2026-07-29 16:57:20');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('b3e431c2-debf-41e6-9e64-25c51cfedbac','7990e187-5518-434c-a71c-5bd100d30113','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 16:58:28');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('485b068e-329e-44f6-a1a9-e6cb1fbb431a','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Desainer, Status: Dikerjakan','Local','2026-07-29 16:58:32');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('6f4098df-4eb3-44c0-8504-99d505f99524','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Desainer, Status: Revisi','Local','2026-07-29 16:58:36');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('aa349bbc-3128-4b1a-9198-61c9dbd7ea36','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Desainer, Status: Dikerjakan','Local','2026-07-29 16:58:37');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('498bc607-95b4-43c6-8753-c06649d0da8d','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Desainer, Status: Revisi','Local','2026-07-29 16:58:38');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('e7bd5dbf-70d2-4e52-8a17-df122cf29835','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Desainer, Status: Dikerjakan','Local','2026-07-29 16:58:40');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('66af6125-aa16-41aa-85bd-224178cba37f','7990e187-5518-434c-a71c-5bd100d30113','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Mesin, Status: Menunggu','Local','2026-07-29 16:58:54');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('c67d186f-1fae-49de-b3c1-35b1ea9c9882','e367fffd-5155-4b13-b2b2-00d76f416387','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 16:59:49');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('dcd922c1-abe1-4cbb-81ea-ea964c65a914','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 16:59:54');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('77e9ae6d-f6ea-4325-8616-27f0c90c589b','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Mesin, Status: Kendala','Local','2026-07-29 16:59:56');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('88863f94-115e-4184-bd6a-d1c1bf995baa','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Mesin, Status: Dikerjakan','Local','2026-07-29 16:59:59');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('68362487-198a-42b3-8c86-d4c2b2d10d9c','e367fffd-5155-4b13-b2b2-00d76f416387','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Menunggu','Local','2026-07-29 17:00:15');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('66cd76c5-784e-4e6c-880b-a5b2b52549bf','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 17:00:43');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('27ea5cec-4ec5-481c-a3f3-9d75da8b9107','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Dikerjakan','Local','2026-07-29 17:00:50');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('077131e2-1739-45d6-8042-30b39c76b499','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Menunggu','Local','2026-07-29 17:00:53');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('80fe4e01-0c5a-431c-a26d-9e3d373fd4e1','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Dikerjakan','Local','2026-07-29 17:00:54');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('fe6ad11e-563a-4742-aaee-bfc435bde763','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Kendala','Local','2026-07-29 17:00:55');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('1c3f0a00-92b7-47ff-9220-3a99cb483c3b','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Operator Packaging, Status: Dikerjakan','Local','2026-07-29 17:00:57');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('90393b19-9817-49ad-b7c1-bb9f2f62bf6a','b93d8c2b-0c42-49c5-97cc-dce89f36f14b','UPDATE_WORK_ORDER','SPK INV-20260729-1748 di-update -> Divisi: Kasir, Status: Siap Diambil','Local','2026-07-29 17:01:06');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('cd01e98c-1883-453b-929b-802b33c182a5','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 18:10:41');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('eb834509-cd35-4c95-ac14-6f6d2aeb1744','f83355ce-9808-4d39-b6d1-09d2d79affa2','UPDATE_PICKUP_STATUS','Update invoice INV-20260729-1748 -> Pengambilan: Diambil Sebagian, Catatan: "Ambil 100", Bayar Tambahan: Rp 0, Status Bayar: Belum Lunas','Local','2026-07-29 18:25:24');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('7e44c089-05f0-4ad1-8dc2-fc3b2682b17e','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 18:26:10');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('ed0be785-e4c0-4d4d-b442-2ed2f29e6a4a','f83355ce-9808-4d39-b6d1-09d2d79affa2','UPDATE_PICKUP_STATUS','Update invoice INV-20260729-1748 -> Pengambilan: Diambil Semua, Catatan: "Ambil 100", Bayar Tambahan: Rp 0, Status Bayar: Lunas','Local','2026-07-29 18:26:25');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('5043f5a5-41de-4634-9f93-3755b588cc36','f83355ce-9808-4d39-b6d1-09d2d79affa2','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 18:41:48');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('7caeb480-7e75-488c-a104-2dc2981f4182','f83355ce-9808-4d39-b6d1-09d2d79affa2','CASH_FLOW_ENTRY','Input Arus Kas MASUK: Rp 1.500.000 (Hibah)','Local','2026-07-29 18:54:06');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('11f37e7f-b4a1-48b0-b6e9-c8b559777f69','e78bf3ef-3647-4292-a713-73e7f326e7e8','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 19:31:09');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('5e35385d-28b5-4cd3-a36e-f6cd43f03768','e78bf3ef-3647-4292-a713-73e7f326e7e8','CREATE_USER','Mendaftarkan pengguna baru: manajer_budi dengan hak akses Manajer','Local','2026-07-29 19:31:40');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('dc64032e-54c6-44fd-adc5-74139a6d5bd5','b6b656c6-1dbc-49da-8637-56d9f62e1f56','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 19:31:55');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('a90414fa-84d3-4860-92d5-09b3928d4661','b6b656c6-1dbc-49da-8637-56d9f62e1f56','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 19:57:28');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('ee3bc1cb-75aa-4b26-b6a9-b0ce5f975aef','7990e187-5518-434c-a71c-5bd100d30113','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 20:04:17');
INSERT INTO "audit_logs" ("id","user_id","action","details","ip_address","created_at") VALUES('05b334a0-868f-40b5-9174-892905fb0dae','b6b656c6-1dbc-49da-8637-56d9f62e1f56','LOGIN','Pengguna berhasil masuk ke dalam sistem dari alamat IP Local','Local','2026-07-29 20:06:35');
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  current_stage TEXT DEFAULT 'Desainer',
  status TEXT DEFAULT 'Menunggu',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  umkm_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  deadline DATE NOT NULL,
  payment_type TEXT NOT NULL,
  total_amount INTEGER DEFAULT 0,
  dp_amount INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Belum Lunas',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
, pickup_status TEXT DEFAULT 'Belum Diambil', pickup_notes TEXT);
CREATE TABLE transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  nama_kemasan TEXT NOT NULL,
  merek_kemasan TEXT NOT NULL,
  label_kemasan TEXT,
  jenis_kemasan TEXT NOT NULL,
  legalitas TEXT,
  catatan TEXT,
  qty INTEGER DEFAULT 1,
  price INTEGER DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
CREATE TABLE katalog_mitra (
  id TEXT PRIMARY KEY,
  nama_mitra TEXT NOT NULL,
  phone TEXT NOT NULL,
  nama_produk TEXT NOT NULL,
  label TEXT,
  merek TEXT,
  jenis_kemasan TEXT,
  ukuran TEXT,
  nib TEXT,
  pirt TEXT,
  halal TEXT,
  catatan TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);
INSERT INTO "katalog_mitra" ("id","nama_mitra","phone","nama_produk","label","merek","jenis_kemasan","ukuran","nib","pirt","halal","catatan","is_active","created_at","created_by") VALUES('691484f7-871f-4ec0-a933-541330d81b1c','JUNED','08537853873','KERIPIK PARE','PEDAS','PAREKU','STANDING POUCH','12X34','','','','',1,'2026-07-27 17:45:02','f83355ce-9808-4d39-b6d1-09d2d79affa2');
CREATE TABLE cash_flows (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  flow_date TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
