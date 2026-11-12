import { getSqliteDb } from '../apps/web/lib/db/sqlite';

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rng: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((s, x) => s + x[1], 0);
  let r = rng() * total;
  for (const [val, w] of items) {
    r -= w;
    if (r <= 0) return val;
  }
  return items[items.length - 1][0];
}

const STATE_WEIGHTS: Array<[string, number]> = [
  ['Uttar Pradesh', 15],
  ['Maharashtra', 11],
  ['Bihar', 9],
  ['Gujarat', 10],
  ['West Bengal', 8],
  ['Madhya Pradesh', 7],
  ['Rajasthan', 7],
  ['Tamil Nadu', 6],
  ['Karnataka', 5],
  ['Andhra Pradesh', 4],
  ['Odisha', 3.5],
  ['Telangana', 3.2],
  ['Kerala', 2.8],
  ['Jharkhand', 2.6],
  ['Assam', 2.5],
  ['Punjab', 2.3],
  ['Chhattisgarh', 2.2],
  ['Haryana', 2.1],
  ['Delhi', 1.6],
  ['Jammu & Kashmir', 1.1],
  ['Uttarakhand', 1.0],
  ['Himachal Pradesh', 0.8],
];

export function generateSyntheticPopulation(count = 20000, seed = 20261112): number {
  const db = getSqliteDb();
  const rng = mulberry32(seed);

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM population; DELETE FROM analytics_cache;');
    const insert = db.prepare(
      `INSERT INTO population(id, state, district_type, age, gender, category, income, occupation, land_hectares, education, family_size, disability, docs_json, is_synthetic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    );

    for (let i = 1; i <= count; i++) {
      const state = pickWeighted(rng, STATE_WEIGHTS);
      const districtType = pickWeighted<'rural' | 'semi_urban' | 'urban'>(rng, [
        ['rural', 58],
        ['semi_urban', 20],
        ['urban', 22],
      ]);

      const ageRoll = rng();
      const age =
        ageRoll < 0.08
          ? 6 + Math.floor(rng() * 11)
          : ageRoll < 0.34
          ? 17 + Math.floor(rng() * 10)
          : ageRoll < 0.8
          ? 27 + Math.floor(rng() * 33)
          : 60 + Math.floor(rng() * 26);

      const gender = pickWeighted<'male' | 'female' | 'other'>(rng, [
        ['male', 50],
        ['female', 49],
        ['other', 1],
      ]);

      const category = pickWeighted<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>(rng, [
        ['OBC', 41],
        ['General', 22],
        ['SC', 19],
        ['ST', 10],
        ['EWS', 8],
      ]);

      const occupation =
        age < 23 && rng() < 0.65
          ? 'student'
          : age >= 62 && rng() < 0.6
          ? 'retired'
          : districtType === 'rural'
          ? pickWeighted(rng, [
              ['farmer', 46],
              ['worker', 28],
              ['artisan', 10],
              ['entrepreneur', 7],
              ['unemployed', 6],
              ['salaried', 3],
            ])
          : pickWeighted(rng, [
              ['worker', 30],
              ['entrepreneur', 24],
              ['salaried', 22],
              ['artisan', 10],
              ['unemployed', 9],
              ['student', 5],
            ]);

      const incomeBase =
        districtType === 'rural' ? 45000 + rng() * 210000 : 75000 + rng() * 480000;
      const incomeMultiplier =
        occupation === 'salaried'
          ? 1.7
          : occupation === 'entrepreneur'
          ? 1.3
          : occupation === 'unemployed'
          ? 0.65
          : 1.0;
      const income = Math.round((incomeBase * incomeMultiplier) / 1000) * 1000;

      const landHectares =
        occupation === 'farmer'
          ? Number((0.2 + rng() * 3.2).toFixed(2))
          : rng() < 0.12
          ? Number((0.1 + rng() * 0.8).toFixed(2))
          : 0;

      const education = pickWeighted(rng, [
        ['primary', 18],
        ['secondary', 26],
        ['higher_secondary', 24],
        ['diploma', 8],
        ['graduate', 16],
        ['postgraduate', 4],
        ['none', 4],
      ]);

      const familySize = 2 + Math.floor(rng() * 5);
      const disability = rng() < 0.045 ? 1 : 0;

      // Realistic document ownership probabilities
      const docs: string[] = [];
      if (rng() < 0.93) docs.push('aadhaar');
      if (rng() < 0.82) docs.push('bank_passbook');
      if (rng() < 0.62) docs.push('ration_card');
      if (rng() < (districtType === 'urban' ? 0.56 : 0.42)) docs.push('income_cert');
      if (category !== 'General' && rng() < 0.54) docs.push('caste_cert');
      if (landHectares > 0 && rng() < 0.72) docs.push('land_record');
      if (rng() < 0.68) docs.push('age_proof');
      if (rng() < 0.52) docs.push('domicile_cert');
      if (occupation === 'student' && rng() < 0.85) docs.push('education_marksheet');
      if (disability === 1 && rng() < 0.58) docs.push('disability_cert');
      if ((occupation === 'worker' || occupation === 'artisan') && rng() < 0.48)
        docs.push('eshram_bocw');
      if (rng() < 0.55) docs.push('pan_card');

      insert.run(
        i,
        state,
        districtType,
        age,
        gender,
        category,
        income,
        occupation,
        landHectares,
        education,
        familySize,
        disability,
        JSON.stringify(docs)
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return count;
}

if (require.main === module) {
  const n = generateSyntheticPopulation(20000);
  console.log(`Generated ${n} synthetic households in SQLite (is_synthetic=1).`);
}

