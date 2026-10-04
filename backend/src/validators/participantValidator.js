exports.validateParticipantRegister = (body) => {
  const errors = [];
  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('Full name is required');
  }
  if (!body?.participantId || typeof body.participantId !== 'string' || !body.participantId.trim()) {
    errors.push('Participant ID is required');
  }
  if (!body?.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push('Email address is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('Invalid email address format');
  }
  if (!body?.college || typeof body.college !== 'string' || !body.college.trim()) {
    errors.push('College name is required');
  }
  if (!body?.department || typeof body.department !== 'string' || !body.department.trim()) {
    errors.push('Department is required');
  }
  return errors;
};
