DO $$
DECLARE
  v_mateusz_id TEXT;
  v_monika_id  TEXT;
  v_household_id TEXT;
  v_mruczek_id TEXT;
  v_felinka_id TEXT;
BEGIN

  -- Users
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'mateusz@petcare.pl') THEN
    v_mateusz_id := gen_random_uuid()::text;
    INSERT INTO "User" (id, email, name, "passwordHash", "createdAt")
    VALUES (v_mateusz_id, 'mateusz@petcare.pl', 'Mateusz',
      '$2b$12$BvWWnYnlaAePjXHOXHTm.uVbdJyRwogm.v72.NBw8e5pOjnpVw7H2', NOW());
  ELSE
    SELECT id INTO v_mateusz_id FROM "User" WHERE email = 'mateusz@petcare.pl';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'monika@petcare.pl') THEN
    v_monika_id := gen_random_uuid()::text;
    INSERT INTO "User" (id, email, name, "passwordHash", "createdAt")
    VALUES (v_monika_id, 'monika@petcare.pl', 'Monika',
      '$2b$12$9vaObgOltN9mdSdM4DUtuuf8.NCFfmZF/u2E3Ckdk9Ko4aZUXmV3K', NOW());
  ELSE
    SELECT id INTO v_monika_id FROM "User" WHERE email = 'monika@petcare.pl';
  END IF;

  -- Household
  IF NOT EXISTS (SELECT 1 FROM "HouseholdMember" WHERE "userId" = v_mateusz_id) THEN
    v_household_id := gen_random_uuid()::text;
    INSERT INTO "Household" (id, name, "createdAt")
    VALUES (v_household_id, 'Dom', NOW());

    INSERT INTO "HouseholdMember" (id, "householdId", "userId", role, "joinedAt")
    VALUES (gen_random_uuid()::text, v_household_id, v_mateusz_id, 'OWNER', NOW());

    INSERT INTO "HouseholdMember" (id, "householdId", "userId", role, "joinedAt")
    VALUES (gen_random_uuid()::text, v_household_id, v_monika_id, 'MEMBER', NOW());
  ELSE
    SELECT "householdId" INTO v_household_id FROM "HouseholdMember" WHERE "userId" = v_mateusz_id LIMIT 1;
  END IF;

  -- Pets
  IF NOT EXISTS (SELECT 1 FROM "Pet" WHERE name = 'Mruczek' AND "householdId" = v_household_id) THEN
    v_mruczek_id := gen_random_uuid()::text;
    INSERT INTO "Pet" (id, "householdId", name, species, sex, neutered, "weightGoalKg", "createdAt")
    VALUES (v_mruczek_id, v_household_id, 'Mruczek', 'CAT', 'MALE', true, 4.5, NOW());
  ELSE
    SELECT id INTO v_mruczek_id FROM "Pet" WHERE name = 'Mruczek' AND "householdId" = v_household_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Pet" WHERE name = 'Felinka' AND "householdId" = v_household_id) THEN
    v_felinka_id := gen_random_uuid()::text;
    INSERT INTO "Pet" (id, "householdId", name, species, sex, neutered, "weightGoalKg", "createdAt")
    VALUES (v_felinka_id, v_household_id, 'Felinka', 'CAT', 'FEMALE', true, 3.5, NOW());
  ELSE
    SELECT id INTO v_felinka_id FROM "Pet" WHERE name = 'Felinka' AND "householdId" = v_household_id;
  END IF;

  -- Mruczek weights
  IF NOT EXISTS (SELECT 1 FROM "WeightLog" WHERE "petId" = v_mruczek_id) THEN
    INSERT INTO "WeightLog" (id, "petId", "weightKg", "loggedAt") VALUES
      (gen_random_uuid()::text, v_mruczek_id, 4.380, TIMESTAMPTZ '2025-09-10 17:44:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.600, TIMESTAMPTZ '2025-04-22 22:48:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.400, TIMESTAMPTZ '2025-01-14 09:19:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 5.000, TIMESTAMPTZ '2024-09-25 19:03:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.800, TIMESTAMPTZ '2024-05-20 15:17:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.810, TIMESTAMPTZ '2023-09-21 19:31:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.560, TIMESTAMPTZ '2023-07-26 06:17:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 5.100, TIMESTAMPTZ '2022-12-25 12:45:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 5.030, TIMESTAMPTZ '2022-12-03 10:56:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 5.450, TIMESTAMPTZ '2022-05-17 17:18:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.890, TIMESTAMPTZ '2022-01-16 16:01:00+00'),
      (gen_random_uuid()::text, v_mruczek_id, 4.600, TIMESTAMPTZ '2022-01-02 11:45:00+00');
  END IF;

  -- Felinka weights
  IF NOT EXISTS (SELECT 1 FROM "WeightLog" WHERE "petId" = v_felinka_id) THEN
    INSERT INTO "WeightLog" (id, "petId", "weightKg", "loggedAt") VALUES
      (gen_random_uuid()::text, v_felinka_id, 3.800, TIMESTAMPTZ '2018-01-17 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.400, TIMESTAMPTZ '2018-02-17 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.600, TIMESTAMPTZ '2018-04-26 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.700, TIMESTAMPTZ '2020-03-25 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.810, TIMESTAMPTZ '2020-07-16 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.920, TIMESTAMPTZ '2020-07-26 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 4.040, TIMESTAMPTZ '2020-08-02 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.960, TIMESTAMPTZ '2020-08-23 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.500, TIMESTAMPTZ '2020-12-28 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.430, TIMESTAMPTZ '2021-01-06 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.400, TIMESTAMPTZ '2021-01-27 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.240, TIMESTAMPTZ '2021-02-19 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.230, TIMESTAMPTZ '2021-04-01 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.270, TIMESTAMPTZ '2021-04-22 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.400, TIMESTAMPTZ '2021-06-01 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.430, TIMESTAMPTZ '2021-06-25 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.390, TIMESTAMPTZ '2021-06-27 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.550, TIMESTAMPTZ '2021-07-08 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.680, TIMESTAMPTZ '2021-07-30 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.800, TIMESTAMPTZ '2021-08-22 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.100, TIMESTAMPTZ '2021-11-12 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.270, TIMESTAMPTZ '2021-11-27 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.480, TIMESTAMPTZ '2022-06-14 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.650, TIMESTAMPTZ '2022-07-25 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.320, TIMESTAMPTZ '2022-09-29 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.280, TIMESTAMPTZ '2022-11-26 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.300, TIMESTAMPTZ '2023-01-08 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.090, TIMESTAMPTZ '2023-01-17 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.290, TIMESTAMPTZ '2023-02-10 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 2.870, TIMESTAMPTZ '2023-03-16 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 2.900, TIMESTAMPTZ '2023-04-05 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.140, TIMESTAMPTZ '2023-06-05 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.190, TIMESTAMPTZ '2023-06-14 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.330, TIMESTAMPTZ '2024-07-11 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 3.000, TIMESTAMPTZ '2025-02-19 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 2.960, TIMESTAMPTZ '2025-09-17 12:00:00+00'),
      (gen_random_uuid()::text, v_felinka_id, 2.980, TIMESTAMPTZ '2025-11-18 12:00:00+00');
  END IF;

END $$;
