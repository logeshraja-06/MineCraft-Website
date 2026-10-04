const crypto = require('crypto');

/**
 * Intelligent Code Block Splitter
 * Splits complete programs into structured, syntax-aware fragments.
 */

function detectBlockType(code, lang) {
  const trimmed = code.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('import ') || lower.startsWith('from ') || lower.startsWith('#include') || lower.startsWith('package ')) {
    return 'IMPORT';
  }
  if (lower.startsWith('public class ') || lower.startsWith('class ') || lower.includes('class Main')) {
    return 'WRAPPER';
  }
  if (lower.startsWith('def ') || lower.includes('main(String[]') || lower.includes('int main(') || lower.includes('void main(')) {
    return 'FUNCTION';
  }
  if (lower.startsWith('for ') || lower.startsWith('for(') || lower.startsWith('while ') || lower.startsWith('while(')) {
    return 'LOOP';
  }
  if (
    lower.startsWith('scanner ') ||
    lower.startsWith('int ') ||
    lower.startsWith('let ') ||
    lower.startsWith('var ') ||
    lower.startsWith('const ') ||
    lower.startsWith('cin >>') ||
    lower.startsWith('scanf(') ||
    lower.includes('= input(') ||
    lower.includes('= int(input(')
  ) {
    if (lower.includes('input') || lower.includes('scanner') || lower.includes('cin') || lower.includes('scanf')) {
      return 'INIT';
    }
    return 'LOGIC';
  }
  if (
    lower.startsWith('system.out.') ||
    lower.startsWith('console.log') ||
    lower.startsWith('printf(') ||
    lower.startsWith('cout <<') ||
    lower.startsWith('print(') ||
    lower.startsWith('return ')
  ) {
    return 'OUTPUT';
  }
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
    return 'COMMENT';
  }
  return 'LOGIC';
}

function generateHint(type, code) {
  switch (type) {
    case 'IMPORT':
      return 'Module/Library inclusion';
    case 'WRAPPER':
      return 'Class or root definition';
    case 'FUNCTION':
      return 'Function/Method header';
    case 'INIT':
      return 'Input parsing or variable initialization';
    case 'LOOP':
      return 'Loop / Iteration control header';
    case 'OUTPUT':
      return 'Result printing or function return';
    case 'COMMENT':
      return 'Documentation remark';
    default:
      return 'Algorithmic logic';
  }
}

/**
 * Statement-aware splitter for C/Java/JS-style bracketed languages
 */
function splitCStyleStatements(source) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (buffer.length > 0) {
        // preserve blank lines if inside buffer
        buffer.push(rawLine);
      }
      continue;
    }

    buffer.push(rawLine);

    // If buffer ends with an open brace '{', it's a header block (class, function, loop, if)
    if (line.endsWith('{')) {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }

    // Standalone closing brace '}'
    if (line === '}' || line.startsWith('} else') || line === '};') {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }

    // Statement terminating with semicolon ';'
    if (line.endsWith(';')) {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }

    // Direct preprocessor / import
    if (line.startsWith('#include') || line.startsWith('import ') || line.startsWith('package ')) {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }
  }

  if (buffer.length > 0) {
    blocks.push(buffer.join('\n'));
  }

  return blocks;
}

/**
 * Python-aware splitter (identifies function headers, loop headers, statements)
 */
function splitPythonStatements(source) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    buffer.push(rawLine);

    // Compound statement headers ending in ':'
    if (line.endsWith(':')) {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }

    // Imports / comments / regular statements
    if (
      line.startsWith('import ') ||
      line.startsWith('from ') ||
      line.startsWith('#') ||
      line.startsWith('print(') ||
      line.startsWith('return ') ||
      line.includes('=')
    ) {
      blocks.push(buffer.join('\n'));
      buffer = [];
      continue;
    }
  }

  if (buffer.length > 0) {
    blocks.push(buffer.join('\n'));
  }

  return blocks;
}

/**
 * Line-based splitter (non-empty lines)
 */
function splitLineBased(source) {
  return source
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
}

/**
 * Custom / Delimiter-based splitter
 */
function splitCustom(source) {
  if (source.includes('---BLOCK---') || source.includes('// --- BLOCK ---')) {
    return source.split(/---BLOCK---|(?:\/\/ --- BLOCK ---)/).map((b) => b.trim()).filter(Boolean);
  }
  return splitCStyleStatements(source);
}

/**
 * Main export to parse source code into ordered code blocks
 */
function generateCodeBlocks({
  sourceCode,
  language = 'java',
  strategy = 'statement',
  initialVisibleCount = 3,
  randomize = true,
  slug = 'chal',
}) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return [];
  }

  const lang = (language || 'java').toLowerCase();
  let rawFragments = [];

  switch (strategy) {
    case 'line':
      rawFragments = splitLineBased(sourceCode);
      break;
    case 'function':
    case 'statement':
      if (lang === 'python') {
        rawFragments = splitPythonStatements(sourceCode);
      } else {
        rawFragments = splitCStyleStatements(sourceCode);
      }
      break;
    case 'custom':
      rawFragments = splitCustom(sourceCode);
      break;
    default:
      rawFragments = lang === 'python' ? splitPythonStatements(sourceCode) : splitCStyleStatements(sourceCode);
  }

  if (rawFragments.length === 0) {
    rawFragments = splitLineBased(sourceCode);
  }

  // Create blocks with original order
  const total = rawFragments.length;
  const blocks = rawFragments.map((snippet, idx) => {
    const originalOrder = idx + 1;
    const blockId = `B${String(originalOrder).padStart(2, '0')}`;
    const blockType = detectBlockType(snippet, lang);
    const hashRandom = crypto.randomBytes(3).toString('hex').toUpperCase();
    const qrHash = `MC-${(slug || 'CH').toUpperCase().slice(0, 8)}-${blockId}-${hashRandom}`;

    return {
      blockId,
      codeSnippet: snippet,
      code: snippet,
      originalOrder,
      displayOrder: originalOrder,
      orderHint: originalOrder,
      blockType,
      language: lang,
      qrHash,
      qrToken: qrHash,
      correctOrder: originalOrder,
      type: blockType,
      points: 10,
      isDecoy: false,
      hint: generateHint(blockType, snippet),
      isInitiallyVisible: originalOrder <= initialVisibleCount,
      isLocked: false,
    };
  });

  // Assign scrambled displayOrder if randomize is true
  if (randomize && blocks.length > 1) {
    // Fisher-Yates shuffle order numbers
    const displayIndices = blocks.map((_, i) => i + 1);
    for (let i = displayIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [displayIndices[i], displayIndices[j]] = [displayIndices[j], displayIndices[i]];
    }
    blocks.forEach((b, idx) => {
      b.displayOrder = displayIndices[idx];
    });
  }

  // Assign taskId to each block based on logical task grouping
  const tasks = generateTasksForBlocks(blocks, slug || 'Program');
  const blockToTaskMap = {};
  tasks.forEach((t) => {
    t.requiredBlockIds.forEach((bId) => {
      blockToTaskMap[bId] = t.taskId;
    });
  });

  blocks.forEach((b) => {
    b.taskId = blockToTaskMap[b.blockId] || 'task-1';
  });

  blocks.blocks = blocks;
  blocks.tasks = tasks;
  return blocks;
}

/**
 * Automatically groups code blocks into structured reveal tasks
 */
function generateTasksForBlocks(blocks, programTitle = 'Challenge') {
  if (!blocks || blocks.length === 0) return [];

  const tasks = [];
  const total = blocks.length;

  // If very small program (<= 3 blocks)
  if (total <= 3) {
    blocks.forEach((b, idx) => {
      tasks.push({
        taskId: `task-${idx + 1}`,
        title: `Task ${idx + 1}: ${b.hint || 'Assemble Logical Component'}`,
        description: `Unlock and assemble block ${b.blockId} into the code solution.`,
        requiredBlockIds: [b.blockId],
        penalty: 5,
        order: idx + 1,
      });
    });
    return tasks;
  }

  // Group blocks by chunks of 2-3 blocks each
  const chunkSize = Math.max(1, Math.ceil(total / 5));
  let taskIndex = 1;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const requiredBlockIds = chunk.map((b) => b.blockId);
    const firstBlock = chunk[0];
    const lastBlock = chunk[chunk.length - 1];

    let taskTitle = `Task ${taskIndex}: Core Logic`;
    let taskDesc = `Implement algorithmic component.`;

    if (i === 0) {
      taskTitle = `Task ${taskIndex}: Program & Data Setup`;
      taskDesc = `Prepare imports, class definition, and foundational structures.`;
    } else if (i + chunkSize >= total) {
      taskTitle = `Task ${taskIndex}: Output & Summary`;
      taskDesc = `Complete formatted print results and program termination.`;
    } else if (chunk.some((b) => b.blockType === 'FUNCTION')) {
      taskTitle = `Task ${taskIndex}: Algorithmic Calculations`;
      taskDesc = `Build helper methods responsible for data transformation.`;
    } else if (chunk.some((b) => b.blockType === 'INIT')) {
      taskTitle = `Task ${taskIndex}: Input Stream Processing`;
      taskDesc = `Read values from standard input and populate runtime structures.`;
    } else if (chunk.some((b) => b.blockType === 'LOOP')) {
      taskTitle = `Task ${taskIndex}: Iteration & Analysis`;
      taskDesc = `Process elements through control loops and conditions.`;
    }

    tasks.push({
      taskId: `task-${taskIndex}`,
      title: taskTitle,
      description: taskDesc,
      requiredBlockIds,
      penalty: 5,
      order: taskIndex,
    });

    taskIndex++;
  }

  return tasks;
}

module.exports = {
  generateCodeBlocks,
  generateTasksForBlocks,
  detectBlockType,
  generateHint,
};
