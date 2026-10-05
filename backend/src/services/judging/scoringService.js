/**
 * Scoring Calculation Service
 * Calculates challenge scores based on test cases passed and penalties applied.
 */

exports.calculateSubmissionScore = ({
  challenge,
  testCases = [],
  testResults = [],
  revealsCount = 0,
  wrongAttemptsCount = 0,
}) => {
  const blockConfig = challenge.blockConfig || {};
  const totalBasePoints = challenge.points || 100;
  const revealPenaltyRate = blockConfig.revealPenalty !== undefined ? blockConfig.revealPenalty : 5;
  const wrongPenaltyRate = blockConfig.wrongSubmissionPenalty !== undefined ? blockConfig.wrongSubmissionPenalty : 2;
  const allowPartial = blockConfig.partialScoring !== false;

  // 1. Calculate raw test case score
  let rawScore = 0;
  const enabledTestCases = testCases.filter((tc) => tc.isEnabled !== false);
  const totalWeight = enabledTestCases.reduce((sum, tc) => sum + (tc.weight || 20), 0) || totalBasePoints;

  const passedResults = testResults.filter((r) => r.passed);
  const allPassed = enabledTestCases.length > 0 && passedResults.length === enabledTestCases.length;

  if (allowPartial) {
    let earnedWeight = 0;
    testResults.forEach((tr) => {
      if (tr.passed) {
        const tc = enabledTestCases.find((c) => c._id?.toString() === tr.testCaseId?.toString());
        earnedWeight += tc ? (tc.weight || 20) : 20;
      }
    });
    rawScore = Math.round((earnedWeight / totalWeight) * totalBasePoints);
  } else {
    rawScore = allPassed ? totalBasePoints : 0;
  }

  // 2. Penalties
  const revealPenalty = (revealsCount || 0) * revealPenaltyRate;
  const wrongSubmissionPenalty = (wrongAttemptsCount || 0) * wrongPenaltyRate;
  const totalPenalties = revealPenalty + wrongSubmissionPenalty;

  // 3. Final score: 0 initially, negative penalties
  const finalScore = -totalPenalties;

  return {
    rawScore,
    revealPenalty,
    wrongSubmissionPenalty,
    totalPenalties,
    finalScore,
    allPassed,
    passedCount: passedResults.length,
    totalCount: enabledTestCases.length,
  };
};
