import { getDb } from '../src/index';

const hashPassword = (password: string) => Bun.password.hash(password, { algorithm: 'bcrypt', cost: 12 });

async function seed() {
  const db = getDb('online');
  console.log('Seeding database...');

  let admin = await db
    .insertInto('users')
    .values({
      username: 'admin',
      email: 'admin@lsu.dev',
      password_hash: await hashPassword('admin123'),
      is_admin: true,
    })
    .onConflict((oc) => oc.column('username').doNothing())
    .returningAll()
    .executeTakeFirst();

  if (!admin) {
    admin = await db.selectFrom('users').selectAll().where('username', '=', 'admin').executeTakeFirst();
  }

  if (!admin) throw new Error('Failed to create/find admin user');
  console.log(`  ✓ Admin user: ${admin.username}`);

  const team1 = await db
    .insertInto('teams')
    .values({
      name: 'Team Alpha',
      tag: 'ALFA',
      owner_id: admin.id,
      colors: JSON.stringify({ primary: '#6366f1', secondary: '#8b5cf6', accent: '#a78bfa' }),
    })
    .onConflict((oc) => oc.column('name').doNothing())
    .returningAll()
    .executeTakeFirst();

  const team2 = await db
    .insertInto('teams')
    .values({
      name: 'Team Omega',
      tag: 'OMGA',
      owner_id: admin.id,
      colors: JSON.stringify({ primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24' }),
    })
    .onConflict((oc) => oc.column('name').doNothing())
    .returningAll()
    .executeTakeFirst();

  console.log(`  ✓ Teams: ${[team1?.name, team2?.name].filter(Boolean).join(', ') || 'already exist'}`);

  if (team1) {
    for (const p of [
      { in_game_name: 'AlphaTop', tag: 'ALFA', role: 'TOP' },
      { in_game_name: 'AlphaJgl', tag: 'ALFA', role: 'JUNGLE' },
      { in_game_name: 'AlphaMid', tag: 'ALFA', role: 'MID' },
      { in_game_name: 'AlphaBot', tag: 'ALFA', role: 'BOTTOM' },
      { in_game_name: 'AlphaSup', tag: 'ALFA', role: 'SUPPORT' },
    ]) {
      await db.insertInto('players').values({ team_id: team1.id, ...p }).execute();
    }
    console.log('  ✓ Players for Team Alpha');
  }

  if (team2) {
    for (const p of [
      { in_game_name: 'OmegaTop', tag: 'OMGA', role: 'TOP' },
      { in_game_name: 'OmegaJgl', tag: 'OMGA', role: 'JUNGLE' },
      { in_game_name: 'OmegaMid', tag: 'OMGA', role: 'MID' },
      { in_game_name: 'OmegaBot', tag: 'OMGA', role: 'BOTTOM' },
      { in_game_name: 'OmegaSup', tag: 'OMGA', role: 'SUPPORT' },
    ]) {
      await db.insertInto('players').values({ team_id: team2.id, ...p }).execute();
    }
    console.log('  ✓ Players for Team Omega');
  }

  await db
    .insertInto('tournaments')
    .values({
      name: 'Summer Split 2026',
      type: 'ladder',
      format: 'bo3',
      status: 'registration',
      organizer_id: admin.id,
    })
    .onConflict((oc) => oc.column('name').doNothing())
    .returningAll()
    .executeTakeFirst()
    .then((t) => console.log(`  ✓ Tournament: ${t?.name ?? 'already exists'}`));

  for (const c of [
    { name: 'CasterOne', social_links: JSON.stringify({ twitter: '@caster1' }) },
    { name: 'CasterTwo', social_links: JSON.stringify({ twitter: '@caster2' }) },
  ]) {
    await db.insertInto('commentators').values(c).onConflict((oc) => oc.column('name').doNothing()).execute();
  }

  console.log('  ✓ Commentators');
  console.log('Done!');
  await db.destroy();
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
