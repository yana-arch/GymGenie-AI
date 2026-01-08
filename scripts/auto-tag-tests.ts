#!/usr/bin/env tsx

/**
 * Auto Tagger for Test Files
 * Automatically applies priority tags to test files based on content analysis
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface TestPattern {
  pattern: RegExp;
  priority: string;
  reason: string;
}

const PRIORITY_PATTERNS: TestPattern[] = [
  // Smoke Tests - Core functionality
  {
    pattern: /core|initialize|startup|basic|essential|main|primary/i,
    priority: 'createSmokeTest',
    reason: 'Core functionality that must work'
  },
  {
    pattern: /storage.*save|storage.*load|localStorage|session.*start|session.*create/i,
    priority: 'createSmokeTest',
    reason: 'Essential data persistence'
  },
  {
    pattern: /authentication|login|user.*session|access.*control/i,
    priority: 'createSmokeTest',
    reason: 'Core user authentication'
  },

  // P0 Tests - Critical safety and data protection
  {
    pattern: /safety|injury.*prevent|override.*safety|critical.*error|data.*protect|privacy|encrypt/i,
    priority: 'createCriticalTest',
    reason: 'Safety-critical functionality'
  },
  {
    pattern: /error.*handle|exception.*handle|fail.*safe|corrupt.*data/i,
    priority: 'createCriticalTest',
    reason: 'Error handling and data integrity'
  },
  {
    pattern: /injury.*detect|discomfort.*monitor|pain.*assessment/i,
    priority: 'createCriticalTest',
    reason: 'Injury detection and monitoring'
  },

  // P1 Tests - High priority main features
  {
    pattern: /form.*correct|pose.*detect|technique.*analysis|coaching.*recommend/i,
    priority: 'createHighPriorityTest',
    reason: 'Main coaching functionality'
  },
  {
    pattern: /preference.*learn|pattern.*detect|recommendation.*personal/i,
    priority: 'createHighPriorityTest',
    reason: 'Main personalization features'
  },
  {
    pattern: /feedback.*process|user.*feedback|adaptation/i,
    priority: 'createHighPriorityTest',
    reason: 'Main feedback processing'
  },
  {
    pattern: /historical.*pattern|trend.*analysis|progress.*track/i,
    priority: 'createHighPriorityTest',
    reason: 'Main analytics features'
  },
  {
    pattern: /integration|workflow|end.*to.*end/i,
    priority: 'createHighPriorityTest',
    reason: 'Important integration testing'
  },

  // P2 Tests - Medium priority
  {
    pattern: /performance|optimization|cache|efficient|speed/i,
    priority: 'createMediumPriorityTest',
    reason: 'Performance and optimization'
  },
  {
    pattern: /export|import|data.*transfer|sync/i,
    priority: 'createMediumPriorityTest',
    reason: 'Data transfer functionality'
  },
  {
    pattern: /filter|search|sort|paginate/i,
    priority: 'createMediumPriorityTest',
    reason: 'Data manipulation features'
  },

  // P3 Tests - Low priority
  {
    pattern: /documentation|help|tutorial|guide/i,
    priority: 'createLowPriorityTest',
    reason: 'Documentation and help features'
  },
  {
    pattern: /ui.*component|render|display|visual/i,
    priority: 'createLowPriorityTest',
    reason: 'UI components (medium priority)'
  },
  {
    pattern: /edge.*case|rare.*scenario|boundary.*condition/i,
    priority: 'createLowPriorityTest',
    reason: 'Edge cases and rare scenarios'
  }
];

async function findTestFiles(): Promise<string[]> {
  const pattern = '**/*.test.ts';
  return await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
}

function determinePriority(description: string, fileContent: string): string {
  for (const { pattern, priority, reason } of PRIORITY_PATTERNS) {
    if (description.match(pattern) || fileContent.match(pattern)) {
      return priority;
    }
  }
  return 'createHighPriorityTest'; // Default to high priority
}

function extractTestCategory(fileContent: string): string {
  if (fileContent.includes('storage') || fileContent.includes('Storage')) return 'STORAGE';
  if (fileContent.includes('session') || fileContent.includes('Session')) return 'SESSION';
  if (fileContent.includes('workout') || fileContent.includes('Workout')) return 'WORKOUT';
  if (fileContent.includes('feedback') || fileContent.includes('Feedback')) return 'FEEDBACK';
  if (fileContent.includes('safety') || fileContent.includes('Safety')) return 'SAFETY';
  if (fileContent.includes('injury') || fileContent.includes('Injury')) return 'INJURY';
  if (fileContent.includes('form') || fileContent.includes('Form')) return 'FORM';
  if (fileContent.includes('unified') || fileContent.includes('Unified')) return 'UNIFIED';
  if (fileContent.includes('preference') || fileContent.includes('Preference')) return 'PREFERENCE';
  if (fileContent.includes('historical') || fileContent.includes('Historical')) return 'HISTORICAL';
  return 'UNIFIED'; // Default category
}

function updateTestFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const category = extractTestCategory(content);
    
    // Update imports to include priority generators
    let updatedContent = content;
    if (!content.includes('createSmokeTest') || !content.includes('TestCategory')) {
      const importMatch = content.match(/import\s*\{[^}]+\}\s*from\s*['"][^'"]*test-utils['"];?/);
      if (importMatch) {
        const currentImports = importMatch[0];
        const newImports = currentImports.replace(
          /createStorageTest[^,}]*,\s*/,
          'createStorageTest, createSmokeTest, createCriticalTest, createHighPriorityTest, createMediumPriorityTest, createLowPriorityTest, TestCategory, '
        ).replace(
          /TestType[^,}]*,\s*/,
          'TestType, TestCategory, '
        );
        updatedContent = content.replace(currentImports, newImports);
      }
    }

    // Update test calls with priority tags
    const testCallPattern = /(create\w+Test\s*\(\s*)(\d+\s*,\s*['"`]([^'"`]+)['"`])/g;
    let changed = false;
    
    updatedContent = updatedContent.replace(testCallPattern, (match, generator, rest, description) => {
      const priority = determinePriority(description, content);
      
      // Skip if it's already a priority generator
      if (generator.includes('Smoke') || generator.includes('Critical') || 
          generator.includes('HighPriority') || generator.includes('MediumPriority') || 
          generator.includes('LowPriority')) {
        return match;
      }
      
      changed = true;
      return `${priority}(TestCategory.${category}, TestType.UNIT, ${rest}`;
    });

    if (changed || updatedContent !== content) {
      writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🏷️  Auto-tagging test files...\n');
  
  const testFiles = await findTestFiles();
  console.log(`Found ${testFiles.length} test files\n`);
  
  let updatedCount = 0;
  
  for (const filePath of testFiles) {
    if (updateTestFile(filePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`Total files processed: ${testFiles.length}`);
  console.log(`Files updated: ${updatedCount}`);
  console.log(`Files unchanged: ${testFiles.length - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log(`\n✨ Auto-tagging complete! Run 'npm run test:validate-tags' to verify compliance.`);
  }
}

if (require.main === module) {
  main();
}