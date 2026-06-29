-- Flyway SQL seed migration: V11__seed_family_trees.sql
-- Seeds two complete independent Ugandan family trees with 42 members each (total 84 people)
-- Represents Baganda, Banyankole, Basoga, Acholi, Iteso, Banyarwanda, and Bakiga families

BEGIN;

DO $$
DECLARE
    -- Role IDs
    r_head BIGINT;
    r_member BIGINT;
    
    -- BCrypt password hash (for 'password')
    pass_hash VARCHAR := '$2a$10$dXJ3SWI6t4X.oF/9t8B2Fe.F2Xl4K.p11VpX0sVzE4r1Ew5G3ZgC2';
    
    -- Tree 1: Tumusiime & Mukasa Family Tree
    t1_id BIGINT;
    t1_owner_id BIGINT;
    
    -- G1 Tree 1
    p1_yosefu BIGINT; -- Deceased Paternal Grandfather
    p1_sarah BIGINT;  -- Alive Paternal Grandmother
    p1_paulo BIGINT;  -- Deceased Maternal Grandfather
    p1_resty BIGINT;  -- Deceased Maternal Grandmother
    
    -- G2 Tree 1
    p1_john BIGINT;      -- Alive Uncle / Father
    p1_florence BIGINT;  -- Alive Aunt-in-law / Mother
    p1_david BIGINT;     -- Alive Father (Family Head / Tree Creator)
    p1_mary BIGINT;      -- Alive Mother
    p1_peter BIGINT;     -- Alive Uncle
    p1_harriet BIGINT;   -- Alive Aunt-in-law
    p1_jane BIGINT;      -- Deceased Aunt
    p1_charles BIGINT;   -- Alive Uncle-in-law
    p1_stephen BIGINT;   -- Deceased Uncle
    p1_alice BIGINT;     -- Alive Aunt-in-law
    
    -- G3 Tree 1
    p1_arthur BIGINT; p1_brenda BIGINT; p1_caleb BIGINT; p1_diana BIGINT; p1_edwin BIGINT;
    p1_fred BIGINT; p1_grace BIGINT; p1_henry BIGINT; p1_irene BIGINT; p1_joel BIGINT; p1_karen BIGINT;
    p1_liam BIGINT; p1_martha BIGINT; p1_nathan BIGINT; p1_olivia BIGINT;
    p1_patricia BIGINT; -- Representative credential holder for deceased Jane
    p1_ronald BIGINT; p1_sandra BIGINT; p1_timothy BIGINT;
    p1_simon BIGINT;    -- Representative credential holder for deceased Stephen
    p1_tabitha BIGINT; p1_victor BIGINT; p1_winifred BIGINT;
    
    -- G3 In-laws Tree 1
    p1_kemigisa BIGINT; p1_ajok BIGINT;
    
    -- G4 Great-grandchildren Tree 1
    p1_kato_g4 BIGINT; p1_babirye_g4 BIGINT; p1_mugisha_g4 BIGINT;
    
    -- Families Tree 1
    f1_primary BIGINT;
    f1_maternal_gp BIGINT;
    f1_john_florence BIGINT;
    f1_david_mary BIGINT;
    f1_peter_harriet BIGINT;
    f1_jane_charles BIGINT;
    f1_stephen_alice BIGINT;
    f1_arthur_kemigisa BIGINT;
    f1_fred_ajok BIGINT;

    -- Tree 2: Okello & Odoi Family Tree
    t2_id BIGINT;
    t2_owner_id BIGINT;
    
    -- G1 Tree 2
    p2_jokene BIGINT;      -- Deceased Paternal Grandfather
    p2_grace_ak BIGINT;    -- Alive Paternal Grandmother
    p2_christopher BIGINT; -- Deceased Maternal Grandfather
    p2_hellen BIGINT;      -- Deceased Maternal Grandmother
    
    -- G2 Tree 2
    p2_patrick BIGINT;   -- Alive Father (Family Head / Tree Creator)
    p2_beatrice BIGINT;  -- Alive Mother
    p2_moses BIGINT;     -- Alive Uncle
    p2_margaret BIGINT;  -- Alive Aunt-in-law
    p2_richard BIGINT;   -- Deceased Uncle
    p2_sarah_ap BIGINT;  -- Alive Aunt-in-law
    p2_florence_ok BIGINT;-- Alive Aunt
    p2_james BIGINT;     -- Alive Uncle-in-law
    p2_elizabeth BIGINT; -- Deceased Aunt
    p2_william BIGINT;   -- Alive Uncle-in-law
    
    -- G3 Tree 2
    p2_denis BIGINT; p2_evelyn BIGINT; p2_fiona BIGINT; p2_george BIGINT; p2_hope BIGINT;
    p2_ian BIGINT; p2_julia BIGINT; p2_kevin BIGINT; p2_lucy BIGINT; p2_mark BIGINT;
    p2_nancy BIGINT;     -- Representative credential holder for deceased Richard
    p2_peter_ok BIGINT; p2_quinto BIGINT; p2_rebecca BIGINT; p2_samuel BIGINT;
    p2_thomas BIGINT; p2_ursula BIGINT; p2_val BIGINT; p2_walter BIGINT;
    p2_xavier BIGINT;    -- Representative credential holder for deceased Elizabeth
    p2_yvonne BIGINT; p2_zachary BIGINT; p2_angela BIGINT;
    
    -- G3 In-laws Tree 2
    p2_naigaga BIGINT; p2_atim BIGINT;
    
    -- G4 Great-grandchildren Tree 2
    p2_ocen_g4 BIGINT; p2_ajok_g4 BIGINT; p2_odoi_g4 BIGINT;
    
    -- Families Tree 2
    f2_primary BIGINT;
    f2_maternal_gp BIGINT;
    f2_patrick_beatrice BIGINT;
    f2_moses_margaret BIGINT;
    f2_richard_sarah BIGINT;
    f2_florence_james BIGINT;
    f2_elizabeth_william BIGINT;
    f2_denis_naigaga BIGINT;
    f2_ian_atim BIGINT;

BEGIN
    -- 1. Clean up old/stale data to prevent duplicate keys on re-run
    TRUNCATE TABLE invitations, marriages, person_families, relationships, person_photos, persons, family_links, families, family_trees, password_reset_tokens, pending_emails_and_messages, sms_queue, activity_logs CASCADE;
    DELETE FROM users WHERE email NOT IN ('admin@familytree.com', 'kincore123@gmail.com');

    -- Fetch Role IDs
    SELECT id INTO r_head FROM roles WHERE name = 'Family Head';
    SELECT id INTO r_member FROM roles WHERE name = 'Family Member';

    -- =========================================================================
    -- TREE 1: TUMUSIIME & MUKASA FAMILY (42 MEMBERS)
    -- =========================================================================

    -- Create Family Head User for Tree 1
    INSERT INTO users (name, email, password_hash, role_id, is_temporary_password, is_active)
    VALUES ('David Tumusiime', 'david.tumusiime@gmail.com', pass_hash, r_head, false, true)
    RETURNING id INTO t1_owner_id;

    -- Create Family Tree 1
    INSERT INTO family_trees (name, owner_id, view)
    VALUES ('Tumusiime & Mukasa Family Tree', t1_owner_id, 'no')
    RETURNING id INTO t1_id;

    -- G1 (Grandparents) - Tree 1
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Yosefu', 'Mukasa', '1935-05-12', '2010-08-20', 'MALE', 'Clan: Mmamba. Village: Kibuye. District: Wakiso. Occupation: Retired Headmaster. Respected patriarch who loved reading.', '+256772100111', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_yosefu;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Sarah', 'Namutebi', '1941-09-15', 'FEMALE', 'Clan: Mmamba. Village: Kibuye. District: Wakiso. Occupation: Traditional Weaver. Beloved grandmother who keeps family recipes alive.', '+256772100222', 'sarah.namutebi@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_sarah;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Paulo', 'Mwesigwa', '1938-11-22', '2015-04-10', 'MALE', 'Clan: Bahinda. Village: Bushenyi. District: Bushenyi. Occupation: Farmer and Cattle Keeper. Famous for his beautiful cows.', '+256772100333', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_paulo;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Resty', 'Kemigisa', '1944-03-30', '2020-12-05', 'FEMALE', 'Clan: Bahinda. Village: Bushenyi. District: Bushenyi. Occupation: Nurse and Community Volunteer. Always cared for the sick.', '+256772100444', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_resty;

    -- G2 (Parents) - Tree 1
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'John', 'Kato', '1968-01-14', 'MALE', 'Clan: Mmamba. Village: Kibuye. District: Wakiso. Occupation: Mechanical Engineer. Elder twin brother.', '+256772200111', 'john.kato@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_john;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Florence', 'Naigaga', '1974-06-18', 'FEMALE', 'Clan: Ffumbe. Village: Iganga. District: Iganga. Occupation: High School Teacher. Passionate about literature.', '+256772200222', 'florence.naigaga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_florence;

    -- David Tumusiime is the tree owner (G2 Parent)
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'David', 'Tumusiime', '1970-07-22', 'MALE', 'Clan: Mmamba. Village: Kibuye. District: Wakiso. Occupation: Senior Accountant in Kampala. Family Head and tree creator.', '+256772200333', 'david.tumusiime@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_david;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Mary', 'Natukunda', '1975-10-05', 'FEMALE', 'Clan: Bahinda. Village: Bushenyi. District: Bushenyi. Occupation: Doctor in Mukono. Passionate about child health.', '+256772200444', 'mary.natukunda@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_mary;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Peter', 'Tumusiime', '1972-04-12', 'MALE', 'Clan: Bahinda. Village: Bushenyi. District: Bushenyi. Occupation: Businessman. Runs a logistics firm in Kampala.', '+256772200555', 'peter.tumusiime@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_peter;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Harriet', 'Nabakooza', '1978-08-30', 'FEMALE', 'Clan: Lugave. Village: Mpigi. District: Mpigi. Occupation: Banker. Loving mother of four.', '+256772200666', 'harriet.nabakooza@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_harriet;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Jane', 'Babirye', '1973-12-05', '2018-09-14', 'FEMALE', 'Clan: Mmamba. Village: Kibuye. District: Wakiso. Occupation: Pharmacist. Twin sister, fondly remembered.', '+256772200777', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_jane;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Charles', 'Lwanga', '1970-02-28', 'MALE', 'Clan: Ngabi. Village: Masaka. District: Masaka. Occupation: Corporate Lawyer. Avid golfer and community organizer.', '+256772200888', 'charles.lwanga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_charles;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Stephen', 'Mwesigwa', '1976-11-19', '2021-03-22', 'MALE', 'Clan: Bahinda. Village: Bushenyi. District: Bushenyi. Occupation: University Lecturer in Physics. Devoted researcher.', '+256772200999', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_stephen;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Alice', 'Nakato', '1980-05-04', 'FEMALE', 'Clan: Nsenene. Village: Luwero. District: Luwero. Occupation: Pediatric Nurse. Very active in church choir.', '+256772200100', 'alice.nakato@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_alice;

    -- G3 (Children) - Tree 1
    -- John & Florence's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Arthur', 'Wasswa', '1995-02-14', 'MALE', 'John & Florence''s eldest son. Software developer in Kampala. Twin.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_arthur;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Brenda', 'Nansubuga', '1997-04-20', 'FEMALE', 'Daughter of John and Florence. Civil engineer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_brenda;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Caleb', 'Ssemanda', '1999-09-08', 'MALE', 'Son of John and Florence. Student of Architecture.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_caleb;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Diana', 'Namagembe', '2001-11-23', 'FEMALE', 'Daughter of John and Florence. Nutritionist.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_diana;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Edwin', 'Kato', '2004-03-12', 'MALE', 'John & Florence''s youngest son. Twin.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_edwin;

    -- David & Mary's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Fred', 'Tumusiime', '1996-03-15', 'MALE', 'David & Mary''s eldest son. Civil Engineer in Entebbe.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_fred;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Grace', 'Natukunda', '1998-07-10', 'FEMALE', 'Daughter of David and Mary. Fashion designer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_grace;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Henry', 'Tumusiime', '2000-11-02', 'MALE', 'Son of David and Mary. Agricultural officer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_henry;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Irene', 'Kyomuhendo', '2003-05-18', 'FEMALE', 'Daughter of David and Mary. Medical student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_irene;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Joel', 'Mugisha', '2006-08-30', 'MALE', 'Son of David and Mary. Budding IT specialist.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_joel;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Karen', 'Asiimwe', '2008-12-25', 'FEMALE', 'David & Mary''s youngest daughter. High school student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_karen;

    -- Peter & Harriet's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Liam', 'Asiimwe', '2000-01-15', 'MALE', 'Son of Peter and Harriet. Graphic designer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_liam;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Martha', 'Kemigisa', '2002-09-08', 'FEMALE', 'Daughter of Peter and Harriet. Fine artist.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_martha;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Nathan', 'Tumusiime', '2005-04-22', 'MALE', 'Son of Peter and Harriet. High school athlete.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_nathan;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Olivia', 'Kyomuhendo', '2009-07-14', 'FEMALE', 'Peter & Harriet''s youngest daughter. Student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_olivia;

    -- Jane & Charles's children
    -- Patricia Lwanga is the representative credential holder for deceased mother Jane Babirye
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Patricia', 'Lwanga', '1998-05-19', 'FEMALE', 'Jane and Charles''s eldest daughter. Representative credential holder for her deceased mother, Jane. Clinical pharmacist.', '+256772300111', 'patricia.lwanga@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_patricia;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Ronald', 'Lwanga', '2001-08-02', 'MALE', 'Son of Jane and Charles. IT Support Officer.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_ronald;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Sandra', 'Lwanga', '2004-10-10', 'FEMALE', 'Daughter of Jane and Charles. Business student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_sandra;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Timothy', 'Lwanga', '2007-12-11', 'MALE', 'Jane & Charles''s youngest son. High school student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_timothy;

    -- Stephen & Alice's children
    -- Simon Mwesigwa is the representative credential holder for deceased father Stephen Mwesigwa
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Simon', 'Mwesigwa', '2002-04-09', 'MALE', 'Stephen and Alice''s eldest son. Representative credential holder for his deceased father, Stephen. Software engineering student.', '+256772300222', 'simon.mwesigwa@gmail.com', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_simon;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Tabitha', 'Kemigisa', '2005-06-25', 'FEMALE', 'Daughter of Stephen and Alice. Undergraduate nursing student.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_tabitha;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Victor', 'Mwesigwa', '2008-08-14', 'MALE', 'Son of Stephen and Alice. High school basketball player.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_victor;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Winifred', 'Kemigisa', '2011-10-30', 'FEMALE', 'Stephen & Alice''s youngest daughter. Primary school pupil.', t1_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p1_winifred;

    -- G3 In-laws - Tree 1
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Kemigisa', 'Natukunda', '1998-04-20', 'FEMALE', 'Arthur''s wife. Clan: Bahinda. Village: Rukungiri. Occupation: Digital Marketer.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_kemigisa;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Ajok', 'Atim', '1998-07-10', 'FEMALE', 'Fred''s wife. Clan: Acholi. Village: Kitgum. Occupation: Interior Designer.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_ajok;

    -- G4 Great-grandchildren - Tree 1
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Kato', 'Wasswa', '2021-09-08', 'MALE', 'Arthur & Kemigisa''s eldest son. Energetic toddler.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_kato_g4;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Babirye', 'Nakato', '2023-11-23', 'FEMALE', 'Arthur & Kemigisa''s daughter. Cheerful baby girl.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_babirye_g4;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t1_id, 'Mugisha', 'Tumusiime', '2024-11-02', 'MALE', 'Fred & Ajok''s son. Born in Kampala.', t1_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p1_mugisha_g4;

    -- Link Family Head in users table
    UPDATE users SET person_id = p1_david WHERE id = t1_owner_id;

    -- Create Login Credentials (users) for Tree 1
    -- Only parents, grandparents, and representative credential holders (G3 children of deceased parents)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active) VALUES
    ('Sarah Namutebi', 'sarah.namutebi@gmail.com', pass_hash, r_member, p1_sarah, false, true),
    ('John Kato', 'john.kato@gmail.com', pass_hash, r_member, p1_john, false, true),
    ('Florence Naigaga', 'florence.naigaga@gmail.com', pass_hash, r_member, p1_florence, false, true),
    ('Mary Natukunda', 'mary.natukunda@gmail.com', pass_hash, r_member, p1_mary, false, true),
    ('Peter Tumusiime', 'peter.tumusiime@gmail.com', pass_hash, r_member, p1_peter, false, true),
    ('Harriet Nabakooza', 'harriet.nabakooza@gmail.com', pass_hash, r_member, p1_harriet, false, true),
    ('Charles Lwanga', 'charles.lwanga@gmail.com', pass_hash, r_member, p1_charles, false, true),
    ('Alice Nakato', 'alice.nakato@gmail.com', pass_hash, r_member, p1_alice, false, true),
    ('Patricia Lwanga', 'patricia.lwanga@gmail.com', pass_hash, r_member, p1_patricia, false, true),
    ('Simon Mwesigwa', 'simon.mwesigwa@gmail.com', pass_hash, r_member, p1_simon, false, true);

    -- =========================================================================
    -- RELATIONSHIPS - TREE 1
    -- =========================================================================

    -- Spouses
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_yosefu, p1_sarah, 'SPOUSE'), (p1_sarah, p1_yosefu, 'SPOUSE'),
    (p1_paulo, p1_resty, 'SPOUSE'), (p1_resty, p1_paulo, 'SPOUSE'),
    (p1_john, p1_florence, 'SPOUSE'), (p1_florence, p1_john, 'SPOUSE'),
    (p1_david, p1_mary, 'SPOUSE'), (p1_mary, p1_david, 'SPOUSE'),
    (p1_peter, p1_harriet, 'SPOUSE'), (p1_harriet, p1_peter, 'SPOUSE'),
    (p1_jane, p1_charles, 'SPOUSE'), (p1_charles, p1_jane, 'SPOUSE'),
    (p1_stephen, p1_alice, 'SPOUSE'), (p1_alice, p1_stephen, 'SPOUSE'),
    (p1_arthur, p1_kemigisa, 'SPOUSE'), (p1_kemigisa, p1_arthur, 'SPOUSE'),
    (p1_fred, p1_ajok, 'SPOUSE'), (p1_ajok, p1_fred, 'SPOUSE');

    -- Parents: Yosefu & Sarah -> children (John, David, Jane)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_yosefu, p1_john, 'PARENT'), (p1_john, p1_yosefu, 'CHILD'),
    (p1_yosefu, p1_david, 'PARENT'), (p1_david, p1_yosefu, 'CHILD'),
    (p1_yosefu, p1_jane, 'PARENT'), (p1_jane, p1_yosefu, 'CHILD'),
    (p1_sarah, p1_john, 'PARENT'), (p1_john, p1_sarah, 'CHILD'),
    (p1_sarah, p1_david, 'PARENT'), (p1_david, p1_sarah, 'CHILD'),
    (p1_sarah, p1_jane, 'PARENT'), (p1_jane, p1_sarah, 'CHILD');

    -- Parents: Paulo & Resty -> children (Mary, Peter, Stephen)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_paulo, p1_mary, 'PARENT'), (p1_mary, p1_paulo, 'CHILD'),
    (p1_paulo, p1_peter, 'PARENT'), (p1_peter, p1_paulo, 'CHILD'),
    (p1_paulo, p1_stephen, 'PARENT'), (p1_stephen, p1_paulo, 'CHILD'),
    (p1_resty, p1_mary, 'PARENT'), (p1_mary, p1_resty, 'CHILD'),
    (p1_resty, p1_peter, 'PARENT'), (p1_peter, p1_resty, 'CHILD'),
    (p1_resty, p1_stephen, 'PARENT'), (p1_stephen, p1_resty, 'CHILD');

    -- Parents: John & Florence -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_john, p1_arthur, 'PARENT'), (p1_arthur, p1_john, 'CHILD'),
    (p1_john, p1_brenda, 'PARENT'), (p1_brenda, p1_john, 'CHILD'),
    (p1_john, p1_caleb, 'PARENT'), (p1_caleb, p1_john, 'CHILD'),
    (p1_john, p1_diana, 'PARENT'), (p1_diana, p1_john, 'CHILD'),
    (p1_john, p1_edwin, 'PARENT'), (p1_edwin, p1_john, 'CHILD'),
    (p1_florence, p1_arthur, 'PARENT'), (p1_arthur, p1_florence, 'CHILD'),
    (p1_florence, p1_brenda, 'PARENT'), (p1_brenda, p1_florence, 'CHILD'),
    (p1_florence, p1_caleb, 'PARENT'), (p1_caleb, p1_florence, 'CHILD'),
    (p1_florence, p1_diana, 'PARENT'), (p1_diana, p1_florence, 'CHILD'),
    (p1_florence, p1_edwin, 'PARENT'), (p1_edwin, p1_florence, 'CHILD');

    -- Parents: David & Mary -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_david, p1_fred, 'PARENT'), (p1_fred, p1_david, 'CHILD'),
    (p1_david, p1_grace, 'PARENT'), (p1_grace, p1_david, 'CHILD'),
    (p1_david, p1_henry, 'PARENT'), (p1_henry, p1_david, 'CHILD'),
    (p1_david, p1_irene, 'PARENT'), (p1_irene, p1_david, 'CHILD'),
    (p1_david, p1_joel, 'PARENT'), (p1_joel, p1_david, 'CHILD'),
    (p1_david, p1_karen, 'PARENT'), (p1_karen, p1_david, 'CHILD'),
    (p1_mary, p1_fred, 'PARENT'), (p1_fred, p1_mary, 'CHILD'),
    (p1_mary, p1_grace, 'PARENT'), (p1_grace, p1_mary, 'CHILD'),
    (p1_mary, p1_henry, 'PARENT'), (p1_henry, p1_mary, 'CHILD'),
    (p1_mary, p1_irene, 'PARENT'), (p1_irene, p1_mary, 'CHILD'),
    (p1_mary, p1_joel, 'PARENT'), (p1_joel, p1_mary, 'CHILD'),
    (p1_mary, p1_karen, 'PARENT'), (p1_karen, p1_mary, 'CHILD');

    -- Parents: Peter & Harriet -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_peter, p1_liam, 'PARENT'), (p1_liam, p1_peter, 'CHILD'),
    (p1_peter, p1_martha, 'PARENT'), (p1_martha, p1_peter, 'CHILD'),
    (p1_peter, p1_nathan, 'PARENT'), (p1_nathan, p1_peter, 'CHILD'),
    (p1_peter, p1_olivia, 'PARENT'), (p1_olivia, p1_peter, 'CHILD'),
    (p1_harriet, p1_liam, 'PARENT'), (p1_liam, p1_harriet, 'CHILD'),
    (p1_harriet, p1_martha, 'PARENT'), (p1_martha, p1_harriet, 'CHILD'),
    (p1_harriet, p1_nathan, 'PARENT'), (p1_nathan, p1_harriet, 'CHILD'),
    (p1_harriet, p1_olivia, 'PARENT'), (p1_olivia, p1_harriet, 'CHILD');

    -- Parents: Jane & Charles -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_jane, p1_patricia, 'PARENT'), (p1_patricia, p1_jane, 'CHILD'),
    (p1_jane, p1_ronald, 'PARENT'), (p1_ronald, p1_jane, 'CHILD'),
    (p1_jane, p1_sandra, 'PARENT'), (p1_sandra, p1_jane, 'CHILD'),
    (p1_jane, p1_timothy, 'PARENT'), (p1_timothy, p1_jane, 'CHILD'),
    (p1_charles, p1_patricia, 'PARENT'), (p1_patricia, p1_charles, 'CHILD'),
    (p1_charles, p1_ronald, 'PARENT'), (p1_ronald, p1_charles, 'CHILD'),
    (p1_charles, p1_sandra, 'PARENT'), (p1_sandra, p1_charles, 'CHILD'),
    (p1_charles, p1_timothy, 'PARENT'), (p1_timothy, p1_charles, 'CHILD');

    -- Parents: Stephen & Alice -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_stephen, p1_simon, 'PARENT'), (p1_simon, p1_stephen, 'CHILD'),
    (p1_stephen, p1_tabitha, 'PARENT'), (p1_tabitha, p1_stephen, 'CHILD'),
    (p1_stephen, p1_victor, 'PARENT'), (p1_victor, p1_stephen, 'CHILD'),
    (p1_stephen, p1_winifred, 'PARENT'), (p1_winifred, p1_stephen, 'CHILD'),
    (p1_alice, p1_simon, 'PARENT'), (p1_simon, p1_alice, 'CHILD'),
    (p1_alice, p1_tabitha, 'PARENT'), (p1_tabitha, p1_alice, 'CHILD'),
    (p1_alice, p1_victor, 'PARENT'), (p1_victor, p1_alice, 'CHILD'),
    (p1_alice, p1_winifred, 'PARENT'), (p1_winifred, p1_alice, 'CHILD');

    -- Parents: Arthur & Kemigisa -> G4 Great-grandchildren
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_arthur, p1_kato_g4, 'PARENT'), (p1_kato_g4, p1_arthur, 'CHILD'),
    (p1_arthur, p1_babirye_g4, 'PARENT'), (p1_babirye_g4, p1_arthur, 'CHILD'),
    (p1_kemigisa, p1_kato_g4, 'PARENT'), (p1_kato_g4, p1_kemigisa, 'CHILD'),
    (p1_kemigisa, p1_babirye_g4, 'PARENT'), (p1_babirye_g4, p1_kemigisa, 'CHILD');

    -- Parents: Fred & Ajok -> G4 Great-grandchild
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_fred, p1_mugisha_g4, 'PARENT'), (p1_mugisha_g4, p1_fred, 'CHILD'),
    (p1_ajok, p1_mugisha_g4, 'PARENT'), (p1_mugisha_g4, p1_ajok, 'CHILD');

    -- Siblings: G2
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p1_john, p1_david, 'SIBLING'), (p1_david, p1_john, 'SIBLING'),
    (p1_john, p1_jane, 'SIBLING'), (p1_jane, p1_john, 'SIBLING'),
    (p1_david, p1_jane, 'SIBLING'), (p1_jane, p1_david, 'SIBLING'),
    
    (p1_mary, p1_peter, 'SIBLING'), (p1_peter, p1_mary, 'SIBLING'),
    (p1_mary, p1_stephen, 'SIBLING'), (p1_stephen, p1_mary, 'SIBLING'),
    (p1_peter, p1_stephen, 'SIBLING'), (p1_stephen, p1_peter, 'SIBLING');

    -- =========================================================================
    -- FAMILIES & FAMILY LINKS - TREE 1
    -- =========================================================================

    -- Families
    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Yosefu & Sarah Mukasa Family', t1_owner_id, true) RETURNING id INTO f1_primary;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Paulo & Resty Mwesigwa Family', t1_owner_id, false) RETURNING id INTO f1_maternal_gp;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('John & Florence Mukasa Family', t1_owner_id, false) RETURNING id INTO f1_john_florence;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('David & Mary Tumusiime Family', t1_owner_id, false) RETURNING id INTO f1_david_mary;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Peter & Harriet Tumusiime Family', t1_owner_id, false) RETURNING id INTO f1_peter_harriet;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Jane & Charles Lwanga Family', t1_owner_id, false) RETURNING id INTO f1_jane_charles;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Stephen & Alice Mwesigwa Family', t1_owner_id, false) RETURNING id INTO f1_stephen_alice;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Arthur & Kemigisa Wasswa Family', t1_owner_id, false) RETURNING id INTO f1_arthur_kemigisa;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Fred & Ajok Tumusiime Family', t1_owner_id, false) RETURNING id INTO f1_fred_ajok;

    -- Family Links
    INSERT INTO family_links (parent_family_id, child_family_id) VALUES
    (f1_primary, f1_john_florence),
    (f1_primary, f1_david_mary),
    (f1_primary, f1_jane_charles),
    (f1_maternal_gp, f1_david_mary),
    (f1_maternal_gp, f1_peter_harriet),
    (f1_maternal_gp, f1_stephen_alice),
    (f1_john_florence, f1_arthur_kemigisa),
    (f1_david_mary, f1_fred_ajok);

    -- Link members to Families (person_families)
    INSERT INTO person_families (person_id, family_id) VALUES
    -- Primary G1 family
    (p1_yosefu, f1_primary), (p1_sarah, f1_primary),
    (p1_john, f1_primary), (p1_david, f1_primary), (p1_jane, f1_primary),
    
    -- Maternal G1 family
    (p1_paulo, f1_maternal_gp), (p1_resty, f1_maternal_gp),
    (p1_mary, f1_maternal_gp), (p1_peter, f1_maternal_gp), (p1_stephen, f1_maternal_gp),
    
    -- G2 families & their children
    (p1_john, f1_john_florence), (p1_florence, f1_john_florence),
    (p1_arthur, f1_john_florence), (p1_brenda, f1_john_florence), (p1_caleb, f1_john_florence), (p1_diana, f1_john_florence), (p1_edwin, f1_john_florence),
    
    (p1_david, f1_david_mary), (p1_mary, f1_david_mary),
    (p1_fred, f1_david_mary), (p1_grace, f1_david_mary), (p1_henry, f1_david_mary), (p1_irene, f1_david_mary), (p1_joel, f1_david_mary), (p1_karen, f1_david_mary),
    
    (p1_peter, f1_peter_harriet), (p1_harriet, f1_peter_harriet),
    (p1_liam, f1_peter_harriet), (p1_martha, f1_peter_harriet), (p1_nathan, f1_peter_harriet), (p1_olivia, f1_peter_harriet),
    
    (p1_jane, f1_jane_charles), (p1_charles, f1_jane_charles),
    (p1_patricia, f1_jane_charles), (p1_ronald, f1_jane_charles), (p1_sandra, f1_jane_charles), (p1_timothy, f1_jane_charles),
    
    (p1_stephen, f1_stephen_alice), (p1_alice, f1_stephen_alice),
    (p1_simon, f1_stephen_alice), (p1_tabitha, f1_stephen_alice), (p1_victor, f1_stephen_alice), (p1_winifred, f1_stephen_alice),
    
    -- G3 families & G4 children
    (p1_arthur, f1_arthur_kemigisa), (p1_kemigisa, f1_arthur_kemigisa),
    (p1_kato_g4, f1_arthur_kemigisa), (p1_babirye_g4, f1_arthur_kemigisa),
    
    (p1_fred, f1_fred_ajok), (p1_ajok, f1_fred_ajok),
    (p1_mugisha_g4, f1_fred_ajok);


    -- =========================================================================
    -- marriages - TREE 1
    -- =========================================================================
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES
    (p1_yosefu, p1_sarah, '1962-04-18'),
    (p1_paulo, p1_resty, '1965-06-25'),
    (p1_john, p1_florence, '1992-12-19'),
    (p1_david, p1_mary, '1994-09-10'),
    (p1_peter, p1_harriet, '1998-11-28'),
    (p1_jane, p1_charles, '1996-05-15'),
    (p1_stephen, p1_alice, '2000-01-22'),
    (p1_arthur, p1_kemigisa, '2019-08-17'),
    (p1_fred, p1_ajok, '2022-10-15');


    -- =========================================================================
    -- TREE 2: OKELLO & ODOI FAMILY (42 MEMBERS)
    -- =========================================================================

    -- Create Family Head User for Tree 2
    INSERT INTO users (name, email, password_hash, role_id, is_temporary_password, is_active)
    VALUES ('Patrick Okello', 'patrickokello@gmail.com', Aksam@12345, r_head, false, true)
    RETURNING id INTO t2_owner_id;

    -- Create Family Tree 2
    INSERT INTO family_trees (name, owner_id, view)
    VALUES ('Okello & Odoi Family Tree', t2_owner_id, 'no')
    RETURNING id INTO t2_id;

    -- G1 (Grandparents) - Tree 2
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Jokene', 'Okello', '1934-03-11', '2008-11-14', 'MALE', 'Clan: Acholi. Village: Awach. District: Gulu. Occupation: Farmer. Loved community storytelling.', '+256701100111', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_jokene;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Grace', 'Akech', '1941-07-25', 'FEMALE', 'Clan: Acholi. Village: Awach. District: Gulu. Occupation: Midwife. Delivered hundreds of babies in Gulu.', '+256701100222', 'grace.akech@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_grace_ak;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Christopher', 'Odoi', '1937-08-14', '2012-05-30', 'MALE', 'Clan: Jok. Village: Rubongi. District: Tororo. Occupation: Chief inspector of police. Disciplined and fair.', '+256701100333', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_christopher;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Hellen', 'Akello', '1943-12-02', '2018-07-19', 'FEMALE', 'Clan: Jok. Village: Rubongi. District: Tororo. Occupation: Dressmaker. Very creative with traditional garments.', '+256701100444', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_hellen;

    -- G2 (Parents) - Tree 2
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Patrick', 'Okello', '1969-09-18', 'MALE', 'Clan: Acholi. Village: Awach. District: Gulu. Occupation: Principal of Gulu High School. Family Head.', '+256701200111', 'patrick.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_patrick;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Beatrice', 'Odoi', '1973-10-15', 'FEMALE', 'Clan: Jok. Village: Rubongi. District: Tororo. Occupation: Lecturer at Gulu University. Academic mentor.', '+256701200222', 'beatrice.odoi@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_beatrice;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Moses', 'Odoi', '1971-11-04', 'MALE', 'Clan: Jok. Village: Rubongi. District: Tororo. Occupation: Senior Civil Servant. Avid reader.', '+256701200333', 'moses.odoi@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_moses;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Margaret', 'Asege', '1976-02-28', 'FEMALE', 'Clan: Iteso. Village: Kumi. District: Kumi. Occupation: Pharmacist in Soroti. Loving aunt.', '+256701200444', 'margaret.asege@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_margaret;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Richard', 'Okello', '1972-06-12', '2019-10-05', 'MALE', 'Clan: Acholi. Village: Awach. District: Gulu. Occupation: Commercial Banker. Passionate about micro-finance.', '+256701200555', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_richard;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Sarah', 'Akiror', '1977-12-14', 'FEMALE', 'Clan: Iteso. Village: Soroti. District: Soroti. Occupation: Secondary School Teacher. Loves music.', '+256701200666', 'sarah.akiror@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_sarah_ap;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Florence', 'Okello', '1975-04-30', 'FEMALE', 'Clan: Acholi. Village: Awach. District: Gulu. Occupation: Social Worker. Supports rural women cooperatives.', '+256701200777', 'florence.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_florence_ok;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'James', 'Gasana', '1970-08-22', 'MALE', 'Clan: Banyarwanda. Village: Kisoro. District: Kisoro. Occupation: Veterinary Surgeon. Loves wildlife.', '+256701200888', 'james.gasana@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_james;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, death_date, gender, bio, phone_number, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Elizabeth', 'Odoi', '1978-05-14', '2020-04-20', 'FEMALE', 'Clan: Jok. Village: Rubongi. District: Tororo. Occupation: Senior Auditor. Deeply missed by her family.', '+256701200999', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_elizabeth;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'William', 'Byamugisha', '1974-03-09', 'MALE', 'Clan: Bakiga. Village: Kabale. District: Kabale. Occupation: Political Journalist. Passionate about current affairs.', '+256701200100', 'william.byamugisha@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_william;

    -- G3 (Children) - Tree 2
    -- Patrick & Beatrice's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Denis', 'Okello', '1994-04-12', 'MALE', 'Patrick and Beatrice''s eldest son. Mechanical engineer. Loves football.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_denis;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Evelyn', 'Okello', '1996-06-28', 'FEMALE', 'Daughter of Patrick and Beatrice. Special education teacher.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_evelyn;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Fiona', 'Okello', '1998-09-05', 'FEMALE', 'Daughter of Patrick and Beatrice. Graphic designer.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_fiona;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'George', 'Okello', '2001-12-14', 'MALE', 'Son of Patrick and Beatrice. Medical student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_george;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Hope', 'Okello', '2004-10-02', 'FEMALE', 'Patrick & Beatrice''s youngest daughter. Environmental scientist.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_hope;

    -- Moses & Margaret's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ian', 'Odoi', '1997-03-24', 'MALE', 'Moses & Margaret''s eldest son. Electrical engineer in Soroti.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_ian;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Julia', 'Odoi', '1999-07-15', 'FEMALE', 'Daughter of Moses and Margaret. Software tester.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_julia;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Kevin', 'Odoi', '2002-11-22', 'MALE', 'Son of Moses and Margaret. Business student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_kevin;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Lucy', 'Odoi', '2005-02-18', 'FEMALE', 'Daughter of Moses and Margaret. Literature student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_lucy;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Mark', 'Odoi', '2008-05-30', 'MALE', 'Moses & Margaret''s youngest son. High school student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_mark;

    -- Richard & Sarah's children
    -- Nancy Okello is the representative credential holder for deceased father Richard Okello
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Nancy', 'Okello', '1998-02-12', 'FEMALE', 'Richard and Sarah''s eldest daughter. Representative credential holder for her deceased father, Richard. Commercial Analyst.', '+256701300111', 'nancy.okello@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_nancy;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Peter', 'Okello', '2000-05-05', 'MALE', 'Son of Richard and Sarah. Mechanical engineer.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_peter_ok;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Quinto', 'Okello', '2003-08-19', 'MALE', 'Son of Richard and Sarah. University student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_quinto;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Rebecca', 'Okello', '2006-11-26', 'FEMALE', 'Daughter of Richard and Sarah. High school student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_rebecca;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Samuel', 'Okello', '2009-12-14', 'MALE', 'Richard & Sarah''s youngest son. High school student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_samuel;

    -- Florence & James's children
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Thomas', 'Gasana', '2000-01-28', 'MALE', 'Son of Florence and James. Agronomist in Kisoro.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_thomas;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ursula', 'Gasana', '2002-09-30', 'FEMALE', 'Daughter of Florence and James. Hotel manager.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_ursula;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Val', 'Gasana', '2005-04-14', 'FEMALE', 'Daughter of Florence and James. Tourism student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_val;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Walter', 'Gasana', '2008-07-22', 'MALE', 'Florence & James''s youngest son. Secondary student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_walter;

    -- Elizabeth & William's children
    -- Xavier Byamugisha is the representative credential holder for deceased mother Elizabeth Odoi
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, phone_number, email, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Xavier', 'Byamugisha', '2002-06-18', 'MALE', 'Elizabeth and William''s eldest son. Representative credential holder for his deceased mother, Elizabeth. Civil engineering student.', '+256701300222', 'xavier.byamugisha@gmail.com', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_xavier;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Yvonne', 'Byamugisha', '2005-08-30', 'FEMALE', 'Daughter of Elizabeth and William. Journalism student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_yvonne;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Zachary', 'Byamugisha', '2008-11-25', 'MALE', 'Son of Elizabeth and William. Secondary student.', t2_owner_id, 'SELF_AND_ADMIN') RETURNING id INTO p2_zachary;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Angela', 'Byamugisha', '2011-12-14', 'FEMALE', 'Elizabeth & William''s youngest daughter. Primary student.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_angela;

    -- G3 In-laws - Tree 2
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Naigaga', 'Nantongo', '1996-06-28', 'FEMALE', 'Denis''s wife. Clan: Ffumbe. Village: Jinja. Occupation: Public Relations Officer.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_naigaga;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Atim', 'Akello', '1999-07-15', 'FEMALE', 'Ian''s wife. Clan: Acholi. Village: Kitgum. Occupation: Research Assistant.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_atim;

    -- G4 Great-grandchildren - Tree 2
    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ocen', 'Okello', '2020-12-14', 'MALE', 'Denis & Naigaga''s son. Born in Kampala.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_ocen_g4;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Ajok', 'Akello', '2022-10-02', 'FEMALE', 'Denis & Naigaga''s daughter. Toddler.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_ajok_g4;

    INSERT INTO persons (tree_id, first_name, last_name, birth_date, gender, bio, created_by_user_id, modify_permission)
    VALUES (t2_id, 'Odoi', 'Odoi', '2024-05-30', 'MALE', 'Ian & Atim''s son. Infant.', t2_owner_id, 'SELF_AND_ADMIN')
    RETURNING id INTO p2_odoi_g4;

    -- Link Family Head in users table
    UPDATE users SET person_id = p2_patrick WHERE id = t2_owner_id;

    -- Create Login Credentials (users) for Tree 2
    -- Only parents, grandparents, and representative credential holders (G3 children of deceased parents)
    INSERT INTO users (name, email, password_hash, role_id, person_id, is_temporary_password, is_active) VALUES
    ('Grace Akech', 'grace.akech@gmail.com', pass_hash, r_member, p2_grace_ak, false, true),
    ('Beatrice Odoi', 'beatrice.odoi@gmail.com', pass_hash, r_member, p2_beatrice, false, true),
    ('Moses Odoi', 'moses.odoi@gmail.com', pass_hash, r_member, p2_moses, false, true),
    ('Margaret Asege', 'margaret.asege@gmail.com', pass_hash, r_member, p2_margaret, false, true),
    ('Sarah Akiror', 'sarah.akiror@gmail.com', pass_hash, r_member, p2_sarah_ap, false, true),
    ('Florence Okello', 'florence.okello@gmail.com', pass_hash, r_member, p2_florence_ok, false, true),
    ('James Gasana', 'james.gasana@gmail.com', pass_hash, r_member, p2_james, false, true),
    ('William Byamugisha', 'william.byamugisha@gmail.com', pass_hash, r_member, p2_william, false, true),
    ('Nancy Okello', 'nancy.okello@gmail.com', pass_hash, r_member, p2_nancy, false, true),
    ('Xavier Byamugisha', 'xavier.byamugisha@gmail.com', pass_hash, r_member, p2_xavier, false, true);

    -- =========================================================================
    -- RELATIONSHIPS - TREE 2
    -- =========================================================================

    -- Spouses
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_jokene, p2_grace_ak, 'SPOUSE'), (p2_grace_ak, p2_jokene, 'SPOUSE'),
    (p2_christopher, p2_hellen, 'SPOUSE'), (p2_hellen, p2_christopher, 'SPOUSE'),
    (p2_patrick, p2_beatrice, 'SPOUSE'), (p2_beatrice, p2_patrick, 'SPOUSE'),
    (p2_moses, p2_margaret, 'SPOUSE'), (p2_margaret, p2_moses, 'SPOUSE'),
    (p2_richard, p2_sarah_ap, 'SPOUSE'), (p2_sarah_ap, p2_richard, 'SPOUSE'),
    (p2_florence_ok, p2_james, 'SPOUSE'), (p2_james, p2_florence_ok, 'SPOUSE'),
    (p2_elizabeth, p2_william, 'SPOUSE'), (p2_william, p2_elizabeth, 'SPOUSE'),
    (p2_denis, p2_naigaga, 'SPOUSE'), (p2_naigaga, p2_denis, 'SPOUSE'),
    (p2_ian, p2_atim, 'SPOUSE'), (p2_atim, p2_ian, 'SPOUSE');

    -- Parents: Jokene & Grace -> children (Patrick, Richard, Florence)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_jokene, p2_patrick, 'PARENT'), (p2_patrick, p2_jokene, 'CHILD'),
    (p2_jokene, p2_richard, 'PARENT'), (p2_richard, p2_jokene, 'CHILD'),
    (p2_jokene, p2_florence_ok, 'PARENT'), (p2_florence_ok, p2_jokene, 'CHILD'),
    (p2_grace_ak, p2_patrick, 'PARENT'), (p2_patrick, p2_grace_ak, 'CHILD'),
    (p2_grace_ak, p2_richard, 'PARENT'), (p2_richard, p2_grace_ak, 'CHILD'),
    (p2_grace_ak, p2_florence_ok, 'PARENT'), (p2_florence_ok, p2_grace_ak, 'CHILD');

    -- Parents: Christopher & Hellen -> children (Beatrice, Moses, Elizabeth)
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_christopher, p2_beatrice, 'PARENT'), (p2_beatrice, p2_christopher, 'CHILD'),
    (p2_christopher, p2_moses, 'PARENT'), (p2_moses, p2_christopher, 'CHILD'),
    (p2_christopher, p2_elizabeth, 'PARENT'), (p2_elizabeth, p2_christopher, 'CHILD'),
    (p2_hellen, p2_beatrice, 'PARENT'), (p2_beatrice, p2_hellen, 'CHILD'),
    (p2_hellen, p2_moses, 'PARENT'), (p2_moses, p2_hellen, 'CHILD'),
    (p2_hellen, p2_elizabeth, 'PARENT'), (p2_elizabeth, p2_hellen, 'CHILD');

    -- Parents: Patrick & Beatrice -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_patrick, p2_denis, 'PARENT'), (p2_denis, p2_patrick, 'CHILD'),
    (p2_patrick, p2_evelyn, 'PARENT'), (p2_evelyn, p2_patrick, 'CHILD'),
    (p2_patrick, p2_fiona, 'PARENT'), (p2_fiona, p2_patrick, 'CHILD'),
    (p2_patrick, p2_george, 'PARENT'), (p2_george, p2_patrick, 'CHILD'),
    (p2_patrick, p2_hope, 'PARENT'), (p2_hope, p2_patrick, 'CHILD'),
    (p2_beatrice, p2_denis, 'PARENT'), (p2_denis, p2_beatrice, 'CHILD'),
    (p2_beatrice, p2_evelyn, 'PARENT'), (p2_evelyn, p2_beatrice, 'CHILD'),
    (p2_beatrice, p2_fiona, 'PARENT'), (p2_fiona, p2_beatrice, 'CHILD'),
    (p2_beatrice, p2_george, 'PARENT'), (p2_george, p2_beatrice, 'CHILD'),
    (p2_beatrice, p2_hope, 'PARENT'), (p2_hope, p2_beatrice, 'CHILD');

    -- Parents: Moses & Margaret -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_moses, p2_ian, 'PARENT'), (p2_ian, p2_moses, 'CHILD'),
    (p2_moses, p2_julia, 'PARENT'), (p2_julia, p2_moses, 'CHILD'),
    (p2_moses, p2_kevin, 'PARENT'), (p2_kevin, p2_moses, 'CHILD'),
    (p2_moses, p2_lucy, 'PARENT'), (p2_lucy, p2_moses, 'CHILD'),
    (p2_moses, p2_mark, 'PARENT'), (p2_mark, p2_moses, 'CHILD'),
    (p2_margaret, p2_ian, 'PARENT'), (p2_ian, p2_margaret, 'CHILD'),
    (p2_margaret, p2_julia, 'PARENT'), (p2_julia, p2_margaret, 'CHILD'),
    (p2_margaret, p2_kevin, 'PARENT'), (p2_kevin, p2_margaret, 'CHILD'),
    (p2_margaret, p2_lucy, 'PARENT'), (p2_lucy, p2_margaret, 'CHILD'),
    (p2_margaret, p2_mark, 'PARENT'), (p2_mark, p2_margaret, 'CHILD');

    -- Parents: Richard & Sarah -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_richard, p2_nancy, 'PARENT'), (p2_nancy, p2_richard, 'CHILD'),
    (p2_richard, p2_peter_ok, 'PARENT'), (p2_peter_ok, p2_richard, 'CHILD'),
    (p2_richard, p2_quinto, 'PARENT'), (p2_quinto, p2_richard, 'CHILD'),
    (p2_richard, p2_rebecca, 'PARENT'), (p2_rebecca, p2_richard, 'CHILD'),
    (p2_richard, p2_samuel, 'PARENT'), (p2_samuel, p2_richard, 'CHILD'),
    (p2_sarah_ap, p2_nancy, 'PARENT'), (p2_nancy, p2_sarah_ap, 'CHILD'),
    (p2_sarah_ap, p2_peter_ok, 'PARENT'), (p2_peter_ok, p2_sarah_ap, 'CHILD'),
    (p2_sarah_ap, p2_quinto, 'PARENT'), (p2_quinto, p2_sarah_ap, 'CHILD'),
    (p2_sarah_ap, p2_rebecca, 'PARENT'), (p2_rebecca, p2_sarah_ap, 'CHILD'),
    (p2_sarah_ap, p2_samuel, 'PARENT'), (p2_samuel, p2_sarah_ap, 'CHILD');

    -- Parents: Florence & James -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_florence_ok, p2_thomas, 'PARENT'), (p2_thomas, p2_florence_ok, 'CHILD'),
    (p2_florence_ok, p2_ursula, 'PARENT'), (p2_ursula, p2_florence_ok, 'CHILD'),
    (p2_florence_ok, p2_val, 'PARENT'), (p2_val, p2_florence_ok, 'CHILD'),
    (p2_florence_ok, p2_walter, 'PARENT'), (p2_walter, p2_florence_ok, 'CHILD'),
    (p2_james, p2_thomas, 'PARENT'), (p2_thomas, p2_james, 'CHILD'),
    (p2_james, p2_ursula, 'PARENT'), (p2_ursula, p2_james, 'CHILD'),
    (p2_james, p2_val, 'PARENT'), (p2_val, p2_james, 'CHILD'),
    (p2_james, p2_walter, 'PARENT'), (p2_walter, p2_james, 'CHILD');

    -- Parents: Elizabeth & William -> G3 Children
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_elizabeth, p2_xavier, 'PARENT'), (p2_xavier, p2_elizabeth, 'CHILD'),
    (p2_elizabeth, p2_yvonne, 'PARENT'), (p2_yvonne, p2_elizabeth, 'CHILD'),
    (p2_elizabeth, p2_zachary, 'PARENT'), (p2_zachary, p2_elizabeth, 'CHILD'),
    (p2_elizabeth, p2_angela, 'PARENT'), (p2_angela, p2_elizabeth, 'CHILD'),
    (p2_william, p2_xavier, 'PARENT'), (p2_xavier, p2_william, 'CHILD'),
    (p2_william, p2_yvonne, 'PARENT'), (p2_yvonne, p2_william, 'CHILD'),
    (p2_william, p2_zachary, 'PARENT'), (p2_zachary, p2_william, 'CHILD'),
    (p2_william, p2_angela, 'PARENT'), (p2_angela, p2_william, 'CHILD');

    -- Parents: Denis & Naigaga -> G4 Great-grandchildren
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_denis, p2_ocen_g4, 'PARENT'), (p2_ocen_g4, p2_denis, 'CHILD'),
    (p2_denis, p2_ajok_g4, 'PARENT'), (p2_ajok_g4, p2_denis, 'CHILD'),
    (p2_naigaga, p2_ocen_g4, 'PARENT'), (p2_ocen_g4, p2_naigaga, 'CHILD'),
    (p2_naigaga, p2_ajok_g4, 'PARENT'), (p2_ajok_g4, p2_naigaga, 'CHILD');

    -- Parents: Ian & Atim -> G4 Great-grandchild
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_ian, p2_odoi_g4, 'PARENT'), (p2_odoi_g4, p2_ian, 'CHILD'),
    (p2_atim, p2_odoi_g4, 'PARENT'), (p2_odoi_g4, p2_atim, 'CHILD');

    -- Siblings: G2
    INSERT INTO relationships (person_id, related_person_id, type) VALUES
    (p2_patrick, p2_richard, 'SIBLING'), (p2_richard, p2_patrick, 'SIBLING'),
    (p2_patrick, p2_florence_ok, 'SIBLING'), (p2_florence_ok, p2_patrick, 'SIBLING'),
    (p2_richard, p2_florence_ok, 'SIBLING'), (p2_florence_ok, p2_richard, 'SIBLING'),
    
    (p2_beatrice, p2_moses, 'SIBLING'), (p2_moses, p2_beatrice, 'SIBLING'),
    (p2_beatrice, p2_elizabeth, 'SIBLING'), (p2_elizabeth, p2_beatrice, 'SIBLING'),
    (p2_moses, p2_elizabeth, 'SIBLING'), (p2_elizabeth, p2_moses, 'SIBLING');

    -- =========================================================================
    -- FAMILIES & FAMILY LINKS - TREE 2
    -- =========================================================================

    -- Families
    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Jokene & Grace Okello Family', t2_owner_id, true) RETURNING id INTO f2_primary;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Christopher & Hellen Odoi Family', t2_owner_id, false) RETURNING id INTO f2_maternal_gp;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Patrick & Beatrice Okello Family', t2_owner_id, false) RETURNING id INTO f2_patrick_beatrice;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Moses & Margaret Odoi Family', t2_owner_id, false) RETURNING id INTO f2_moses_margaret;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Richard & Sarah Okello Family', t2_owner_id, false) RETURNING id INTO f2_richard_sarah;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Florence & James Gasana Family', t2_owner_id, false) RETURNING id INTO f2_florence_james;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Elizabeth & William Byamugisha Family', t2_owner_id, false) RETURNING id INTO f2_elizabeth_william;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Denis & Naigaga Okello Family', t2_owner_id, false) RETURNING id INTO f2_denis_naigaga;

    INSERT INTO families (name, owner_id, is_primary)
    VALUES ('Ian & Atim Odoi Family', t2_owner_id, false) RETURNING id INTO f2_ian_atim;

    -- Family Links
    INSERT INTO family_links (parent_family_id, child_family_id) VALUES
    (f2_primary, f2_patrick_beatrice),
    (f2_primary, f2_richard_sarah),
    (f2_primary, f2_florence_james),
    (f2_maternal_gp, f2_patrick_beatrice),
    (f2_maternal_gp, f2_moses_margaret),
    (f2_maternal_gp, f2_elizabeth_william),
    (f2_patrick_beatrice, f2_denis_naigaga),
    (f2_moses_margaret, f2_ian_atim);

    -- Link members to Families (person_families)
    INSERT INTO person_families (person_id, family_id) VALUES
    -- Primary G1 family
    (p2_jokene, f2_primary), (p2_grace_ak, f2_primary),
    (p2_patrick, f2_primary), (p2_richard, f2_primary), (p2_florence_ok, f2_primary),
    
    -- Maternal G1 family
    (p2_christopher, f2_maternal_gp), (p2_hellen, f2_maternal_gp),
    (p2_beatrice, f2_maternal_gp), (p2_moses, f2_maternal_gp), (p2_elizabeth, f2_maternal_gp),
    
    -- G2 families & their children
    (p2_patrick, f2_patrick_beatrice), (p2_beatrice, f2_patrick_beatrice),
    (p2_denis, f2_patrick_beatrice), (p2_evelyn, f2_patrick_beatrice), (p2_fiona, f2_patrick_beatrice), (p2_george, f2_patrick_beatrice), (p2_hope, f2_patrick_beatrice),
    
    (p2_moses, f2_moses_margaret), (p2_margaret, f2_moses_margaret),
    (p2_ian, f2_moses_margaret), (p2_julia, f2_moses_margaret), (p2_kevin, f2_moses_margaret), (p2_lucy, f2_moses_margaret), (p2_mark, f2_moses_margaret),
    
    (p2_richard, f2_richard_sarah), (p2_sarah_ap, f2_richard_sarah),
    (p2_nancy, f2_richard_sarah), (p2_peter_ok, f2_richard_sarah), (p2_quinto, f2_richard_sarah), (p2_rebecca, f2_richard_sarah), (p2_samuel, f2_richard_sarah),
    
    (p2_florence_ok, f2_florence_james), (p2_james, f2_florence_james),
    (p2_thomas, f2_florence_james), (p2_ursula, f2_florence_james), (p2_val, f2_florence_james), (p2_walter, f2_florence_james),
    
    (p2_elizabeth, f2_elizabeth_william), (p2_william, f2_elizabeth_william),
    (p2_xavier, f2_elizabeth_william), (p2_yvonne, f2_elizabeth_william), (p2_zachary, f2_elizabeth_william), (p2_angela, f2_elizabeth_william),
    
    -- G3 families & G4 children
    (p2_denis, f2_denis_naigaga), (p2_naigaga, f2_denis_naigaga),
    (p2_ocen_g4, f2_denis_naigaga), (p2_ajok_g4, f2_denis_naigaga),
    
    (p2_ian, f2_ian_atim), (p2_atim, f2_ian_atim),
    (p2_odoi_g4, f2_ian_atim);


    -- =========================================================================
    -- marriages - TREE 2
    -- =========================================================================
    INSERT INTO marriages (person1_id, person2_id, marriage_date) VALUES
    (p2_jokene, p2_grace_ak, '1961-05-10'),
    (p2_christopher, p2_hellen, '1964-08-15'),
    (p2_patrick, p2_beatrice, '1993-06-19'),
    (p2_moses, p2_margaret, '1995-10-12'),
    (p2_richard, p2_sarah_ap, '1997-04-18'),
    (p2_florence_ok, p2_james, '1998-11-28'),
    (p2_elizabeth, p2_william, '2000-07-22'),
    (p2_denis, p2_naigaga, '2018-09-08'),
    (p2_ian, p2_atim, '2022-04-23');

END $$;

COMMIT;
