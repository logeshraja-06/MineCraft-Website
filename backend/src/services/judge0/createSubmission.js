const judge0Client = require('./judge0Client');
const { getLanguageId } = require('./languageMap');

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 500;

exports.createSubmission = async ({ sourceCode, language, stdin = '', expectedOutput = '' }) => {
  const payload = {
    source_code: Buffer.from(sourceCode || '').toString('base64'),
    language_id: getLanguageId(language),
    stdin: Buffer.from(stdin || '').toString('base64'),
    expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : null,
  };

  const response = await judge0Client.post('/submissions?base64_encoded=true&wait=true', payload);
  let result = response.data;

  // If Judge0 returns status 1 (In Queue) or 2 (Processing), poll until complete or timeout
  if (result?.token && (result.status?.id === 1 || result.status?.id === 2)) {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      try {
        const pollRes = await judge0Client.get(`/submissions/${result.token}?base64_encoded=true`);
        result = pollRes.data;
        if (result.status?.id && result.status.id >= 3) {
          break;
        }
      } catch (pollErr) {
        // If polling fails once, continue until max attempts
      }
    }
  }

  // If still queued/processing after max attempts, synthesize a timeout error
  if (result.status?.id === 1 || result.status?.id === 2) {
    result.status = { id: 5, description: 'Time Limit Exceeded' };
    result.stderr = Buffer.from('Judge0 compilation/execution timed out in queue.').toString('base64');
  }

  return result;
};

