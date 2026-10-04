exports.checkIfSessionExpired = (startTime, durationLimitSeconds = 1200) => {
  if (!startTime) return false;
  const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
  return elapsed > durationLimitSeconds;
};

exports.calculateRemainingTime = (startTime, durationLimitSeconds = 1200) => {
  if (!startTime) return durationLimitSeconds;
  const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
  return Math.max(0, Math.round(durationLimitSeconds - elapsed));
};
