import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mindcraft_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const participant = localStorage.getItem('mindcraft_participant');
    if (participant) {
      try {
        const p = JSON.parse(participant);
        if (p?.participantId) {
          config.headers['x-participant-id'] = p.participantId;
        }
      } catch (_) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent multiple simultaneous 401 redirects
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

      // Only invalidate token and redirect if this was an admin route or /auth/me verification failure
      if (url.includes('/auth/me') || (currentPath.startsWith('/admin') && currentPath !== '/admin/login')) {
        localStorage.removeItem('mindcraft_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mindcraft_auth_expired'));

          if (!isRedirecting) {
            isRedirecting = true;
            setTimeout(() => {
              window.location.href = '/admin/login';
              isRedirecting = false;
            }, 300);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Execute code via real backend (Judge0)
 * POST /api/submissions/run
 */
export async function runCode(language, sourceCode, stdin = '') {
  if (!sourceCode || !sourceCode.trim()) {
    return {
      success: false,
      status: 'Compilation Error',
      stdout: '',
      stderr: 'Error: Empty source code. Please assemble code blocks before running.',
      compileOutput: 'Fatal: No code provided to compiler.',
      message: 'Empty source code.',
      executionTime: '0.00s',
      memory: '0.0 MB',
    };
  }

  try {
    const response = await api.post('/submissions/run', {
      language,
      sourceCode,
      stdin: stdin || '',
    });

    const data = response.data;
    return {
      success: !!data.success,
      status: data.status || (data.success ? 'Accepted' : 'Error'),
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      compileOutput: data.compileOutput || '',
      message: data.message || '',
      executionTime: data.executionTime || (data.time ? `${data.time}s` : '0.00s'),
      memory: typeof data.memory === 'number'
        ? `${(data.memory / 1024).toFixed(1)} MB`
        : (data.memory || '0.0 MB'),
      time: data.time || '',
    };
  } catch (error) {
    if (error.response?.data) {
      const errData = error.response.data;
      return {
        success: false,
        status: errData.status || 'Error',
        stdout: errData.stdout || '',
        stderr: errData.stderr || errData.message || 'Execution failed.',
        compileOutput: errData.compileOutput || '',
        message: errData.message || 'Unable to execute code. Please try again.',
        executionTime: errData.time ? `${errData.time}s` : '0.00s',
        memory: typeof errData.memory === 'number'
          ? `${(errData.memory / 1024).toFixed(1)} MB`
          : '0.0 MB',
      };
    }

    return {
      success: false,
      status: 'Error',
      stdout: '',
      stderr: 'Unable to execute code. Please ensure the backend server is running and try again.',
      compileOutput: 'Network connection failed or timed out.',
      message: 'Unable to execute code. Please try again.',
      executionTime: '0.00s',
      memory: '0.0 MB',
    };
  }
}

/**
 * Submit solution for official judging against hidden test cases
 * POST /api/submissions/submit
 */
export async function submitSolution(language, sourceCode, challengeId) {
  if (!sourceCode || !sourceCode.trim()) {
    return {
      success: false,
      status: 'WRONG_ANSWER',
      title: '❌ EMPTY SOLUTION',
      message: 'Cannot submit empty assembly. Please unlock and place code blocks.',
      passedCount: 0,
      totalCount: 3,
      testResults: [],
      executionTime: '0.00s',
      memory: '0.0 MB',
    };
  }

  try {
    const response = await api.post('/submissions/submit', {
      language,
      sourceCode,
      challengeId,
    });

    const data = response.data;
    return {
      success: !!data.success,
      status: data.status || (data.success ? 'ACCEPTED' : 'WRONG_ANSWER'),
      title: data.title || (data.status === 'ACCEPTED' ? '🎉 ACCEPTED' : '❌ WRONG ANSWER'),
      message: data.message || (data.success ? 'All test cases passed successfully!' : 'Some hidden test cases failed.'),
      passedCount: typeof data.passedCount === 'number' ? data.passedCount : 0,
      totalCount: typeof data.totalCount === 'number' ? data.totalCount : 3,
      testResults: Array.isArray(data.testResults) ? data.testResults : [],
      executionTime: data.executionTime || '0.00s',
      memory: data.memory || '0.0 MB',
      compileOutput: data.compileOutput || '',
    };
  } catch (error) {
    if (error.response?.data) {
      const errData = error.response.data;
      return {
        success: false,
        status: errData.status || 'WRONG_ANSWER',
        title: errData.title || '⚠️ SUBMISSION FAILED',
        message: errData.message || 'Unable to evaluate submission. Please try again.',
        passedCount: typeof errData.passedCount === 'number' ? errData.passedCount : 0,
        totalCount: typeof errData.totalCount === 'number' ? errData.totalCount : 3,
        testResults: Array.isArray(errData.testResults) ? errData.testResults : [],
        executionTime: errData.executionTime || '0.00s',
        memory: errData.memory || '0.0 MB',
      };
    }

    return {
      success: false,
      status: 'WRONG_ANSWER',
      title: '⚠️ CONNECTION ERROR',
      message: 'Unable to evaluate submission. Execution server is currently unreachable. Please try again.',
      passedCount: 0,
      totalCount: 3,
      testResults: [],
      executionTime: '0.00s',
      memory: '0.0 MB',
    };
  }
}

export default api;
