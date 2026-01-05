import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Checkpoint,
  CheckpointOptions,
  RollbackResult,
  RollbackOptions,
  RollbackError,
} from './types';
import { defaultLogger as logger } from '../utils/logger';

/**
 * Manages checkpoints and rollback functionality
 */
export class RollbackManager {
  private checkpointsDir: string;
  private checkpoints: Map<string, Checkpoint>;

  constructor(checkpointsDir?: string) {
    this.checkpointsDir =
      checkpointsDir || path.join(process.cwd(), '.cleanup-checkpoints');
    this.checkpoints = new Map();
  }

  /**
   * Initialize the rollback manager
   */
  async initialize(): Promise<void> {
    // Create checkpoints directory if it doesn't exist
    await fs.mkdir(this.checkpointsDir, { recursive: true });

    // Load existing checkpoints
    await this.loadCheckpoints();
  }

  /**
   * Create a checkpoint (backup) of specified files
   */
  async createCheckpoint(
    files: string[],
    options: CheckpointOptions = {}
  ): Promise<Checkpoint> {
    const id = uuidv4();
    const timestamp = new Date();
    const label = options.label || `Checkpoint ${timestamp.toISOString()}`;

    logger.info(`Creating checkpoint: ${label}`);

    const fileContents = new Map<string, string>();
    let totalSize = 0;

    // Read and store file contents
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        fileContents.set(filePath, content);
        totalSize += content.length;
      } catch (error) {
        logger.warn(`Could not backup file ${filePath}: ${error}`);
      }
    }

    const checkpoint: Checkpoint = {
      id,
      label,
      timestamp,
      files: fileContents,
      canRestore: true,
      metadata: {
        ...options.metadata,
        filesCount: fileContents.size,
        totalSize,
      },
    };

    // Save checkpoint to disk
    await this.saveCheckpoint(checkpoint);

    // Store in memory
    this.checkpoints.set(id, checkpoint);

    logger.info(
      `Checkpoint created: ${id} (${fileContents.size} files, ${totalSize} bytes)`
    );

    return checkpoint;
  }

  /**
   * Rollback to a checkpoint
   */
  async rollback(
    checkpointId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    const checkpoint = this.checkpoints.get(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    if (!checkpoint.canRestore) {
      throw new Error(`Checkpoint cannot be restored: ${checkpointId}`);
    }

    logger.info(`Rolling back to checkpoint: ${checkpoint.label}`);

    const filesRestored: string[] = [];
    const filesSkipped: string[] = [];
    const errors: RollbackError[] = [];

    // Determine which files to restore
    const filesToRestore = options.files
      ? Array.from(checkpoint.files.keys()).filter((f) =>
          options.files!.includes(f)
        )
      : Array.from(checkpoint.files.keys());

    // Dry run mode
    if (options.dryRun) {
      logger.info('Dry run mode - no files will be restored');
      return {
        success: true,
        checkpointId,
        filesRestored: filesToRestore,
        filesSkipped: [],
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    // Restore files
    for (const filePath of filesToRestore) {
      try {
        const content = checkpoint.files.get(filePath);
        if (!content) {
          filesSkipped.push(filePath);
          continue;
        }

        // Check if file has been modified since checkpoint
        if (!options.force) {
          try {
            const currentContent = await fs.readFile(filePath, 'utf-8');
            if (currentContent !== content) {
              // File has been modified
              if (options.verbose) {
                logger.warn(
                  `File has been modified since checkpoint: ${filePath}`
                );
              }
              // For safety, skip unless force is enabled
              filesSkipped.push(filePath);
              continue;
            }
          } catch (error) {
            // File doesn't exist, that's okay
          }
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Restore file
        await fs.writeFile(filePath, content, 'utf-8');
        filesRestored.push(filePath);

        if (options.verbose) {
          logger.info(`Restored: ${filePath}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({ file: filePath, error: errorMessage });
        logger.error(`Error restoring ${filePath}: ${errorMessage}`);
      }
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    logger.info(
      `Rollback complete: ${filesRestored.length} restored, ${filesSkipped.length} skipped, ${errors.length} errors`
    );

    return {
      success,
      checkpointId,
      filesRestored,
      filesSkipped,
      errors,
      duration,
    };
  }

  /**
   * List all checkpoints
   */
  listCheckpoints(): Checkpoint[] {
    return Array.from(this.checkpoints.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get a specific checkpoint
   */
  getCheckpoint(id: string): Checkpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(id: string): Promise<void> {
    const checkpoint = this.checkpoints.get(id);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${id}`);
    }

    // Delete from disk
    const checkpointPath = path.join(this.checkpointsDir, `${id}.json`);
    try {
      await fs.unlink(checkpointPath);
    } catch (error) {
      logger.warn(`Could not delete checkpoint file: ${error}`);
    }

    // Remove from memory
    this.checkpoints.delete(id);

    logger.info(`Checkpoint deleted: ${id}`);
  }

  /**
   * Delete all checkpoints
   */
  async deleteAllCheckpoints(): Promise<void> {
    const checkpointIds = Array.from(this.checkpoints.keys());

    for (const id of checkpointIds) {
      await this.deleteCheckpoint(id);
    }

    logger.info('All checkpoints deleted');
  }

  /**
   * Delete old checkpoints (older than specified days)
   */
  async deleteOldCheckpoints(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const checkpointsToDelete = Array.from(this.checkpoints.values()).filter(
      (cp) => cp.timestamp < cutoffDate
    );

    for (const checkpoint of checkpointsToDelete) {
      await this.deleteCheckpoint(checkpoint.id);
    }

    logger.info(`Deleted ${checkpointsToDelete.length} old checkpoints`);

    return checkpointsToDelete.length;
  }

  /**
   * Save checkpoint to disk
   */
  private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const checkpointPath = path.join(
      this.checkpointsDir,
      `${checkpoint.id}.json`
    );

    // Convert Map to object for JSON serialization
    const serializable = {
      ...checkpoint,
      files: Array.from(checkpoint.files.entries()),
    };

    await fs.writeFile(
      checkpointPath,
      JSON.stringify(serializable, null, 2),
      'utf-8'
    );
  }

  /**
   * Load checkpoints from disk
   */
  private async loadCheckpoints(): Promise<void> {
    try {
      const files = await fs.readdir(this.checkpointsDir);

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        try {
          const checkpointPath = path.join(this.checkpointsDir, file);
          const content = await fs.readFile(checkpointPath, 'utf-8');
          const data = JSON.parse(content);

          // Convert array back to Map
          const checkpoint: Checkpoint = {
            ...data,
            timestamp: new Date(data.timestamp),
            files: new Map(data.files),
          };

          this.checkpoints.set(checkpoint.id, checkpoint);
        } catch (error) {
          logger.warn(`Could not load checkpoint ${file}: ${error}`);
        }
      }

      logger.info(`Loaded ${this.checkpoints.size} checkpoints`);
    } catch (error) {
      // Directory doesn't exist yet, that's okay
      logger.info('No existing checkpoints found');
    }
  }

  /**
   * Get checkpoints directory
   */
  getCheckpointsDir(): string {
    return this.checkpointsDir;
  }
}
