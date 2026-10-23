// Intelligence ingestion script — processes AI research reports and updates the action queue
//
// This script implements the workflow documented in docs/ai-operations/INTELLIGENCE_PROTOCOL.md
// It reads new research reports, validates evidence, extracts findings, and updates ACTION_QUEUE.md
//
// Usage: node scripts/ingest-intelligence.mjs [--dry-run] [--since <checkpoint>]
//
// --dry-run: Print what would be done without making changes
// --since: Process only reports newer than this checkpoint (ISO timestamp or run ID)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const SINCE_ARG = process.argv.find(arg => arg.startsWith('--since'));
const SINCE = SINCE_ARG ? SINCE_ARG.split('=')[1] : null;

const AI_OPS_DIR = 'docs/ai-operations';
const ACTION_QUEUE_FILE = path.join(AI_OPS_DIR, 'ACTION_QUEUE.md');
const SYSTEM_STATE_FILE = path.join(AI_OPS_DIR, 'SYSTEM_STATE.md');
const REPORT_ROOTS = ['docs/health/runs', 'docs/competitive/runs'];

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function listRunDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'report.md')))
    .map(e => e.name)
    .sort();
}

function parseRunId(runId) {
  const m = runId.match(/^(\d{8})T(\d{6})Z/);
  if (!m) return null;
  const [, ymd, hms] = m;
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hms.slice(0, 2)}:${hms.slice(2, 4)}:${hms.slice(4, 6)}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isNewerThan(runId, checkpoint) {
  if (!checkpoint) return true;
  const runDate = parseRunId(runId);
  if (!runDate) return true;
  const checkpointDate = new Date(checkpoint);
  return runDate > checkpointDate;
}

function extractFindings(reportPath, sourcesPath, nextTasksPath) {
  const findings = [];
  
  // Read report
  let reportText;
  try {
    reportText = fs.readFileSync(reportPath, 'utf8');
  } catch {
    return findings;
  }

  // Read sources for validation
  const sources = readJsonSafe(sourcesPath) || {};
  
  // Read next-tasks for proposed actions
  let nextTasksText;
  try {
    nextTasksText = fs.readFileSync(nextTasksPath, 'utf8');
  } catch {
    nextTasksText = '';
  }

  // Simple extraction: look for sections that describe findings
  // This is a basic implementation; a more sophisticated version would use
  // structured parsing based on the actual report format
  const lines = reportText.split('\n');
  let currentSection = null;
  let currentFinding = null;

  for (const line of lines) {
    // Detect section headers (## or ###)
    if (line.match(/^#{2,3}\s+/)) {
      if (currentFinding) {
        findings.push(currentFinding);
        currentFinding = null;
      }
      currentSection = line.replace(/^#{2,3}\s+/, '').trim();
      continue;
    }

    // Look for finding patterns (lines starting with -, *, or numbered)
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      if (currentFinding) {
        findings.push(currentFinding);
      }
      const text = line.replace(/^[-*\d.]\s+/, '').trim();
      currentFinding = {
        section: currentSection,
        text: text,
        hasSource: !!sources.source || !!sources.sources,
        sourceType: sources.source || 'unknown',
      };
    }
  }

  if (currentFinding) {
    findings.push(currentFinding);
  }

  return findings;
}

function generateActionId() {
  // Read existing ACTION_QUEUE.md to find the highest ID
  try {
    const queueContent = fs.readFileSync(ACTION_QUEUE_FILE, 'utf8');
    const matches = queueContent.match(/### ACT-(\d+)/g);
    if (matches && matches.length > 0) {
      const maxId = Math.max(...matches.map(m => parseInt(m.replace('### ACT-', ''))));
      return `ACT-${String(maxId + 1).padStart(3, '0')}`;
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return 'ACT-001';
}

function categorizeFinding(finding) {
  const text = finding.text.toLowerCase();
  const section = finding.section?.toLowerCase() || '';

  if (text.includes('seo') || text.includes('search') || text.includes('indexing') || section.includes('seo')) {
    return 'SEO and local search';
  }
  if (text.includes('form') || text.includes('contact') || text.includes('inquiry') || text.includes('lead')) {
    return 'Lead intake and communications';
  }
  if (text.includes('performance') || text.includes('speed') || text.includes('uptime') || text.includes('available')) {
    return 'Website availability and reliability';
  }
  if (text.includes('content') || text.includes('copy') || text.includes('page') || text.includes('portfolio')) {
    return 'Content and portfolio';
  }
  if (text.includes('competitor') || text.includes('market') || text.includes('positioning')) {
    return 'Business growth and profitability';
  }
  if (text.includes('test') || text.includes('automation') || text.includes('workflow')) {
    return 'Automation health';
  }
  
  return 'Technical debt';
}

function prioritizeFinding(finding) {
  const text = finding.text.toLowerCase();
  
  if (text.includes('critical') || text.includes('broken') || text.includes('down') || text.includes('error') || text.includes('fail')) {
    return 'high';
  }
  if (text.includes('important') || text.includes('should') || text.includes('improve')) {
    return 'medium';
  }
  
  return 'low';
}

function formatQueueItem(id, finding, runId, runDate) {
  const category = categorizeFinding(finding);
  const priority = prioritizeFinding(finding);
  
  return `### ${id} — ${finding.text.slice(0, 80)}${finding.text.length > 80 ? '...' : ''}

**Category:** ${category}
**Priority:** ${priority}
**Status:** DISCOVERED
**Date discovered:** ${runDate.toISOString().slice(0, 10)}
**Source:** ${runId}
**Confidence:** ${finding.hasSource ? 'medium' : 'low'}

**Evidence:**
- Report: [report.md](../../${path.join(finding.root, runId, 'report.md')})
${finding.hasSource ? '- Source validated in sources.json' : '- No source validation'}

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** ${new Date().toISOString().slice(0, 10)}
`;
}

function main() {
  console.log(`[ingest-intelligence] ${new Date().toISOString()} starting${DRY_RUN ? ' (dry run)' : ''}`);
  if (SINCE) {
    console.log(`[ingest-intelligence] processing reports newer than: ${SINCE}`);
  }

  let totalRuns = 0;
  let processedRuns = 0;
  let findingsExtracted = 0;

  for (const root of REPORT_ROOTS) {
    const runDirs = listRunDirs(root);
    totalRuns += runDirs.length;

    for (const runId of runDirs) {
      if (!isNewerThan(runId, SINCE)) {
        console.log(`[ingest-intelligence] skipping ${runId} (older than checkpoint)`);
        continue;
      }

      const runDate = parseRunId(runId);
      if (!runDate) {
        console.warn(`[ingest-intelligence] cannot parse date from ${runId}, skipping`);
        continue;
      }

      const reportPath = path.join(root, runId, 'report.md');
      const sourcesPath = path.join(root, runId, 'sources.json');
      const nextTasksPath = path.join(root, runId, 'next-tasks.md');

      console.log(`[ingest-intelligence] processing ${runId}`);
      processedRuns++;

      const findings = extractFindings(reportPath, sourcesPath, nextTasksPath);
      console.log(`[ingest-intelligence] extracted ${findings.length} findings from ${runId}`);
      findingsExtracted += findings.length;

      if (!DRY_RUN && findings.length > 0) {
        // Append to ACTION_QUEUE.md
        const queueContent = fs.existsSync(ACTION_QUEUE_FILE) 
          ? fs.readFileSync(ACTION_QUEUE_FILE, 'utf8')
          : '# Action Queue — Central Work Tracker\n\n## Current queue\n\n*No items yet*\n';
        
        let newContent = queueContent;
        for (const finding of findings) {
          finding.root = root; // Add root for link generation
          const id = generateActionId();
          const item = formatQueueItem(id, finding, runId, runDate);
          
          // Insert before the final section (if any) or append
          const insertPoint = newContent.lastIndexOf('##');
          if (insertPoint > 0) {
            newContent = newContent.slice(0, insertPoint) + item + '\n' + newContent.slice(insertPoint);
          } else {
            newContent += '\n' + item + '\n';
          }
        }
        
        fs.writeFileSync(ACTION_QUEUE_FILE, newContent, 'utf8');
        console.log(`[ingest-intelligence] updated ${ACTION_QUEUE_FILE}`);
      }
    }
  }

  console.log('[ingest-intelligence] summary:');
  console.log(`  total runs found: ${totalRuns}`);
  console.log(`  runs processed: ${processedRuns}`);
  console.log(`  findings extracted: ${findingsExtracted}`);
  
  if (DRY_RUN) {
    console.log('[ingest-intelligence] dry run — no files were modified');
  } else {
    console.log('[ingest-intelligence] ACTION_QUEUE.md updated');
    console.log('[ingest-intelligence] review and categorize items, then update SYSTEM_STATE.md');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
