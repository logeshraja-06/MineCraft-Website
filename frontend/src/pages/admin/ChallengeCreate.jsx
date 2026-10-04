import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  Code2,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  Play,
  Layers,
  ListChecks,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import MultiLanguageBlocksEditor from '../../components/challenge/MultiLanguageBlocksEditor';
import TaskManager from '../../components/challenge/TaskManager';

export default function ChallengeCreate() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState('python');

  // Section 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    title: 'Two Number Adder',
    slug: 'two-number-adder',
    category: 'Algorithms',
    difficulty: 'Easy',
    points: 100,
    description: 'Read two numbers A and B from standard input and output their sum.',
    instructions: 'Unlock the code blocks sequentially by completing the progressive tasks, then arrange them in the proper execution sequence.',
    inputFormat: 'Two space-separated integers A and B',
    outputFormat: 'Single integer showing A + B',
    constraints: '-10^5 <= A, B <= 10^5',
    supportedLanguages: ['python', 'java', 'cpp', 'c'],
    timeLimitSeconds: 1200,
    maxAttempts: 5,
    status: 'Published',
    sequenceOrder: '',
  });

  // Section 2: Multi-Language Blocks Config (All languages start with equal block counts: 3)
  const [languageConfigs, setLanguageConfigs] = useState([
    {
      language: 'python',
      languageName: 'Python 3',
      blocks: [
        { blockId: 'py-f1', code: 'import sys\ninput = sys.stdin.read', role: 'MAIN_WRAPPER', order: 1 },
        { blockId: 'py-f2', code: 'a, b = map(int, input().split())', role: 'INPUT', order: 2 },
        { blockId: 'py-f3', code: 'print(a + b)', role: 'OUTPUT', order: 3 },
      ],
      revealOrder: ['py-f1', 'py-f2', 'py-f3'],
      acceptedOrders: [],
    },
    {
      language: 'java',
      languageName: 'Java 17',
      blocks: [
        { blockId: 'java-f1', code: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {', role: 'MAIN_WRAPPER', order: 1 },
        { blockId: 'java-f2', code: '        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();', role: 'INPUT', order: 2 },
        { blockId: 'java-f3', code: '        System.out.println(a + b);\n    }\n}', role: 'OUTPUT', order: 3 },
      ],
      revealOrder: ['java-f1', 'java-f2', 'java-f3'],
      acceptedOrders: [],
    },
    {
      language: 'cpp',
      languageName: 'C++ 17',
      blocks: [
        { blockId: 'cpp-f1', code: '#include <iostream>\nusing namespace std;\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
        { blockId: 'cpp-f2', code: '    int a, b;\n    if (cin >> a >> b) {', role: 'INPUT', order: 2 },
        { blockId: 'cpp-f3', code: '        cout << a + b << endl;\n    }\n    return 0;\n}', role: 'OUTPUT', order: 3 },
      ],
      revealOrder: ['cpp-f1', 'cpp-f2', 'cpp-f3'],
      acceptedOrders: [],
    },
    {
      language: 'c',
      languageName: 'C (GCC)',
      blocks: [
        { blockId: 'c-f1', code: '#include <stdio.h>\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
        { blockId: 'c-f2', code: '    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {', role: 'INPUT', order: 2 },
        { blockId: 'c-f3', code: '        printf("%d\\n", a + b);\n    }\n    return 0;\n}', role: 'OUTPUT', order: 3 },
      ],
      revealOrder: ['c-f1', 'c-f2', 'c-f3'],
      acceptedOrders: [],
    },
  ]);

  // Section 3: Progressive Tasks (3 tasks for 3 blocks, 1:1 mapping)
  const [tasks, setTasks] = useState([
    {
      taskId: 'task-1',
      title: 'Task 1: Program Entry & Initialization',
      description: 'Solve this task to unlock the initial boilerplate and import statements',
      order: 1,
      penalty: 20,
      cooldownSeconds: 3,
      rewards: {
        python: 'py-f1',
        java: 'java-f1',
        cpp: 'cpp-f1',
        c: 'c-f1',
      },
      quizPool: [
        {
          quizId: 'q1-1',
          type: 'MCQ',
          prompt: 'Which block establishes program setup or I/O imports?',
          options: ['Top-level module import / class definition', 'Direct print output', 'Variable subtraction', 'Dead code loop'],
          answer: 0,
          explain: 'Imports and class wrappers form the outer skeleton of the code.',
          concept: 'structure',
        },
      ],
    },
    {
      taskId: 'task-2',
      title: 'Task 2: Read Input Stream',
      description: 'Solve this task to unlock the input parsing block',
      order: 2,
      penalty: 20,
      cooldownSeconds: 3,
      rewards: {
        python: 'py-f2',
        java: 'java-f2',
        cpp: 'cpp-f2',
        c: 'c-f2',
      },
      quizPool: [
        {
          quizId: 'q2-1',
          type: 'MCQ',
          prompt: 'What variables are needed to store the two incoming integers?',
          options: ['Two integer variables (a and b)', 'A string array only', 'A floating point matrix', 'No variables'],
          answer: 0,
          explain: 'Two numeric variables hold the operands read from standard input.',
          concept: 'input',
        },
      ],
    },
    {
      taskId: 'task-3',
      title: 'Task 3: Compute & Display Sum',
      description: 'Solve this task to unlock the output calculation block',
      order: 3,
      penalty: 20,
      cooldownSeconds: 3,
      rewards: {
        python: 'py-f3',
        java: 'java-f3',
        cpp: 'cpp-f3',
        c: 'c-f3',
      },
      quizPool: [
        {
          quizId: 'q3-1',
          type: 'MCQ',
          prompt: 'Which operator calculates the arithmetic sum of numbers A and B?',
          options: ['+', '*', '-', '/'],
          answer: 0,
          explain: 'The plus operator (+) performs addition.',
          concept: 'operators',
        },
      ],
    },
  ]);

  // Section 4: Test Cases
  const [testCases, setTestCases] = useState([
    { input: '10 20', expectedOutput: '30', isHidden: false, weight: 20, timeoutSeconds: 5, isEnabled: true, description: 'Basic addition' },
    { input: '5 7', expectedOutput: '12', isHidden: false, weight: 20, timeoutSeconds: 5, isEnabled: true, description: 'Small numbers' },
    { input: '100 -50', expectedOutput: '50', isHidden: true, weight: 20, timeoutSeconds: 5, isEnabled: true, description: 'Negative operand' },
    { input: '-25 -75', expectedOutput: '-100', isHidden: true, weight: 20, timeoutSeconds: 5, isEnabled: true, description: 'Double negatives' },
    { input: '123456 654321', expectedOutput: '777777', isHidden: true, weight: 20, timeoutSeconds: 5, isEnabled: true, description: 'Large integers' },
  ]);

  const handleTitleChange = (val) => {
    setBasicInfo((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : prev.slug,
    }));
  };

  // Test Case manipulations
  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: '', expectedOutput: '', isHidden: false, weight: 20, timeoutSeconds: 5, isEnabled: true, description: '' },
    ]);
  };

  const updateTestCase = (idx, field, value) => {
    const updated = [...testCases];
    updated[idx][field] = value;
    setTestCases(updated);
  };

  const duplicateTestCase = (idx) => {
    const target = testCases[idx];
    setTestCases([...testCases, { ...target, description: `${target.description || 'Test'} (Copy)` }]);
  };

  const deleteTestCase = (idx) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const getRewardForLang = (task, lang) => {
    if (!task || !task.rewards) return '';
    if (typeof task.rewards.get === 'function') {
      return task.rewards.get(lang) || '';
    }
    return task.rewards[lang] || '';
  };

  // Validate and submit challenge
  const handleSaveChallenge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Basic Information Validation
    if (!basicInfo.title.trim()) {
      setToast({ message: 'Challenge Title is required', type: 'error' });
      return;
    }
    if (!basicInfo.slug.trim()) {
      setToast({ message: 'Challenge Slug is required', type: 'error' });
      return;
    }

    // 2. Language Configs Validation
    if (!languageConfigs || languageConfigs.length === 0) {
      setToast({ message: 'At least one programming language configuration is required', type: 'error' });
      return;
    }

    // 3. EQUAL BLOCKS CHECK across all programming languages
    const blockCounts = languageConfigs.map((lc) => lc.blocks?.length || 0);
    const targetBlockCount = blockCounts[0];

    if (targetBlockCount === 0) {
      setToast({ message: 'Each language must have at least 1 code block', type: 'error' });
      return;
    }

    const hasMismatch = blockCounts.some((cnt) => cnt !== targetBlockCount);
    if (hasMismatch) {
      const breakdown = languageConfigs
        .map((lc) => `${lc.languageName || lc.language}: ${lc.blocks?.length || 0} blocks`)
        .join(', ');
      setToast({
        message: `All programming languages must have the exact same number of blocks! (${breakdown})`,
        type: 'error',
      });
      return;
    }

    // 4. TASK COUNT CHECK (All blocks must have a task: tasks.length === targetBlockCount)
    if (tasks.length !== targetBlockCount) {
      setToast({
        message: `All ${targetBlockCount} code blocks must have a task! Currently configured: ${tasks.length} tasks. Please configure exactly ${targetBlockCount} tasks.`,
        type: 'error',
      });
      return;
    }

    // 5. 1:1 BLOCK ASSIGNMENT MUTUAL EXCLUSION CHECK
    for (const lc of languageConfigs) {
      const assignedBlockIds = new Set();
      for (const t of tasks) {
        const rewardBlockId = getRewardForLang(t, lc.language);
        if (!rewardBlockId) {
          setToast({
            message: `Task "${t.title}" is missing an unlocked block for ${lc.languageName || lc.language}. Every task must unlock one block!`,
            type: 'error',
          });
          return;
        }
        if (assignedBlockIds.has(rewardBlockId)) {
          setToast({
            message: `Block "${rewardBlockId}" in ${lc.languageName || lc.language} is assigned to multiple tasks! Each block must have its own unique task.`,
            type: 'error',
          });
          return;
        }
        assignedBlockIds.add(rewardBlockId);
      }

      // Check if any block was omitted
      for (const blk of lc.blocks || []) {
        if (!assignedBlockIds.has(blk.blockId)) {
          setToast({
            message: `Block #${blk.order} [${blk.blockId}] in ${lc.languageName || lc.language} has no task assigned to it! All blocks must have a task.`,
            type: 'error',
          });
          return;
        }
      }
    }

    // 6. Test Cases Validation
    if (!testCases || testCases.length === 0) {
      setToast({ message: 'Please configure at least 1 test case', type: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      const primaryLang = languageConfigs[0];
      const payload = {
        ...basicInfo,
        sequenceOrder: basicInfo.sequenceOrder ? Number(basicInfo.sequenceOrder) : null,
        supportedLanguages: languageConfigs.map((lc) => lc.language),
        sourceLanguage: primaryLang.language,
        sourceCode: primaryLang.blocks.map((b) => b.code).join('\n'),
        languageConfigs,
        tasks,
        testCases,
        blockConfig: {
          totalBlocks: targetBlockCount,
          revealMode: 'task',
          initialVisibleCount: 0,
          revealPenalty: 0,
          wrongSubmissionPenalty: 0,
          maxReveals: targetBlockCount,
        },
        blocks: primaryLang.blocks.map((b, i) => ({
          blockId: b.blockId,
          codeSnippet: b.code,
          originalOrder: b.order || i + 1,
          displayOrder: b.order || i + 1,
          orderHint: b.order || i + 1,
          blockType: b.role || 'LOGIC',
          language: primaryLang.language,
        })),
      };

      const res = await adminApi.createChallenge(payload);
      if (res.success) {
        setToast({ message: 'Challenge created successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/challenges'), 1200);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create challenge', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const previewConfig = languageConfigs.find((lc) => lc.language === previewLanguage) || languageConfigs[0];

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/challenges" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-wider flex items-center gap-2">
                <Code2 className="w-6 h-6 text-orange-400" />
                CREATE CODING CHALLENGE
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Progressive Task Unlocking & Multi-Language Code Assembly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Eye}
              type="button"
              onClick={() => setIsPreviewOpen(true)}
            >
              Preview Challenge
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={handleSaveChallenge}
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Save & Publish Challenge'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveChallenge} className="space-y-8">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-orange-500/40 text-orange-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Section 1 — Basic Problem Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Challenge Title *</label>
                <input
                  type="text"
                  value={basicInfo.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Two Number Adder"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Slug (URL Identifier) *</label>
                <input
                  type="text"
                  value={basicInfo.slug}
                  onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                  placeholder="e.g. two-number-adder"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-cyan-300 font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Category</label>
                <input
                  type="text"
                  value={basicInfo.category}
                  onChange={(e) => setBasicInfo({ ...basicInfo, category: e.target.value })}
                  placeholder="e.g. Algorithms, Math"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Difficulty</label>
                  <select
                    value={basicInfo.difficulty}
                    onChange={(e) => setBasicInfo({ ...basicInfo, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Sequence (Roadmap)</label>
                  <select
                    value={basicInfo.sequenceOrder || ''}
                    onChange={(e) => setBasicInfo({ ...basicInfo, sequenceOrder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="">None (Draft / Hidden)</option>
                    <option value="1">1 // Easy (First)</option>
                    <option value="2">2 // Medium (Second)</option>
                    <option value="3">3 // Hard (Final)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Points</label>
                  <input
                    type="number"
                    value={basicInfo.points}
                    onChange={(e) => setBasicInfo({ ...basicInfo, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-emerald-400 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Status</label>
                  <select
                    value={basicInfo.status}
                    onChange={(e) => setBasicInfo({ ...basicInfo, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-600 font-bold">Problem Description *</label>
              <textarea
                rows={3}
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                placeholder="Clear explanation of the problem statement..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-600 font-bold">Contestant Instructions</label>
              <textarea
                rows={2}
                value={basicInfo.instructions}
                onChange={(e) => setBasicInfo({ ...basicInfo, instructions: e.target.value })}
                placeholder="Assembly hints or instructions for the participant..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Input Format</label>
                <input
                  type="text"
                  value={basicInfo.inputFormat}
                  onChange={(e) => setBasicInfo({ ...basicInfo, inputFormat: e.target.value })}
                  placeholder="e.g. Two space-separated integers A and B"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Output Format</label>
                <input
                  type="text"
                  value={basicInfo.outputFormat}
                  onChange={(e) => setBasicInfo({ ...basicInfo, outputFormat: e.target.value })}
                  placeholder="e.g. Single integer showing A + B"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Constraints</label>
                <input
                  type="text"
                  value={basicInfo.constraints}
                  onChange={(e) => setBasicInfo({ ...basicInfo, constraints: e.target.value })}
                  placeholder="e.g. -10^5 <= A, B <= 10^5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Time Limit (Seconds)</label>
                <input
                  type="number"
                  value={basicInfo.timeLimitSeconds}
                  onChange={(e) => setBasicInfo({ ...basicInfo, timeLimitSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-amber-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Max Execution Attempts</label>
                <input
                  type="number"
                  value={basicInfo.maxAttempts}
                  onChange={(e) => setBasicInfo({ ...basicInfo, maxAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: MULTI-LANGUAGE CODE BLOCKS */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-orange-500/40 text-orange-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Section 2 — Multi-Language Code Blocks
                </h2>
                <p className="text-[11px] text-orange-400">
                  Every programming language MUST have the exact same number of blocks. Adding or deleting a block synchronizes across all languages.
                </p>
              </div>
            </div>
            <MultiLanguageBlocksEditor
              languageConfigs={languageConfigs}
              onChange={setLanguageConfigs}
            />
          </div>

          {/* SECTION 3: PROGRESSIVE TASKS & QUIZZES */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Section 3 — Progressive Tasks & Quizzes (1 Task per Block)
                </h2>
                <p className="text-[11px] text-amber-400">
                  Solving each task unlocks exactly one code block. Every code block must have its own task, and assigned blocks cannot be reused across tasks.
                </p>
              </div>
            </div>
            <TaskManager
              tasks={tasks}
              languageConfigs={languageConfigs}
              onChange={setTasks}
            />
          </div>

          {/* SECTION 4: TEST CASE MANAGEMENT */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Section 4 — Test Cases ({testCases.length} tests)
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                type="button"
                onClick={addTestCase}
              >
                Add Test Case
              </Button>
            </div>

            <div className="space-y-4">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-orange-400">Test Case #{idx + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => updateTestCase(idx, 'isHidden', e.target.checked)}
                          className="rounded bg-white border-slate-300"
                        />
                        <span className={tc.isHidden ? 'text-amber-400 font-bold' : 'text-slate-600'}>
                          {tc.isHidden ? 'Hidden Test Case' : 'Visible Sample'}
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isEnabled}
                          onChange={(e) => updateTestCase(idx, 'isEnabled', e.target.checked)}
                          className="rounded bg-white border-slate-300"
                        />
                        <span className="text-slate-600">Enabled</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Weight:</span>
                        <input
                          type="number"
                          value={tc.weight || 20}
                          onChange={(e) => updateTestCase(idx, 'weight', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-center text-emerald-400 font-bold"
                        />
                        <span className="text-slate-500">pts</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => duplicateTestCase(idx)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded"
                        title="Duplicate"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTestCase(idx)}
                        className="p-1 hover:bg-slate-100 text-rose-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono">Standard Input (stdin)</label>
                      <textarea
                        rows={2}
                        value={tc.input}
                        onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                        placeholder="e.g. 10 20"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono">Expected Output (stdout)</label>
                      <textarea
                        rows={2}
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-cyan-300"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Link to="/admin/challenges">
              <Button variant="outline" size="sm" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              icon={Eye}
              type="button"
              onClick={() => setIsPreviewOpen(true)}
            >
              Preview Challenge
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating Challenge...' : 'Save & Publish Challenge'}
            </Button>
          </div>
        </form>

        {/* PARTICIPANT PREVIEW MODAL */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    PARTICIPANT PREVIEW: {basicInfo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-3 text-orange-400 font-bold">
                  <span>{basicInfo.category}</span>
                  <span>•</span>
                  <span>{basicInfo.points} PTS</span>
                  <span>•</span>
                  <span className="text-amber-400">{basicInfo.difficulty}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {basicInfo.description}
                </p>
                {basicInfo.instructions && (
                  <p className="text-slate-600 italic text-[11px] pt-1">
                    Instructions: {basicInfo.instructions}
                  </p>
                )}
              </div>

              {/* Sequential Tasks Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4" /> Sequential Hunt Tasks ({tasks.length} tasks)
                </h4>
                <div className="space-y-2">
                  {tasks.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">#{t.order} {t.title}</span>
                        <span className="text-slate-600 text-[11px]">{t.description}</span>
                      </div>
                      <span className="text-amber-400 text-[11px] font-bold">
                        Unlocks Block #{t.order}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Language Blocks Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Code Blocks Preview ({previewConfig?.blocks?.length || 0} fragments)
                  </h4>
                  <div className="flex gap-2">
                    {languageConfigs.map((lc) => (
                      <button
                        key={lc.language}
                        onClick={() => setPreviewLanguage(lc.language)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          previewLanguage === lc.language
                            ? 'bg-orange-500/20 text-cyan-300 border border-orange-500/40'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {lc.languageName || lc.language}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {(previewConfig?.blocks || []).map((b, idx) => (
                    <div key={idx} className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-orange-400">Block #{b.order} [{b.blockId}]</span>
                        <span className="text-emerald-400 font-bold">{b.role}</span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-800 bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {b.code}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Cases summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase">
                  Test Cases Preview ({testCases.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700">Test #{idx + 1}</span>
                        <span className={tc.isHidden ? 'text-amber-400' : 'text-emerald-400'}>
                          {tc.isHidden ? 'Hidden Test' : 'Sample Test'} ({tc.weight || 20} pts)
                        </span>
                      </div>
                      <div className="text-slate-600">Input: <code className="text-slate-900">{tc.input || '(empty)'}</code></div>
                      <div className="text-slate-600">Output: <code className="text-cyan-300">{tc.expectedOutput}</code></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
