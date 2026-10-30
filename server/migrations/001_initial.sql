CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 full_name TEXT NOT NULL CHECK(length(trim(full_name)) BETWEEN 1 AND 160),
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('administrador','tecnico')),
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS code_counter (id INTEGER PRIMARY KEY CHECK(id=1), value INTEGER NOT NULL);
INSERT OR IGNORE INTO code_counter(id,value) VALUES(1,0);
CREATE TABLE IF NOT EXISTS equipment (
 id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 160),
 serial TEXT NOT NULL CHECK(length(trim(serial)) BETWEEN 1 AND 160),
 inventory TEXT NOT NULL CHECK(length(trim(inventory)) BETWEEN 1 AND 160),
 brand TEXT NOT NULL CHECK(length(trim(brand)) BETWEEN 1 AND 160),
 model TEXT NOT NULL CHECK(length(trim(model)) BETWEEN 1 AND 160),
 location TEXT NOT NULL CHECK(length(trim(location)) BETWEEN 1 AND 160),
 processor TEXT NOT NULL CHECK(length(trim(processor)) BETWEEN 1 AND 160),
 ram INTEGER NOT NULL CHECK(ram BETWEEN 1 AND 2048),
 storage_type TEXT NOT NULL CHECK(storage_type IN ('SSD','HDD','NVMe','Híbrido')),
 storage_gb INTEGER NOT NULL CHECK(storage_gb BETWEEN 1 AND 1000000),
 os TEXT NOT NULL CHECK(length(trim(os)) BETWEEN 1 AND 160),
 architecture TEXT NOT NULL CHECK(architecture IN ('64 bits','32 bits','ARM64')),
 status TEXT NOT NULL CHECK(status IN ('Funcional','Con fallas','En mantenimiento')),
 observations TEXT NOT NULL DEFAULT '' CHECK(length(observations)<=4000),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_serial_unique ON equipment(lower(trim(serial)));
CREATE UNIQUE INDEX IF NOT EXISTS equipment_inventory_unique ON equipment(lower(trim(inventory)));
CREATE TRIGGER IF NOT EXISTS equipment_capacity BEFORE INSERT ON equipment
 WHEN (SELECT count(*) FROM equipment)>=30 BEGIN SELECT RAISE(ABORT,'CAPACITY'); END;
CREATE TABLE IF NOT EXISTS status_history (
 id TEXT PRIMARY KEY, equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
 previous_status TEXT CHECK(previous_status IN ('Funcional','Con fallas','En mantenimiento')),
 new_status TEXT NOT NULL CHECK(new_status IN ('Funcional','Con fallas','En mantenimiento')),
 changed_at TEXT NOT NULL, actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
 actor_name TEXT NOT NULL, reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 2000)
);
CREATE INDEX IF NOT EXISTS history_equipment_date ON status_history(equipment_id,changed_at DESC);
PRAGMA user_version=1;
