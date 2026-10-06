exports.validateSubmission = (body) => {
  const errors = [];
  const isAutoSubmit = Boolean(body?.isAutoSubmit);
  const code = body?.sourceCode !== undefined ? body.sourceCode : body?.code;
  if (!isAutoSubmit && (!code || typeof code !== 'string' || !code.trim())) {
    errors.push('Code payload is required');
  }
  if (!body?.language || typeof body.language !== 'string') {
    errors.push('Language is required');
  }
  if (!body?.challengeId) {
    errors.push('Challenge ID is required');
  }
  return errors;
};

exports.validateRunCode = (body) => {
  const errors = [];
  const code = body?.sourceCode || body?.code;
  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Code payload is required');
  }
  if (!body?.language || typeof body.language !== 'string') {
    errors.push('Language is required');
  }
  return errors;
};
