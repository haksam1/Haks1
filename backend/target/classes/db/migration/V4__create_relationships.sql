CREATE TABLE relationships (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    related_person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PARENT','CHILD','SPOUSE','SIBLING')),
    UNIQUE(person_id, related_person_id, type)
);
