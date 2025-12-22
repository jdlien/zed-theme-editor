/**
 * Generate Theme Schema
 *
 * Fetches the official Zed theme schema and generates a TypeScript file
 * containing all available color property keys with their descriptions.
 *
 * Run with: npx tsx scripts/generate-schema.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCHEMA_URL = 'https://zed.dev/schema/themes/v0.2.0.json'
const OUTPUT_PATH = path.join(__dirname, '../src/lib/themeSchema.generated.ts')

interface SchemaProperty {
  description?: string
  $ref?: string
  type?: string
  items?: { $ref?: string }
}

interface Schema {
  // Schema can use either $defs (JSON Schema draft 2019+) or definitions (older drafts)
  $defs?: {
    ThemeStyleContent?: {
      properties: Record<string, SchemaProperty>
    }
  }
  definitions?: {
    ThemeStyleContent?: {
      properties: Record<string, SchemaProperty>
    }
  }
}

async function generateSchema() {
  console.log(`Fetching schema from ${SCHEMA_URL}...`)

  const response = await fetch(SCHEMA_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`)
  }

  const schema: Schema = await response.json()

  // Extract color properties from ThemeStyleContent (check both $defs and definitions)
  const defs = schema.$defs || schema.definitions
  if (!defs?.ThemeStyleContent?.properties) {
    throw new Error('Could not find ThemeStyleContent in schema definitions')
  }
  const styleContent = defs.ThemeStyleContent.properties
  const colorKeys: { key: string; description?: string }[] = []

  // Properties to skip (not simple color values)
  const skipKeys = new Set(['syntax', 'players', 'accents', 'background.appearance'])

  for (const [key, value] of Object.entries(styleContent)) {
    // Skip non-color properties
    if (skipKeys.has(key)) continue

    // Include properties that reference ColorContent or are nullable color types
    colorKeys.push({
      key,
      description: value.description,
    })
  }

  // Sort alphabetically for consistent output
  colorKeys.sort((a, b) => a.key.localeCompare(b.key))

  console.log(`Found ${colorKeys.length} color properties`)

  // Generate TypeScript file
  const output = `// AUTO-GENERATED - DO NOT EDIT
// Generated from ${SCHEMA_URL}
// Run \`pnpm generate-schema\` to regenerate

export interface ThemeColorKey {
  key: string
  description?: string
}

export const THEME_COLOR_KEYS: ThemeColorKey[] = ${JSON.stringify(colorKeys, null, 2)}

export const DEFAULT_COLOR = '#808080'
`

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8')
  console.log(`Generated ${OUTPUT_PATH}`)
}

generateSchema().catch((error) => {
  console.error('Failed to generate schema:', error)
  process.exit(1)
})
