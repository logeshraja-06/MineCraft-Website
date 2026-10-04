/**
 * Export results of an event session to CSV format from MongoDB.
 * Usage: node scripts/export-results.js [sessionCode]
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../backend/src/config/env');
const { getLeaderboardData } = require('../backend/src/services/leaderboard/leaderboardService');

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Prevent formula injection in spreadsheets
  if (/^[=+@-]$/.test(str[0]) || /^[=+@-]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

async function exportToCSV(sessionCode = 'ALL') {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    const leaderboard = await getLeaderboardData();

    const headers = [
      'Rank',
      'Name',
      'Participant ID',
      'College',
      'Department',
      'Email',
      'Challenges Solved',
      'Score',
      'Total Time',
      'Last Submission Time',
    ];

    const rows = [headers.map(escapeCsvField).join(',')];

    leaderboard.forEach((r, idx) => {
      rows.push([
        escapeCsvField(r.rank || idx + 1),
        escapeCsvField(r.name || ''),
        escapeCsvField(r.participantId || ''),
        escapeCsvField(r.college || ''),
        escapeCsvField(r.department || ''),
        escapeCsvField(r.email || ''),
        escapeCsvField(r.challengesSolved ?? 0),
        escapeCsvField(r.score ?? r.totalScore ?? 0),
        escapeCsvField(r.timeFormatted || `${r.totalTimeSeconds || 0}s`),
        escapeCsvField(r.lastSubmissionTime || r.lastActive || ''),
      ].join(','));
    });

    const outPath = path.join(__dirname, `results_${sessionCode}.csv`);
    fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
    console.log(`[Export] Successfully exported ${leaderboard.length} real contestant results to ${outPath}`);

    return outPath;
  } catch (err) {
    console.error('[Export Error]', err);
    throw err;
  } finally {
    if (require.main === module && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  exportToCSV(process.argv[2] || 'MINDCRAFT-2026');
}

module.exports = exportToCSV;
