import { promises as fs } from 'fs';
import { v5 as uuidv5 } from 'uuid';
import { ExerciseSchema, Exercise } from '../src/types/schemas';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace

export const seedExercises = async () => {
  console.log('Starting exercise seeding...');

  try {
    const raw = JSON.parse(await fs.readFile('samples_GymGenie/exercisedb_v1_sample/exercises.json', 'utf-8'));
    console.log(`Loaded ${raw.length} raw exercises`);

    const processed: Exercise[] = [];

    for (const item of raw) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const id = uuidv5(slug, NAMESPACE);

      // Map fields to new schema
      const exercise = ExerciseSchema.parse({
        id,
        slug,
        name: item.name,
        bodyPart: item.bodyParts || [], // Assume it's array
        primaryMuscle: item.targetMuscles || [],
        secondaryMuscles: item.secondaryMuscles || [],
        equipment: item.equipments || [],
        instructions: item.instructions || [],
        cues: [],
        contraindications: [],
        media: {
          gif: item.gifUrl ? `/assets/exercises/${item.gifUrl}` : undefined,
        },
        tags: [],
        sourceMeta: {
          attribution: 'ExerciseDB',
        },
      });
      processed.push(exercise);
    }

    console.log(`Processed ${processed.length} exercises`);

    // Dedupe by slug
    const deduped = processed.filter((ex, i, arr) =>
      arr.findIndex(e => e.slug === ex.slug) === i
    );
    console.log(`After dedupe: ${deduped.length} exercises`);

    // Chunk by first letter
    const chunks: Record<string, Exercise[]> = {};
    deduped.forEach(ex => {
      const key = ex.name[0].toUpperCase();
      if (!chunks[key]) chunks[key] = [];
      chunks[key].push(ex);
    });

    // Create public/data directory if needed
    await fs.mkdir('public/data', { recursive: true });

    // Write chunks
    for (const [letter, exercises] of Object.entries(chunks)) {
      await fs.writeFile(`public/data/exercises.${letter}.json`, JSON.stringify(exercises, null, 2));
      console.log(`Wrote ${exercises.length} exercises for letter ${letter}`);
    }

    // Write index
    const index = Object.keys(chunks).sort();
    await fs.writeFile('public/data/exercises.index.json', JSON.stringify(index));
    console.log('Wrote index file');

    console.log('Exercise seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedExercises().catch(console.error);
}
