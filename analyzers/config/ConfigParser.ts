import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AnalysisConfigSchema, AnalysisConfig, PartialAnalysisConfig } from './AnalysisConfig';

/**
 * Configuration file formats
 */
export type ConfigFormat = 'json' | 'yaml' | 'yml';

/**
 * Configuration parser for analysis settings
 */
export class ConfigParser {
  /**
   * Parse configuration from a file
   * @param filePath Path to configuration file
   * @returns Validated analysis configuration
   */
  static parseFile(filePath: string): AnalysisConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const format = this.detectFormat(filePath);

    return this.parseContent(content, format);
  }

  /**
   * Parse configuration from string content
   * @param content Configuration content
   * @param format Configuration format
   * @returns Validated analysis configuration
   */
  static parseContent(content: string, format: ConfigFormat): AnalysisConfig {
    let rawConfig: unknown;

    try {
      if (format === 'json') {
        rawConfig = JSON.parse(content);
      } else if (format === 'yaml' || format === 'yml') {
        rawConfig = yaml.load(content);
      } else {
        throw new Error(`Unsupported configuration format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
    }

    return this.validate(rawConfig);
  }

  /**
   * Validate configuration object
   * @param config Raw configuration object
   * @returns Validated analysis configuration
   */
  static validate(config: unknown): AnalysisConfig {
    const result = AnalysisConfigSchema.safeParse(config);

    if (!result.success) {
      const errors = result.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      throw new Error(`Configuration validation failed:\n${errors}`);
    }

    return result.data;
  }

  /**
   * Detect configuration format from file extension
   * @param filePath Path to configuration file
   * @returns Detected format
   */
  private static detectFormat(filePath: string): ConfigFormat {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    
    if (ext === 'json') return 'json';
    if (ext === 'yaml' || ext === 'yml') return 'yaml';
    
    throw new Error(`Unable to detect configuration format from file: ${filePath}`);
  }

  /**
   * Find configuration file in standard locations
   * @param startDir Directory to start searching from
   * @returns Path to configuration file or null if not found
   */
  static findConfigFile(startDir: string = process.cwd()): string | null {
    const configNames = [
      '.analysis.config.json',
      '.analysis.config.yaml',
      '.analysis.config.yml',
      'analysis.config.json',
      'analysis.config.yaml',
      'analysis.config.yml',
    ];

    for (const name of configNames) {
      const configPath = path.join(startDir, name);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  /**
   * Load configuration from file or return default
   * @param filePath Optional path to configuration file
   * @returns Analysis configuration
   */
  static loadConfig(filePath?: string): AnalysisConfig {
    if (filePath) {
      return this.parseFile(filePath);
    }

    const foundPath = this.findConfigFile();
    if (foundPath) {
      return this.parseFile(foundPath);
    }

    // Return default configuration
    return this.validate({});
  }

  /**
   * Save configuration to file
   * @param config Configuration to save
   * @param filePath Path to save configuration
   * @param format Format to use (default: json)
   */
  static saveConfig(
    config: PartialAnalysisConfig,
    filePath: string,
    format: ConfigFormat = 'json'
  ): void {
    // Validate before saving
    const validatedConfig = this.validate(config);

    let content: string;
    if (format === 'json') {
      content = JSON.stringify(validatedConfig, null, 2);
    } else if (format === 'yaml' || format === 'yml') {
      content = yaml.dump(validatedConfig, { indent: 2 });
    } else {
      throw new Error(`Unsupported configuration format: ${format}`);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }
}
