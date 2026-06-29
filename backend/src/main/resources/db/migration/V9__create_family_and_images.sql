CREATE TABLE families (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE person_families (
    person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, family_id)
);

CREATE TABLE marriages (
    id BIGSERIAL PRIMARY KEY,
    person1_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person2_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    marriage_date DATE
);

CREATE TABLE person_photos (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT UNIQUE NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    format VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    compressed_blob BYTEA NOT NULL
);
