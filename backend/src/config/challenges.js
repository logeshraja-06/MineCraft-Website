const CHALLENGE_TEST_CASES = {
  'ch-05': [
    { id: 1, input: '10 25 15\n', expectedOutput: '25' },
    { id: 2, input: '50 12 3\n', expectedOutput: '50' },
    { id: 3, input: '7 9 99\n', expectedOutput: '99' },
    { id: 4, input: '-15 -5 -30\n', expectedOutput: '-5' },
    { id: 5, input: '42 42 42\n', expectedOutput: '42' },
    { id: 6, input: '100 100 50\n', expectedOutput: '100' },
    { id: 7, input: '15 200 200\n', expectedOutput: '200' },
    { id: 8, input: '0 0 -1\n', expectedOutput: '0' },
  ],
  'ch-06': [
    { id: 1, input: '1\n', expectedOutput: '0' },
    { id: 2, input: '2\n', expectedOutput: '1' },
    { id: 3, input: '10\n', expectedOutput: '4' },
    { id: 4, input: '20\n', expectedOutput: '8' },
    { id: 5, input: '97\n', expectedOutput: '25' },
    { id: 6, input: '100\n', expectedOutput: '25' },
    { id: 7, input: '1000\n', expectedOutput: '168' },
    { id: 8, input: '10000\n', expectedOutput: '1229' },
  ],
  'ch-07': [
    { id: 1, input: '1\n42\n', expectedOutput: '1' },
    { id: 2, input: '5\n7 7 7 7 7\n', expectedOutput: '1' },
    { id: 3, input: '5\n10 9 8 7 6\n', expectedOutput: '1' },
    { id: 4, input: '5\n1 2 3 4 5\n', expectedOutput: '5' },
    { id: 5, input: '6\n5 2 8 6 3 6\n', expectedOutput: '3' },
    { id: 6, input: '8\n10 22 9 33 21 50 41 60\n', expectedOutput: '5' },
    { id: 7, input: '6\n-5 -2 -1 0 4 2\n', expectedOutput: '5' },
    { id: 8, input: '7\n1 3 2 4 3 5 4\n', expectedOutput: '4' },
    { id: 9, input: '10\n0 8 4 12 2 10 6 14 1 9\n', expectedOutput: '4' },
  ],
};

module.exports = {
  CHALLENGE_TEST_CASES,
  getHiddenTests: (challengeId) => CHALLENGE_TEST_CASES[challengeId] || [],
};
