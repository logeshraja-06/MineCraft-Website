import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function ChallengeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState('python');

  // Section 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    slug: '',
    category: '',
    difficulty: 'Medium',
    points: 100,
    description: '',
    instructions: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    supportedLanguages: ['python', 'java', 'cpp', 'c'],
    timeLimitSeconds: 1200,
    maxAttempts: 5,
    status: 'Published',
    sequenceOrder: '',
  });

  // Section 2: Multi-Language Code Blocks
  const [languageConfigs, setLanguageConfigs] = useState([]);

  // Section 3: Progressive Tasks
  const [tasks, setTasks] = useState([]);

  // Section 4: Test Cases
  const [testCases, setTestCases] = useState([]);

  useEffect(() => {
    async function loadChallenge() {
      try {
        setLoading(true);
        const res = await adminApi.getChallenge(id);
        if (res.success && res.challenge) {
          const c = res.challenge;
          setBasicInfo({
            title: c.title || '',
            slug: c.slug || '',
            category: c.category || 'Algorithms',
            difficulty: c.difficulty || 'Medium',
            points: c.points || 100,
            description: c.description || '',
            instructions: c.instructions || '',
            inputFormat: c.inputFormat || '',
            outputFormat: c.outputFormat || '',
            constraints: c.constraints || '',
            supportedLanguages: c.supportedLanguages || ['python', 'java', 'cpp', 'c'],
            timeLimitSeconds: c.timeLimitSeconds || 1200,
            maxAttempts: c.maxAttempts || 5,
            status: c.status || 'Published',
            sequenceOrder: c.sequenceOrder !== undefined && c.sequenceOrder !== null ? String(c.sequenceOrder) : '',
          });

          // Multi-language configs
          if (Array.isArray(c.languageConfigs) && c.languageConfigs.length > 0) {
            setLanguageConfigs(c.languageConfigs);
            setPreviewLanguage(c.languageConfigs[0]?.language || 'python');
          } else if (Array.isArray(c.blocks) && c.blocks.length > 0) {
            // Auto-scaffold legacy single-language blocks into languageConfigs
            const lang = c.sourceLanguage || 'python';
            setLanguageConfigs([
              {
                language: lang,
                languageName: lang.toUpperCase(),
                blocks: c.blocks.map((b, i) => ({
                  blockId: b.blockId || `${lang}-f${i + 1}`,
                  code: b.codeSnippet || b.code || '',
                  role: b.blockType || 'LOGIC',
                  order: b.originalOrder || i + 1,
                })),
                revealOrder: c.blocks.map((b) => b.blockId),
                acceptedOrders: [],
              },
            ]);
            setPreviewLanguage(lang);
          } else {
            // Minimal fallback
            setLanguageConfigs([
              {
                language: 'python',
                languageName: 'Python 3',
                blocks: [
                  { blockId: 'py-f1', code: '# Block 1', role: 'INPUT', order: 1 },
                  { blockId: 'py-f2', code: '# Block 2', role: 'OUTPUT', order: 2 },
                ],
                revealOrder: ['py-f1', 'py-f2'],
                acceptedOrders: [],
              },
            ]);
          }

          // Progressive Tasks
          if (Array.isArray(c.tasks)) {
            setTasks(c.tasks);
          }

          // Test Cases
          if (Array.isArray(c.testCases)) {
            setTestCases(c.testCases);
          }
        }
      } catch (err) {
        setToast({ message: 'Failed to load challenge details', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadChallenge();
  }, [id]);

  // Test Case helpers
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

  // Submit challenge updates with strict validations
  const handleUpdateChallenge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Basic validation
    if (!basicInfo.title.trim()) {
      setToast({ message: 'Challenge Title is required', type: 'error' });
      return;
    }
    if (!basicInfo.slug.trim()) {
      setToast({ message: 'Slug is required', type: 'error' });
      return;
    }

    // 2. Language Configs validation
    if (!languageConfigs || languageConfigs.length === 0) {
      setToast({ message: 'At least one programming language configuration is required', type: 'error' });
      return;
    }

    // 3. EQUAL BLOCK COUNT VALIDATION ACROSS ALL PROGRAMMING LANGUAGES
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

    // 4. TASK COUNT VALIDATION (All blocks must have a task: tasks.length === targetBlockCount)
    if (tasks.length !== targetBlockCount) {
      setToast({
        message: `All ${targetBlockCount} code blocks must have a task! Currently configured: ${tasks.length} tasks. Please configure exactly ${targetBlockCount} tasks.`,
        type: 'error',
      });
      return;
    }

    // 5. 1:1 MUTUAL EXCLUSIVE BLOCK ASSIGNMENT VALIDATION
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

      // Check if any block was left unassigned
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

    // 6. Test cases validation
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

      const res = await adminApi.updateChallenge(id, payload);
      if (res.success) {
        setToast({ message: 'Challenge updated successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update challenge', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete challenge handler
  const handleDeleteChallenge = async () => {
    try {
      setDeleting(true);
      const res = await adminApi.deleteChallenge(id);
      if (res.success) {
        setToast({ message: 'Challenge deleted successfully', type: 'success' });
        setTimeout(() => navigate('/admin/challenges'), 1000);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete challenge', type: 'error' });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-600">Loading challenge configuration...</p>
          </div>
        </main>
      </div>
    );
  }

  const previewConfig = languageConfigs.find((lc) => lc.language === previewLanguage) || languageConfigs[0];

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/challenges"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-wider flex items-center gap-2">
                <Code2 className="w-6 h-6 text-orange-400" />
                EDIT CHALLENGE: {basicInfo.title}
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
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Delete Challenge
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={handleUpdateChallenge}
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Updates'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleUpdateChallenge} className="space-y-8">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-orange-500/40 text-orange-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Section 1 — Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Challenge Title</label>
                <input
                  type="text"
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Slug</label>
                <input
                  type="text"
                  value={basicInfo.slug}
                  onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-cyan-300 font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Category</label>
                <input
                  type="text"
                  value={basicInfo.category}
                  onChange={(e) => setBasicInfo({ ...basicInfo, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Difficulty</label>
                  <select
                    value={basicInfo.difficulty}
                    onChange={(e) => setBasicInfo({ ...basicInfo, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-emerald-400 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Status</label>
                  <select
                    value={basicInfo.status}
                    onChange={(e) => setBasicInfo({ ...basicInfo, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-cyan-300 font-bold"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-600 font-bold">Problem Description</label>
              <textarea
                rows={3}
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-600 font-bold">Instructions</label>
              <textarea
                rows={2}
                value={basicInfo.instructions}
                onChange={(e) => setBasicInfo({ ...basicInfo, instructions: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Input Format</label>
                <input
                  type="text"
                  value={basicInfo.inputFormat}
                  onChange={(e) => setBasicInfo({ ...basicInfo, inputFormat: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Output Format</label>
                <input
                  type="text"
                  value={basicInfo.outputFormat}
                  onChange={(e) => setBasicInfo({ ...basicInfo, outputFormat: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Constraints</label>
                <input
                  type="text"
                  value={basicInfo.constraints}
                  onChange={(e) => setBasicInfo({ ...basicInfo, constraints: e.target.value })}
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

          {/* SECTION 4: TEST CASES */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Section 4 — Test Cases Manager ({testCases.length})
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

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
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
                          {tc.isHidden ? 'Hidden Test' : 'Visible Sample'}
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isEnabled !== false}
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
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono">Expected Output (stdout)</label>
                      <textarea
                        rows={2}
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
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
              {submitting ? 'Saving Changes...' : 'Save Updates'}
            </Button>
          </div>
        </form>

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Confirm Challenge Deletion
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{basicInfo.title}"</strong>? This will remove all associated blocks, tasks, and test cases.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteChallenge}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Challenge'}
                </button>
              </div>
            </div>
          </div>
        )}

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
