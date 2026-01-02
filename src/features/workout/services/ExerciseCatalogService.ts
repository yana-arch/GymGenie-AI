import { Exercise } from '@/types';

export class ExerciseCatalogService {
  private cache: Map<string, Exercise> = new Map();
  private loadedLetters: Set<string> = new Set();

  async loadIndex(): Promise<string[]> {
    try {
      const response = await fetch('/data/exercises.index.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load exercise index:', error);
      return [];
    }
  }

  async loadByLetter(letter: string): Promise<Exercise[]> {
    if (this.loadedLetters.has(letter)) {
      return Array.from(this.cache.values()).filter(ex => ex.name[0].toUpperCase() === letter);
    }

    try {
      const response = await fetch(`/data/exercises.${letter}.json`);
      const data: unknown[] = await response.json();
      const exercises: Exercise[] = data as Exercise[];

      exercises.forEach(ex => this.cache.set(ex.id, ex));
      this.loadedLetters.add(letter);
      return exercises;
    } catch (error) {
      console.error(`Failed to load exercises for letter ${letter}:`, error);
      return [];
    }
  }

  async getById(id: string): Promise<Exercise | null> {
    if (this.cache.has(id)) return this.cache.get(id)!;

    // Load all if not cached (simple implementation)
    await this.loadAll();
    return this.cache.get(id) || null;
  }

  async search(query: string, filters: {
    bodyPart?: string[];
    equipment?: string[];
    primaryMuscle?: string[];
    difficulty?: string[];
    mechanics?: string[];
  } = {}): Promise<Exercise[]> {
    const all = await this.loadAll();
    const lowerQuery = query.toLowerCase();

    return all.filter(ex => {
      // Text search
      const matchesQuery = !query ||
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.primaryMuscle.some(m => m.toLowerCase().includes(lowerQuery)) ||
        ex.secondaryMuscles.some(m => m.toLowerCase().includes(lowerQuery));

      // Filters
      const matchesBodyPart = !filters.bodyPart?.length ||
        ex.bodyPart.some(bp => filters.bodyPart!.includes(bp));

      const matchesEquipment = !filters.equipment?.length ||
        ex.equipment.some(eq => filters.equipment!.includes(eq));

      const matchesMuscle = !filters.primaryMuscle?.length ||
        ex.primaryMuscle.some(m => filters.primaryMuscle!.includes(m));

      const matchesDifficulty = !filters.difficulty?.length ||
        (ex.difficulty && filters.difficulty.includes(ex.difficulty));

      const matchesMechanics = !filters.mechanics?.length ||
        (ex.mechanics && filters.mechanics.includes(ex.mechanics));

      return matchesQuery && matchesBodyPart && matchesEquipment &&
             matchesMuscle && matchesDifficulty && matchesMechanics;
    });
  }

  async getByEquipment(equipSet: string[]): Promise<Exercise[]> {
    const all = await this.loadAll();
    return all.filter(ex => ex.equipment.some(eq => equipSet.includes(eq)));
  }

  async getAlternatives(exerciseId: string, limit: number = 5): Promise<Exercise[]> {
    const exercise = await this.getById(exerciseId);
    if (!exercise) return [];

    const all = await this.loadAll();
    return all
      .filter(ex =>
        ex.id !== exerciseId &&
        ex.primaryMuscle.some(m => exercise.primaryMuscle.includes(m)) &&
        ex.equipment.some(eq => exercise.equipment.includes(eq))
      )
      .slice(0, limit);
  }

  private async loadAll(): Promise<Exercise[]> {
    if (this.cache.size > 0) return Array.from(this.cache.values());

    const index = await this.loadIndex();
    const promises = index.map(letter => this.loadByLetter(letter));
    await Promise.all(promises);
    return Array.from(this.cache.values());
  }
}

// Singleton instance
export const exerciseCatalogService = new ExerciseCatalogService();
