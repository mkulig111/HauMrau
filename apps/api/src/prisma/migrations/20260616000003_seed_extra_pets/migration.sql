DO $$
DECLARE
  v_household_id TEXT;
  v_gizmo_id     TEXT;
  v_burek_id     TEXT;
  v_luna_id      TEXT;
BEGIN

  -- Fix Monika's password hash
  UPDATE "User"
  SET "passwordHash" = '$2b$12$Ie.JHfIc0HqLsNgvY5Ove.RNgjuyAwK3DazgkzQtuGYxJcVaQs9GW'
  WHERE email = 'monika@petcare.pl';

  -- Get household
  SELECT hm."householdId" INTO v_household_id
  FROM "HouseholdMember" hm
  JOIN "User" u ON u.id = hm."userId"
  WHERE u.email = 'mateusz@petcare.pl'
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN;
  END IF;

  -- Gizmo — rudy kot, samiec
  IF NOT EXISTS (SELECT 1 FROM "Pet" WHERE name = 'Gizmo' AND "householdId" = v_household_id) THEN
    v_gizmo_id := gen_random_uuid()::text;
    INSERT INTO "Pet" (id, "householdId", name, species, breed, sex, neutered, "weightGoalKg", "birthDate", "createdAt")
    VALUES (v_gizmo_id, v_household_id, 'Gizmo', 'CAT', 'Maine Coon', 'MALE', true, 5.5,
            TIMESTAMPTZ '2019-03-12 00:00:00+00', NOW());

    INSERT INTO "WeightLog" (id, "petId", "weightKg", "loggedAt") VALUES
      (gen_random_uuid()::text, v_gizmo_id, 4.200, TIMESTAMPTZ '2022-01-10 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 4.450, TIMESTAMPTZ '2022-04-15 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 4.700, TIMESTAMPTZ '2022-08-20 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.100, TIMESTAMPTZ '2023-01-05 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.300, TIMESTAMPTZ '2023-06-18 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.480, TIMESTAMPTZ '2023-11-22 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.600, TIMESTAMPTZ '2024-03-14 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.550, TIMESTAMPTZ '2024-08-30 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.400, TIMESTAMPTZ '2025-01-20 10:00:00+00'),
      (gen_random_uuid()::text, v_gizmo_id, 5.250, TIMESTAMPTZ '2025-06-10 10:00:00+00');
  END IF;

  -- Burek — pies, mieszaniec
  IF NOT EXISTS (SELECT 1 FROM "Pet" WHERE name = 'Burek' AND "householdId" = v_household_id) THEN
    v_burek_id := gen_random_uuid()::text;
    INSERT INTO "Pet" (id, "householdId", name, species, breed, sex, neutered, "weightGoalKg", "birthDate", "createdAt")
    VALUES (v_burek_id, v_household_id, 'Burek', 'DOG', 'Mieszaniec', 'MALE', true, 14.0,
            TIMESTAMPTZ '2018-07-04 00:00:00+00', NOW());

    INSERT INTO "WeightLog" (id, "petId", "weightKg", "loggedAt") VALUES
      (gen_random_uuid()::text, v_burek_id, 11.200, TIMESTAMPTZ '2020-05-01 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 12.500, TIMESTAMPTZ '2020-11-15 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 13.100, TIMESTAMPTZ '2021-04-22 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 13.800, TIMESTAMPTZ '2021-10-08 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 14.200, TIMESTAMPTZ '2022-03-30 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 15.100, TIMESTAMPTZ '2022-09-12 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 15.600, TIMESTAMPTZ '2023-02-18 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 15.200, TIMESTAMPTZ '2023-08-05 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 14.500, TIMESTAMPTZ '2024-01-14 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 14.100, TIMESTAMPTZ '2024-07-20 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 13.800, TIMESTAMPTZ '2025-02-01 10:00:00+00'),
      (gen_random_uuid()::text, v_burek_id, 13.600, TIMESTAMPTZ '2025-05-28 10:00:00+00');
  END IF;

  -- Luna — kotka, British Shorthair
  IF NOT EXISTS (SELECT 1 FROM "Pet" WHERE name = 'Luna' AND "householdId" = v_household_id) THEN
    v_luna_id := gen_random_uuid()::text;
    INSERT INTO "Pet" (id, "householdId", name, species, breed, sex, neutered, "weightGoalKg", "birthDate", "createdAt")
    VALUES (v_luna_id, v_household_id, 'Luna', 'CAT', 'British Shorthair', 'FEMALE', true, 4.0,
            TIMESTAMPTZ '2021-11-08 00:00:00+00', NOW());

    INSERT INTO "WeightLog" (id, "petId", "weightKg", "loggedAt") VALUES
      (gen_random_uuid()::text, v_luna_id, 1.800, TIMESTAMPTZ '2022-02-15 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 2.400, TIMESTAMPTZ '2022-05-10 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 3.100, TIMESTAMPTZ '2022-09-01 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 3.600, TIMESTAMPTZ '2023-01-20 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 3.950, TIMESTAMPTZ '2023-06-14 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 4.100, TIMESTAMPTZ '2023-11-30 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 4.050, TIMESTAMPTZ '2024-05-09 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 3.980, TIMESTAMPTZ '2024-10-22 10:00:00+00'),
      (gen_random_uuid()::text, v_luna_id, 3.920, TIMESTAMPTZ '2025-03-17 10:00:00+00');
  END IF;

END $$;
