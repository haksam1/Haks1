-- Database Seed Script for Family Tree Weaver
-- Creates 2 complete family trees with >30 members each, realistic Ugandan names, and proper relationships.
-- Set up credentials only for parents and grandparents (or their living children if deceased).

BEGIN;

-- 1. Clean up old data to prevent duplicate keys on re-run
TRUNCATE TABLE invitations, marriages, person_families, relationships, person_photos, persons, family_links, families, family_trees, password_reset_tokens, pending_emails_and_messages, sms_queue, activity_logs CASCADE;
DELETE FROM users WHERE email NOT IN ('admin@familytree.com', 'kincore123@gmail.com');

DO $$
DECLARE
    -- Role IDs (fetched dynamically)
    r_head BIGINT;
    r_member BIGINT;
    
    -- Password Hash (bcrypt for 'password')
    pass_hash VARCHAR := '$2a$10$dXJ3SWI6t4X.oF/9t8B2Fe.F2Xl4K.p11VpX0sVzE4r1Ew5G3ZgC2';
    
    -- Tree 1: Mukasa Family Tree
    t1_id BIGINT;
    t1_owner_id BIGINT;
    
    -- G1 (Grandparents) Tree 1
    p1_yosefu BIGINT; -- Deceased, Paternal Grandfather
    p1_sarah BIGINT;  -- Alive, Paternal Grandmother
    p1_paulo BIGINT;  -- Deceased, Maternal Grandfather
    p1_resty BIGINT;  -- Deceased, Maternal Grandmother
    
    -- G2 (Parents) Tree 1
    p1_john BIGINT;      -- Alive, Father, Paternal Uncle
    p1_florence BIGINT;  -- Alive, Mother, Paternal Aunt-in-law
    p1_david BIGINT;     -- Alive, Father, Family Head (Tree Creator)
    p1_mary BIGINT;      -- Alive, Mother, Aunt/Mother
    p1_peter BIGINT;     -- Alive, Father, Maternal Uncle
    p1_harriet BIGINT;   -- Alive, Mother, Maternal Aunt-in-law
    p1_jane BIGINT;      -- Deceased, Mother, Paternal Aunt
    p1_charles BIGINT;   -- Alive, Father, Uncle-in-law
    p1_stephen BIGINT;   -- Deceased, Father, Maternal Uncle
    p1_alice BIGINT;     -- Alive, Mother, Maternal Aunt-in-law
    
    -- G3 (Children) Tree 1
    -- John & Florence's
    p1_arthur BIGINT; p1_brenda BIGINT; p1_caleb BIGINT; p1_diana BIGINT; p1_edwin BIGINT;
    -- David & Mary's
    p1_fred BIGINT; p1_grace BIGINT; p1_henry BIGINT; p1_irene BIGINT; p1_joel BIGINT; p1_karen BIGINT;
    -- Peter & Harriet's
    p1_liam BIGINT; p1_martha BIGINT; p1_nathan BIGINT; p1_olivia BIGINT;
    -- Jane & Charles's
    p1_patricia BIGINT; -- Representative credential holder for deceased Jane
    p1_ronald BIGINT; p1_sandra BIGINT; p1_timothy BIGINT;
    -- Stephen & Alice's
    p1_simon BIGINT;    -- Representative credential holder for deceased Stephen
    p1_tabitha BIGINT; p1_victor BIGINT; p1_winifred BIGINT;
    
    -- Families Tree 1
    f1_yosefu_sarah BIGINT;
    f1_paulo_resty BIGINT;
    f1_john_florence BIGINT;
    f1_david_mary BIGINT;
    f1_peter_harriet BIGINT;
    f1_jane_charles BIGINT;
    f1_stephen_alice BIGINT;
    
    -- Tree 2: Okello Family Tree
    t2_id BIGINT;
    t2_owner_id BIGINT;
    
    -- G1 (Grandparents) Tree 2
    p2_jokene BIGINT;      -- Deceased, Paternal Grandfather
    p2_grace_ak BIGINT;    -- Alive, Paternal Grandmother
    p2_christopher BIGINT; -- Deceased, Maternal Grandfather
    p2_hellen BIGINT;      -- Deceased, Maternal Grandmother
    
    -- G2 (Parents) Tree 2
    p2_patrick BIGINT;   -- Alive, Father, Family Head (Tree Creator)
    p2_beatrice BIGINT;  -- Alive, Mother
    p2_moses BIGINT;     -- Alive, Father, Maternal Uncle
    p2_margaret BIGINT;  -- Alive, Mother, Maternal Aunt-in-law
    p2_richard BIGINT;   -- Deceased, Father, Paternal Uncle
    p2_sarah_ap BIGINT;  -- Alive, Mother, Paternal Aunt-in-law
    p2_florence_ok BIGINT;-- Alive, Mother, Paternal Aunt
    p2_james BIGINT;     -- Alive, Father, Uncle-in-law
    p2_elizabeth BIGINT; -- Deceased, Mother, Maternal Aunt
    p2_william BIGINT;   -- Alive, Father, Uncle-in-law
    
    -- G3 (Children) Tree 2
    -- Patrick & Beatrice's
    p2_denis BIGINT; p2_evelyn BIGINT; p2_fiona BIGINT; p2_george BIGINT; p2_hope BIGINT;
    -- Moses & Margaret's
    p2_ian BIGINT; p2_julia BIGINT; p2_kevin BIGINT; p2_lucy BIGINT; p2_mark BIGINT;
    -- Richard & Sarah's
    p2_nancy BIGINT;     -- Representative credential holder for deceased Richard
    p2_peter_ok BIGINT; p2_quinto BIGINT; p2_rebecca BIGINT; p2_samuel BIGINT;
    -- Florence & James's
    p2_thomas BIGINT; p2_ursula BIGINT; p2_val BIGINT; p2_walter BIGINT;
    -- Elizabeth & William's
    p2_xavier BIGINT;    -- Representative credential holder for deceased Elizabeth
    p2_yvonne BIGINT; p2_zachary BIGINT; p2_angela BIGINT;
    
    -- Families Tree 2
    f2_jokene_grace BIGINT;
    f2_christopher_hellen BIGINT;
    f2_patrick_beatrice BIGINT;
    f2_moses_margaret BIGINT;
    f2_richard_sarah BIGINT;
    f2_florence_james BIGINT;
    f2_elizabeth_william BIGINT;

BEGIN
    -- Fetch roles
    SELECT id INTO r_head FROM roles WHERE name = 'Family Head';
    SELECT id INTO r_member FROM roles WHERE name = 'Family Member';

    -- =========================================================================
    -- 2. CREATE FAMILY HEADS (USERS) FIRST (to establish tree ownership)
    -- =========================================================================
    
    -- Tree 1 Head
    INSERT INTO users (name, email, password_hash, role_id, is_temporary_password, is_active)
    VALUES ('David Mukasa', 'david.mukasa@gmail.com', pass_hash, r_head, false, true)
    RETURNING id INTO t1_owner_id;
    
    -- Tree 2 Head
    INSERT INTO users (name, email, password_hash, role_id, is_temporary_password, is_active)
    VALUES ('Patrick Okello', 'patrick.okello@gmail.com', pass_hash, r_head, false, true)
    RETURNING id INTO t2_owner_id;

    -- =========================================================================
    -- 3. CREATE FAMILY TREES
    -- =========================================================================
    
    INSERT INTO family_trees (name, owner_id, view)
    VALUES ('Mukasa Family Tree', t1_owner_id, 'no')
    RETURNING id INTO t1_id;
    
    INSERT INTO family_trees (name, owner_id, view)
    VALUES ('Okello Family Tree', t2_owner_id, 'no')
    RETURNING id INTO t2_id;

    -- =========================================================================
    -- 4. INSERT PERSONS FOR TREE 1 (MUKASA FAMILY)
    -- =========================================================================
    
    -- G1 (Grandparents)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Yosefu', 'Mukasa', '1935-05-12', '2010-08-20', 'MALE', 'Paternal grandfather. A respected elder in Buganda.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_yosefu;
    
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Sarah', 'Namukasa', '1942-09-15', 'FEMALE', 'Paternal grandmother. Beloved matriarch of the family.', 'sarah.namukasa@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_sarah;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Paulo', 'Ssewankambo', '1938-11-22', '2015-04-10', 'MALE', 'Maternal grandfather. A dedicated school teacher.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_paulo;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Resty', 'Nankya', '1944-03-30', '2020-12-05', 'FEMALE', 'Maternal grandmother. Passionate about agriculture and community development.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_resty;

    -- G2 (Parents)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'John', 'Mukasa', '1968-01-14', 'MALE', 'Paternal uncle. Engineer in Kampala.', 'john.mukasa@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_john;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Florence', 'Nsubuga', '1974-06-18', 'FEMALE', 'Aunt. High school teacher.', 'florence.nsubuga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_florence;

    -- David Mukasa is the tree owner (G2 Parent)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'David', 'Mukasa', '1970-07-22', 'MALE', 'Family Head. Senior administrator and tree initiator.', 'david.mukasa@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_david;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Mary', 'Ssewankambo', '1975-10-05', 'FEMALE', 'Mother. Medical doctor in Mukono.', 'mary.ssewankambo@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_mary;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Peter', 'Ssewankambo', '1972-04-12', 'MALE', 'Maternal uncle. Businessman in Kampala.', 'peter.ssewankambo@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_peter;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Harriet', 'Nabakooza', '1978-08-30', 'FEMALE', 'Aunt. Accountant.', 'harriet.nabakooza@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_harriet;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Jane', 'Mukasa', '1973-12-05', '2018-09-14', 'FEMALE', 'Paternal aunt. Fondly remembered by all.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_jane;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Charles', 'Lwanga', '1970-02-28', 'MALE', 'Uncle-in-law. Lawyer.', 'charles.lwanga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_charles;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Stephen', 'Ssewankambo', '1976-11-19', '2021-03-22', 'MALE', 'Maternal uncle. Former university lecturer.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_stephen;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Alice', 'Nakato', '1980-05-04', 'FEMALE', 'Aunt. Nurse.', 'alice.nakato@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_alice;

    -- G3 (Children)
    -- John & Florence's children (Arthur, Brenda, Caleb, Diana, Edwin)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Arthur', 'Mukasa', '1995-02-14', 'MALE', 'John and Florence''s eldest son. Software developer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_arthur;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Brenda', 'Namukasa', '1997-04-20', 'FEMALE', 'John and Florence''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_brenda;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Caleb', 'Mukasa', '1999-09-08', 'MALE', 'John and Florence''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_caleb;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Diana', 'Mukasa', '2001-11-23', 'FEMALE', 'John and Florence''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_diana;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Edwin', 'Mukasa', '2004-03-12', 'MALE', 'John and Florence''s youngest son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_edwin;

    -- David & Mary's children (Fred, Grace, Henry, Irene, Joel, Karen)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Fred', 'Mukasa', '1996-03-15', 'MALE', 'David and Mary''s eldest son. Civil engineer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_fred;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Grace', 'Namukasa', '1998-07-10', 'FEMALE', 'David and Mary''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_grace;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Henry', 'Mukasa', '2000-11-02', 'MALE', 'David and Mary''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_henry;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Irene', 'Mukasa', '2003-05-18', 'FEMALE', 'David and Mary''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_irene;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Joel', 'Mukasa', '2006-08-30', 'MALE', 'David and Mary''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_joel;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Karen', 'Mukasa', '2008-12-25', 'FEMALE', 'David and Mary''s youngest daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_karen;

    -- Peter & Harriet's children (Liam, Martha, Nathan, Olivia)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Liam', 'Ssewankambo', '2000-01-15', 'MALE', 'Peter and Harriet''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_liam;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Martha', 'Nankya', '2002-09-08', 'FEMALE', 'Peter and Harriet''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_martha;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Nathan', 'Ssewankambo', '2005-04-22', 'MALE', 'Peter and Harriet''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_nathan;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Olivia', 'Ssewankambo', '2009-07-14', 'FEMALE', 'Peter and Harriet''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_olivia;

    -- Jane & Charles's children (Patricia, Ronald, Sandra, Timothy)
    -- Patricia Lwanga is the representative credential holder for deceased Jane Mukasa
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Patricia', 'Lwanga', '1998-05-19', 'FEMALE', 'Jane and Charles''s eldest daughter. Representative credential holder for her deceased mother, Jane.', 'patricia.lwanga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_patricia;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Ronald', 'Lwanga', '2001-08-02', 'MALE', 'Jane and Charles''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_ronald;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Sandra', 'Lwanga', '2004-10-10', 'FEMALE', 'Jane and Charles''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_sandra;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Timothy', 'Lwanga', '2007-12-11', 'MALE', 'Jane and Charles''s youngest son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_timothy;

    -- Stephen & Alice's children (Simon, Tabitha, Victor, Winifred)
    -- Simon Ssewankambo is the representative credential holder for deceased Stephen Ssewankambo
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Simon', 'Ssewankambo', '2002-04-09', 'MALE', 'Stephen and Alice''s eldest son. Representative credential holder for his deceased father, Stephen.', 'simon.ssewankambo@gmail.com', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_simon;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Tabitha', 'Ssewankambo', '2005-06-25', 'FEMALE', 'Stephen and Alice''s daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_tabitha;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Victor', 'Ssewankambo', '2008-08-14', 'MALE', 'Stephen and Alice''s son.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_victor;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Winifred', 'Ssewankambo', '2011-10-30', 'FEMALE', 'Stephen and Alice''s youngest daughter.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_winifred;

    -- =========================================================================
    -- 5. UPDATE FAMILY HEAD'S PERSON ID LINK
    -- =========================================================================
    
    UPDATE users SET person_id = p1_david WHERE id = t1_owner_id;

    -- =========================================================================
    -- 6. INSERT USERS WITH CREDENTIALS FOR TREE 1
    -- =========================================================================
    
    -- Sarah Namukasa (G1 matriarch)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Sarah Namukasa', 'sarah.namukasa@gmail.com', pass_hash, r_member, p1_sarah, false, true);

    -- John Mukasa (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('John Mukasa', 'john.mukasa@gmail.com', pass_hash, r_member, p1_john, false, true);

    -- Florence Nsubuga (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Florence Nsubuga', 'florence.nsubuga@gmail.com', pass_hash, r_member, p1_florence, false, true);

    -- Mary Ssewankambo (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Mary Ssewankambo', 'mary.ssewankambo@gmail.com', pass_hash, r_member, p1_mary, false, true);

    -- Peter Ssewankambo (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Peter Ssewankambo', 'peter.ssewankambo@gmail.com', pass_hash, r_member, p1_peter, false, true);

    -- Harriet Nabakooza (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Harriet Nabakooza', 'harriet.nabakooza@gmail.com', pass_hash, r_member, p1_harriet, false, true);

    -- Charles Lwanga (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Charles Lwanga', 'charles.lwanga@gmail.com', pass_hash, r_member, p1_charles, false, true);

    -- Alice Nakato (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Alice Nakato', 'alice.nakato@gmail.com', pass_hash, r_member, p1_alice, false, true);

    -- Patricia Lwanga (G3 child - representative for deceased Jane Mukasa)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Patricia Lwanga', 'patricia.lwanga@gmail.com', pass_hash, r_member, p1_patricia, false, true);

    -- Simon Ssewankambo (G3 child - representative for deceased Stephen Ssewankambo)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Simon Ssewankambo', 'simon.ssewankambo@gmail.com', pass_hash, r_member, p1_simon, false, true);


    -- =========================================================================
    -- 7. INSERT RELATIONSHIPS FOR TREE 1
    -- =========================================================================
    
    -- Spouses
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_yosefu, p1_sarah, 'SPOUSE'), (p1_sarah, p1_yosefu, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_paulo, p1_resty, 'SPOUSE'), (p1_resty, p1_paulo, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_florence, 'SPOUSE'), (p1_florence, p1_john, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_mary, 'SPOUSE'), (p1_mary, p1_david, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_harriet, 'SPOUSE'), (p1_harriet, p1_peter, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_jane, p1_charles, 'SPOUSE'), (p1_charles, p1_jane, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_stephen, p1_alice, 'SPOUSE'), (p1_alice, p1_stephen, 'SPOUSE');

    -- Parents (Yosefu & Sarah children)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_yosefu, p1_john, 'PARENT'), (p1_john, p1_yosefu, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_yosefu, p1_david, 'PARENT'), (p1_david, p1_yosefu, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_yosefu, p1_jane, 'PARENT'), (p1_jane, p1_yosefu, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_sarah, p1_john, 'PARENT'), (p1_john, p1_sarah, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_sarah, p1_david, 'PARENT'), (p1_david, p1_sarah, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_sarah, p1_jane, 'PARENT'), (p1_jane, p1_sarah, 'CHILD');

    -- Parents (Paulo & Resty children)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_paulo, p1_mary, 'PARENT'), (p1_mary, p1_paulo, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_paulo, p1_peter, 'PARENT'), (p1_peter, p1_paulo, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_paulo, p1_stephen, 'PARENT'), (p1_stephen, p1_paulo, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_resty, p1_mary, 'PARENT'), (p1_mary, p1_resty, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_resty, p1_peter, 'PARENT'), (p1_peter, p1_resty, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_resty, p1_stephen, 'PARENT'), (p1_stephen, p1_resty, 'CHILD');

    -- John & Florence -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_arthur, 'PARENT'), (p1_arthur, p1_john, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_brenda, 'PARENT'), (p1_brenda, p1_john, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_caleb, 'PARENT'), (p1_caleb, p1_john, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_diana, 'PARENT'), (p1_diana, p1_john, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_edwin, 'PARENT'), (p1_edwin, p1_john, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_florence, p1_arthur, 'PARENT'), (p1_arthur, p1_florence, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_florence, p1_brenda, 'PARENT'), (p1_brenda, p1_florence, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_florence, p1_caleb, 'PARENT'), (p1_caleb, p1_florence, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_florence, p1_diana, 'PARENT'), (p1_diana, p1_florence, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_florence, p1_edwin, 'PARENT'), (p1_edwin, p1_florence, 'CHILD');

    -- David & Mary -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_fred, 'PARENT'), (p1_fred, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_grace, 'PARENT'), (p1_grace, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_henry, 'PARENT'), (p1_henry, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_irene, 'PARENT'), (p1_irene, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_joel, 'PARENT'), (p1_joel, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_karen, 'PARENT'), (p1_karen, p1_david, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_fred, 'PARENT'), (p1_fred, p1_mary, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_grace, 'PARENT'), (p1_grace, p1_mary, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_henry, 'PARENT'), (p1_henry, p1_mary, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_irene, 'PARENT'), (p1_irene, p1_mary, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_joel, 'PARENT'), (p1_joel, p1_mary, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_karen, 'PARENT'), (p1_karen, p1_mary, 'CHILD');

    -- Peter & Harriet -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_liam, 'PARENT'), (p1_liam, p1_peter, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_martha, 'PARENT'), (p1_martha, p1_peter, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_nathan, 'PARENT'), (p1_nathan, p1_peter, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_olivia, 'PARENT'), (p1_olivia, p1_peter, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_harriet, p1_liam, 'PARENT'), (p1_liam, p1_harriet, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_harriet, p1_martha, 'PARENT'), (p1_martha, p1_harriet, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_harriet, p1_nathan, 'PARENT'), (p1_nathan, p1_harriet, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_harriet, p1_olivia, 'PARENT'), (p1_olivia, p1_harriet, 'CHILD');

    -- Jane & Charles -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_jane, p1_patricia, 'PARENT'), (p1_patricia, p1_jane, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_jane, p1_ronald, 'PARENT'), (p1_ronald, p1_jane, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_jane, p1_sandra, 'PARENT'), (p1_sandra, p1_jane, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_jane, p1_timothy, 'PARENT'), (p1_timothy, p1_jane, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_charles, p1_patricia, 'PARENT'), (p1_patricia, p1_charles, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_charles, p1_ronald, 'PARENT'), (p1_ronald, p1_charles, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_charles, p1_sandra, 'PARENT'), (p1_sandra, p1_charles, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_charles, p1_timothy, 'PARENT'), (p1_timothy, p1_charles, 'CHILD');

    -- Stephen & Alice -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_stephen, p1_simon, 'PARENT'), (p1_simon, p1_stephen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_stephen, p1_tabitha, 'PARENT'), (p1_tabitha, p1_stephen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_stephen, p1_victor, 'PARENT'), (p1_victor, p1_stephen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_stephen, p1_winifred, 'PARENT'), (p1_winifred, p1_stephen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_alice, p1_simon, 'PARENT'), (p1_simon, p1_alice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_alice, p1_tabitha, 'PARENT'), (p1_tabitha, p1_alice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_alice, p1_victor, 'PARENT'), (p1_victor, p1_alice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_alice, p1_winifred, 'PARENT'), (p1_winifred, p1_alice, 'CHILD');

    -- Sibling relationships for G2 parents
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_david, 'SIBLING'), (p1_david, p1_john, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_john, p1_jane, 'SIBLING'), (p1_jane, p1_john, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_david, p1_jane, 'SIBLING'), (p1_jane, p1_david, 'SIBLING');

    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_peter, 'SIBLING'), (p1_peter, p1_mary, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_mary, p1_stephen, 'SIBLING'), (p1_stephen, p1_mary, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p1_peter, p1_stephen, 'SIBLING'), (p1_stephen, p1_peter, 'SIBLING');

    -- =========================================================================
    -- 8. FAMILIES, PERSON_FAMILIES & MARRIAGES FOR TREE 1
    -- =========================================================================
    
    -- Insert Families
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Yosefu & Sarah Mukasa Family', t1_owner_id, true) RETURNING id INTO f1_yosefu_sarah;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Paulo & Resty Ssewankambo Family', t1_owner_id, false) RETURNING id INTO f1_paulo_resty;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('John & Florence Mukasa Family', t1_owner_id, false) RETURNING id INTO f1_john_florence;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('David & Mary Mukasa Family', t1_owner_id, false) RETURNING id INTO f1_david_mary;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Peter & Harriet Ssewankambo Family', t1_owner_id, false) RETURNING id INTO f1_peter_harriet;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Jane & Charles Lwanga Family', t1_owner_id, false) RETURNING id INTO f1_jane_charles;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Stephen & Alice Ssewankambo Family', t1_owner_id, false) RETURNING id INTO f1_stephen_alice;

    -- Link members to Families (person_families)
    -- Yosefu & Sarah Family (Parents + G2 children)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_yosefu, f1_yosefu_sarah), (p1_sarah, f1_yosefu_sarah);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_john, f1_yosefu_sarah), (p1_david, f1_yosefu_sarah), (p1_jane, f1_yosefu_sarah);
    
    -- Paulo & Resty Family (Parents + G2 children)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_paulo, f1_paulo_resty), (p1_resty, f1_paulo_resty);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_mary, f1_paulo_resty), (p1_peter, f1_paulo_resty), (p1_stephen, f1_paulo_resty);

    -- John & Florence Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_john, f1_john_florence), (p1_florence, f1_john_florence);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_arthur, f1_john_florence), (p1_brenda, f1_john_florence), (p1_caleb, f1_john_florence), (p1_diana, f1_john_florence), (p1_edwin, f1_john_florence);

    -- David & Mary Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_david, f1_david_mary), (p1_mary, f1_david_mary);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_fred, f1_david_mary), (p1_grace, f1_david_mary), (p1_henry, f1_david_mary), (p1_irene, f1_david_mary), (p1_joel, f1_david_mary), (p1_karen, f1_david_mary);

    -- Peter & Harriet Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_peter, f1_peter_harriet), (p1_harriet, f1_peter_harriet);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_liam, f1_peter_harriet), (p1_martha, f1_peter_harriet), (p1_nathan, f1_peter_harriet), (p1_olivia, f1_peter_harriet);

    -- Jane & Charles Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_jane, f1_jane_charles), (p1_charles, f1_jane_charles);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_patricia, f1_jane_charles), (p1_ronald, f1_jane_charles), (p1_sandra, f1_jane_charles), (p1_timothy, f1_jane_charles);

    -- Stephen & Alice Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p1_stephen, f1_stephen_alice), (p1_alice, f1_stephen_alice);
    INSERT INTO person_families (person_id, family_id) VALUES (p1_simon, f1_stephen_alice), (p1_tabitha, f1_stephen_alice), (p1_victor, f1_stephen_alice), (p1_winifred, f1_stephen_alice);

    -- Marriages
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_yosefu, p1_sarah, '1962-04-18');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_paulo, p1_resty, '1965-06-25');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_john, p1_florence, '1992-12-19');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_david, p1_mary, '1994-09-10');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_peter, p1_harriet, '1998-11-28');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_jane, p1_charles, '1996-05-15');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p1_stephen, p1_alice, '2000-01-22');


    -- =========================================================================
    -- 9. INSERT PERSONS FOR TREE 2 (OKELLO FAMILY)
    -- =========================================================================
    
    -- G1 (Grandparents)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Jokene', 'Okello', '1934-03-11', '2008-11-14', 'MALE', 'Paternal grandfather. Respected agriculturalist in Gulu.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_jokene;
    
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Grace', 'Akech', '1941-07-25', 'FEMALE', 'Paternal grandmother. Former mid-wife.', 'grace.akech@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_grace_ak;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Christopher', 'Odoi', '1937-08-14', '2012-05-30', 'MALE', 'Maternal grandfather. Community leader in Tororo.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_christopher;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Hellen', 'Akello', '1943-12-02', '2018-07-19', 'FEMALE', 'Maternal grandmother. Local business owner.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_hellen;

    -- G2 (Parents)
    -- Patrick Okello is the tree owner (G2 Parent)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Patrick', 'Okello', '1969-09-18', 'MALE', 'Family Head. High school principal.', 'patrick.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_patrick;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Beatrice', 'Odoi', '1973-10-15', 'FEMALE', 'Mother. Lecturer at Gulu University.', 'beatrice.odoi@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_beatrice;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Moses', 'Odoi', '1971-11-04', 'MALE', 'Maternal uncle. Civil servant.', 'moses.odoi@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_moses;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Margaret', 'Anyango', '1976-02-28', 'FEMALE', 'Aunt. Pharmacist.', 'margaret.anyango@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_margaret;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Richard', 'Okello', '1972-06-12', '2019-10-05', 'MALE', 'Paternal uncle. Former banker.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_richard;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Sarah', 'Apio', '1977-12-14', 'FEMALE', 'Aunt. Entrepreneur.', 'sarah.apio@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_sarah_ap;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Florence', 'Okello', '1975-04-30', 'FEMALE', 'Paternal aunt. Social worker.', 'florence.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_florence_ok;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'James', 'Ochieng', '1970-08-22', 'MALE', 'Uncle-in-law. Veterinary surgeon.', 'james.ochieng@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_james;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Elizabeth', 'Odoi', '1978-05-14', '2020-04-20', 'FEMALE', 'Maternal aunt. Accountant.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_elizabeth;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'William', 'Mwaka', '1974-03-09', 'MALE', 'Uncle-in-law. Journalist.', 'william.mwaka@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_william;

    -- G3 (Children)
    -- Patrick & Beatrice's children (Denis, Evelyn, Fiona, George, Hope)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Denis', 'Okello', '1994-04-12', 'MALE', 'Patrick and Beatrice''s eldest son. Mechanical engineer.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_denis;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Evelyn', 'Okello', '1996-06-28', 'FEMALE', 'Patrick and Beatrice''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_evelyn;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Fiona', 'Okello', '1998-09-05', 'FEMALE', 'Patrick and Beatrice''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_fiona;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'George', 'Okello', '2001-12-14', 'MALE', 'Patrick and Beatrice''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_george;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Hope', 'Okello', '2004-10-02', 'FEMALE', 'Patrick and Beatrice''s youngest daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_hope;

    -- Moses & Margaret's children (Ian, Julia, Kevin, Lucy, Mark)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ian', 'Odoi', '1997-03-24', 'MALE', 'Moses and Margaret''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_ian;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Julia', 'Odoi', '1999-07-15', 'FEMALE', 'Moses and Margaret''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_julia;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Kevin', 'Odoi', '2002-11-22', 'MALE', 'Moses and Margaret''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_kevin;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Lucy', 'Odoi', '2005-02-18', 'FEMALE', 'Moses and Margaret''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_lucy;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Mark', 'Odoi', '2008-05-30', 'MALE', 'Moses and Margaret''s youngest son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_mark;

    -- Richard & Sarah's children (Nancy, Peter, Quinto, Rebecca, Samuel)
    -- Nancy Okello is the representative credential holder for deceased Richard Okello
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Nancy', 'Okello', '1998-02-12', 'FEMALE', 'Richard and Sarah''s eldest daughter. Representative credential holder for her deceased father, Richard.', 'nancy.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_nancy;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Peter', 'Okello', '2000-05-05', 'MALE', 'Richard and Sarah''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_peter_ok;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Quinto', 'Okello', '2003-08-19', 'MALE', 'Richard and Sarah''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_quinto;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Rebecca', 'Okello', '2006-11-26', 'FEMALE', 'Richard and Sarah''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_rebecca;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Samuel', 'Okello', '2009-12-14', 'MALE', 'Richard and Sarah''s youngest son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_samuel;

    -- Florence & James's children (Thomas, Ursula, Val, Walter)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Thomas', 'Ochieng', '2000-01-28', 'MALE', 'Florence and James''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_thomas;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ursula', 'Ochieng', '2002-09-30', 'FEMALE', 'Florence and James''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_ursula;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Val', 'Ochieng', '2005-04-14', 'FEMALE', 'Florence and James''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_val;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Walter', 'Ochieng', '2008-07-22', 'MALE', 'Florence and James''s youngest son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_walter;

    -- Elizabeth & William's children (Xavier, Yvonne, Zachary, Angela)
    -- Xavier Mwaka is the representative credential holder for deceased Elizabeth Odoi
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Xavier', 'Mwaka', '2002-06-18', 'MALE', 'Elizabeth and William''s eldest son. Representative credential holder for his deceased mother, Elizabeth.', 'xavier.mwaka@gmail.com', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_xavier;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Yvonne', 'Mwaka', '2005-08-30', 'FEMALE', 'Elizabeth and William''s daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_yvonne;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Zachary', 'Mwaka', '2008-11-25', 'MALE', 'Elizabeth and William''s son.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_zachary;
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Angela', 'Mwaka', '2011-12-14', 'FEMALE', 'Elizabeth and William''s youngest daughter.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_angela;

    -- =========================================================================
    -- 10. UPDATE FAMILY HEAD'S PERSON ID LINK FOR TREE 2
    -- =========================================================================
    
    UPDATE users SET person_id = p2_patrick WHERE id = t2_owner_id;

    -- =========================================================================
    -- 11. INSERT USERS WITH CREDENTIALS FOR TREE 2
    -- =========================================================================
    
    -- Grace Akech (G1 matriarch)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Grace Akech', 'grace.akech@gmail.com', pass_hash, r_member, p2_grace_ak, false, true);

    -- Beatrice Odoi (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Beatrice Odoi', 'beatrice.odoi@gmail.com', pass_hash, r_member, p2_beatrice, false, true);

    -- Moses Odoi (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Moses Odoi', 'moses.odoi@gmail.com', pass_hash, r_member, p2_moses, false, true);

    -- Margaret Anyango (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Margaret Anyango', 'margaret.anyango@gmail.com', pass_hash, r_member, p2_margaret, false, true);

    -- Sarah Apio (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Sarah Apio', 'sarah.apio@gmail.com', pass_hash, r_member, p2_sarah_ap, false, true);

    -- Florence Okello (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Florence Okello', 'florence.okello@gmail.com', pass_hash, r_member, p2_florence_ok, false, true);

    -- James Ochieng (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('James Ochieng', 'james.ochieng@gmail.com', pass_hash, r_member, p2_james, false, true);

    -- William Mwaka (G2 parent)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('William Mwaka', 'william.mwaka@gmail.com', pass_hash, r_member, p2_william, false, true);

    -- Nancy Okello (G3 child - representative for deceased Richard Okello)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Nancy Okello', 'nancy.okello@gmail.com', pass_hash, r_member, p2_nancy, false, true);

    -- Xavier Mwaka (G3 child - representative for deceased Elizabeth Odoi)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active)
    VALUES ('Xavier Mwaka', 'xavier.mwaka@gmail.com', pass_hash, r_member, p2_xavier, false, true);


    -- =========================================================================
    -- 12. INSERT RELATIONSHIPS FOR TREE 2
    -- =========================================================================
    
    -- Spouses
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_jokene, p2_grace_ak, 'SPOUSE'), (p2_grace_ak, p2_jokene, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_christopher, p2_hellen, 'SPOUSE'), (p2_hellen, p2_christopher, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_beatrice, 'SPOUSE'), (p2_beatrice, p2_patrick, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_margaret, 'SPOUSE'), (p2_margaret, p2_moses, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_sarah_ap, 'SPOUSE'), (p2_sarah_ap, p2_richard, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_florence_ok, p2_james, 'SPOUSE'), (p2_james, p2_florence_ok, 'SPOUSE');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_elizabeth, p2_william, 'SPOUSE'), (p2_william, p2_elizabeth, 'SPOUSE');

    -- Parents (Jokene & Grace children)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_jokene, p2_patrick, 'PARENT'), (p2_patrick, p2_jokene, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_jokene, p2_richard, 'PARENT'), (p2_richard, p2_jokene, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_jokene, p2_florence_ok, 'PARENT'), (p2_florence_ok, p2_jokene, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_grace_ak, p2_patrick, 'PARENT'), (p2_patrick, p2_grace_ak, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_grace_ak, p2_richard, 'PARENT'), (p2_richard, p2_grace_ak, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_grace_ak, p2_florence_ok, 'PARENT'), (p2_florence_ok, p2_grace_ak, 'CHILD');

    -- Parents (Christopher & Hellen children)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_christopher, p2_beatrice, 'PARENT'), (p2_beatrice, p2_christopher, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_christopher, p2_moses, 'PARENT'), (p2_moses, p2_christopher, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_christopher, p2_elizabeth, 'PARENT'), (p2_elizabeth, p2_christopher, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_hellen, p2_beatrice, 'PARENT'), (p2_beatrice, p2_hellen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_hellen, p2_moses, 'PARENT'), (p2_moses, p2_hellen, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_hellen, p2_elizabeth, 'PARENT'), (p2_elizabeth, p2_hellen, 'CHILD');

    -- Patrick & Beatrice -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_denis, 'PARENT'), (p2_denis, p2_patrick, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_evelyn, 'PARENT'), (p2_evelyn, p2_patrick, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_fiona, 'PARENT'), (p2_fiona, p2_patrick, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_george, 'PARENT'), (p2_george, p2_patrick, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_hope, 'PARENT'), (p2_hope, p2_patrick, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_denis, 'PARENT'), (p2_denis, p2_beatrice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_evelyn, 'PARENT'), (p2_evelyn, p2_beatrice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_fiona, 'PARENT'), (p2_fiona, p2_beatrice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_george, 'PARENT'), (p2_george, p2_beatrice, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_hope, 'PARENT'), (p2_hope, p2_beatrice, 'CHILD');

    -- Moses & Margaret -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_ian, 'PARENT'), (p2_ian, p2_moses, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_julia, 'PARENT'), (p2_julia, p2_moses, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_kevin, 'PARENT'), (p2_kevin, p2_moses, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_lucy, 'PARENT'), (p2_lucy, p2_moses, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_mark, 'PARENT'), (p2_mark, p2_moses, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_margaret, p2_ian, 'PARENT'), (p2_ian, p2_margaret, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_margaret, p2_julia, 'PARENT'), (p2_julia, p2_margaret, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_margaret, p2_kevin, 'PARENT'), (p2_kevin, p2_margaret, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_margaret, p2_lucy, 'PARENT'), (p2_lucy, p2_margaret, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_margaret, p2_mark, 'PARENT'), (p2_mark, p2_margaret, 'CHILD');

    -- Richard & Sarah -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_nancy, 'PARENT'), (p2_nancy, p2_richard, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_peter_ok, 'PARENT'), (p2_peter_ok, p2_richard, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_quinto, 'PARENT'), (p2_quinto, p2_richard, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_rebecca, 'PARENT'), (p2_rebecca, p2_richard, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_samuel, 'PARENT'), (p2_samuel, p2_richard, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_sarah_ap, p2_nancy, 'PARENT'), (p2_nancy, p2_sarah_ap, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_sarah_ap, p2_peter_ok, 'PARENT'), (p2_peter_ok, p2_sarah_ap, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_sarah_ap, p2_quinto, 'PARENT'), (p2_quinto, p2_sarah_ap, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_sarah_ap, p2_rebecca, 'PARENT'), (p2_rebecca, p2_sarah_ap, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_sarah_ap, p2_samuel, 'PARENT'), (p2_samuel, p2_sarah_ap, 'CHILD');

    -- Florence & James -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_florence_ok, p2_thomas, 'PARENT'), (p2_thomas, p2_florence_ok, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_florence_ok, p2_ursula, 'PARENT'), (p2_ursula, p2_florence_ok, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_florence_ok, p2_val, 'PARENT'), (p2_val, p2_florence_ok, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_florence_ok, p2_walter, 'PARENT'), (p2_walter, p2_florence_ok, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_james, p2_thomas, 'PARENT'), (p2_thomas, p2_james, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_james, p2_ursula, 'PARENT'), (p2_ursula, p2_james, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_james, p2_val, 'PARENT'), (p2_val, p2_james, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_james, p2_walter, 'PARENT'), (p2_walter, p2_james, 'CHILD');

    -- Elizabeth & William -> Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_elizabeth, p2_xavier, 'PARENT'), (p2_xavier, p2_elizabeth, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_elizabeth, p2_yvonne, 'PARENT'), (p2_yvonne, p2_elizabeth, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_elizabeth, p2_zachary, 'PARENT'), (p2_zachary, p2_elizabeth, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_elizabeth, p2_angela, 'PARENT'), (p2_angela, p2_elizabeth, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_william, p2_xavier, 'PARENT'), (p2_xavier, p2_william, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_william, p2_yvonne, 'PARENT'), (p2_yvonne, p2_william, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_william, p2_zachary, 'PARENT'), (p2_zachary, p2_william, 'CHILD');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_william, p2_angela, 'PARENT'), (p2_angela, p2_william, 'CHILD');

    -- Sibling relationships for G2 parents
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_richard, 'SIBLING'), (p2_richard, p2_patrick, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_patrick, p2_florence_ok, 'SIBLING'), (p2_florence_ok, p2_patrick, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_richard, p2_florence_ok, 'SIBLING'), (p2_florence_ok, p2_richard, 'SIBLING');

    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_moses, 'SIBLING'), (p2_moses, p2_beatrice, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_beatrice, p2_elizabeth, 'SIBLING'), (p2_elizabeth, p2_beatrice, 'SIBLING');
    INSERT INTO relationships (person_id, related_person_id, type) VALUES (p2_moses, p2_elizabeth, 'SIBLING'), (p2_elizabeth, p2_moses, 'SIBLING');


    -- =========================================================================
    -- 13. FAMILIES, PERSON_FAMILIES & MARRIAGES FOR TREE 2
    -- =========================================================================
    
    -- Insert Families
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Jokene & Grace Okello Family', t2_owner_id, true) RETURNING id INTO f2_jokene_grace;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Christopher & Hellen Odoi Family', t2_owner_id, false) RETURNING id INTO f2_christopher_hellen;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Patrick & Beatrice Okello Family', t2_owner_id, false) RETURNING id INTO f2_patrick_beatrice;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Moses & Margaret Odoi Family', t2_owner_id, false) RETURNING id INTO f2_moses_margaret;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Richard & Sarah Okello Family', t2_owner_id, false) RETURNING id INTO f2_richard_sarah;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Florence & James Ochieng Family', t2_owner_id, false) RETURNING id INTO f2_florence_james;
    INSERT INTO families (name, owner_id, is_primary) VALUES ('Elizabeth & William Mwaka Family', t2_owner_id, false) RETURNING id INTO f2_elizabeth_william;

    -- Link members to Families (person_families)
    -- Jokene & Grace Family (Parents + G2 children)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_jokene, f2_jokene_grace), (p2_grace_ak, f2_jokene_grace);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_patrick, f2_jokene_grace), (p2_richard, f2_jokene_grace), (p2_florence_ok, f2_jokene_grace);
    
    -- Christopher & Hellen Family (Parents + G2 children)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_christopher, f2_christopher_hellen), (p2_hellen, f2_christopher_hellen);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_beatrice, f2_christopher_hellen), (p2_moses, f2_christopher_hellen), (p2_elizabeth, f2_christopher_hellen);

    -- Patrick & Beatrice Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_patrick, f2_patrick_beatrice), (p2_beatrice, f2_patrick_beatrice);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_denis, f2_patrick_beatrice), (p2_evelyn, f2_patrick_beatrice), (p2_fiona, f2_patrick_beatrice), (p2_george, f2_patrick_beatrice), (p2_hope, f2_patrick_beatrice);

    -- Moses & Margaret Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_moses, f2_moses_margaret), (p2_margaret, f2_moses_margaret);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_ian, f2_moses_margaret), (p2_julia, f2_moses_margaret), (p2_kevin, f2_moses_margaret), (p2_lucy, f2_moses_margaret), (p2_mark, f2_moses_margaret);

    -- Richard & Sarah Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_richard, f2_richard_sarah), (p2_sarah_ap, f2_richard_sarah);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_nancy, f2_richard_sarah), (p2_peter_ok, f2_richard_sarah), (p2_quinto, f2_richard_sarah), (p2_rebecca, f2_richard_sarah), (p2_samuel, f2_richard_sarah);

    -- Florence & James Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_florence_ok, f2_florence_james), (p2_james, f2_florence_james);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_thomas, f2_florence_james), (p2_ursula, f2_florence_james), (p2_val, f2_florence_james), (p2_walter, f2_florence_james);

    -- Elizabeth & William Family (Parents + kids)
    INSERT INTO person_families (person_id, family_id) VALUES (p2_elizabeth, f2_elizabeth_william), (p2_william, f2_elizabeth_william);
    INSERT INTO person_families (person_id, family_id) VALUES (p2_xavier, f2_elizabeth_william), (p2_yvonne, f2_elizabeth_william), (p2_zachary, f2_elizabeth_william), (p2_angela, f2_elizabeth_william);

    -- Marriages
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_jokene, p2_grace_ak, '1961-05-10');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_christopher, p2_hellen, '1964-08-15');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_patrick, p2_beatrice, '1993-06-19');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_moses, p2_margaret, '1995-10-12');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_richard, p2_sarah_ap, '1997-04-18');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_florence_ok, p2_james, '1998-11-28');
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES (p2_elizabeth, p2_william, '2000-07-22');

END $$;

COMMIT;
