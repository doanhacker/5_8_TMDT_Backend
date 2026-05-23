USE laptop_ecommerce_db;

CREATE TABLE IF NOT EXISTS phone_specifications (
    product_id INT PRIMARY KEY,
    chipset VARCHAR(120) DEFAULT NULL,
    sim_type VARCHAR(80) DEFAULT NULL,
    front_camera_mp VARCHAR(80) DEFAULT NULL,
    rear_camera_mp VARCHAR(120) DEFAULT NULL,
    network_support VARCHAR(120) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tablet_specifications (
    product_id INT PRIMARY KEY,
    chipset VARCHAR(120) DEFAULT NULL,
    stylus_support BOOLEAN DEFAULT FALSE,
    keyboard_support BOOLEAN DEFAULT FALSE,
    network_support VARCHAR(120) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watch_specifications (
    product_id INT PRIMARY KEY,
    compatible_os VARCHAR(120) DEFAULT NULL,
    strap_material VARCHAR(120) DEFAULT NULL,
    health_tracking_features VARCHAR(255) DEFAULT NULL,
    gps_supported BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audio_specifications (
    product_id INT PRIMARY KEY,
    audio_type VARCHAR(80) DEFAULT NULL,
    bluetooth_version VARCHAR(40) DEFAULT NULL,
    anc_supported BOOLEAN DEFAULT FALSE,
    battery_life_hours INT DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accessory_specifications (
    product_id INT PRIMARY KEY,
    accessory_type VARCHAR(100) DEFAULT NULL,
    compatibility VARCHAR(255) DEFAULT NULL,
    warranty_months INT DEFAULT NULL,
    material VARCHAR(120) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
