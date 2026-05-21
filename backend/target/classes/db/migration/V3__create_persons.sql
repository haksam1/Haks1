CREATE TABLE persons (
    id BIGSERIAL PRIMARY KEY,
    tree_id BIGINT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    death_date DATE,
    gender VARCHAR(10),
    bio TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
