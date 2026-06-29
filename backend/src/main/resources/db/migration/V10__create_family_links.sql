ALTER TABLE families ADD COLUMN owner_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE families ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

CREATE TABLE family_links (
    id BIGSERIAL PRIMARY KEY,
    parent_family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    child_family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT unique_family_link UNIQUE (parent_family_id, child_family_id)
);
