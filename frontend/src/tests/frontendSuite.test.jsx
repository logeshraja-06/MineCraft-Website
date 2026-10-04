import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import Leaderboard from '../pages/Leaderboard';
import { ParticipantProvider } from '../context/ParticipantContext';
import { ChallengeProvider } from '../context/ChallengeContext';
import { participantApi } from '../services/participantApi';
import { leaderboardApi } from '../services/leaderboardApi';

vi.mock('../services/participantApi', () => ({
  participantApi: {
    register: vi.fn(),
  },
}));

vi.mock('../services/leaderboardApi', () => ({
  leaderboardApi: {
    getLiveLeaderboard: vi.fn(),
    getLeaderboard: vi.fn(),
    getMyRank: vi.fn(),
  },
}));

vi.mock('../services/challengeApi', () => ({
  challengeApi: {
    getAll: vi.fn().mockResolvedValue({ success: true, challenges: [] }),
    getById: vi.fn().mockResolvedValue({ success: true, challenge: null }),
  },
}));

describe('Frontend Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Register page validates inputs and invokes participantApi.register', async () => {
    participantApi.register.mockResolvedValueOnce({
      success: true,
      token: 'mock-jwt-token',
      user: {
        _id: 'user123',
        name: 'Jane Doe',
        participantId: 'MC-JANE',
        email: 'jane@college.edu',
        college: 'Tech University',
        department: 'Computer Science',
      },
    });

    render(
      <BrowserRouter>
        <ParticipantProvider>
          <Register />
        </ParticipantProvider>
      </BrowserRouter>
    );

    // Verify neutral placeholders (no "Anthony")
    const nameInput = screen.getByPlaceholderText(/full name/i);
    const idInput = screen.getByPlaceholderText(/mc-101/i);
    const emailInput = screen.getByPlaceholderText(/you@college.edu/i);
    const collegeInput = screen.getByPlaceholderText(/university name/i);
    const deptInput = screen.getByPlaceholderText(/cse/i);

    expect(nameInput).toBeDefined();
    expect(screen.queryByText(/anthony/i)).toBeNull();

    // Fill out registration form
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(idInput, { target: { value: 'MC-JANE' } });
    fireEvent.change(emailInput, { target: { value: 'jane@college.edu' } });
    fireEvent.change(collegeInput, { target: { value: 'Tech University' } });
    fireEvent.change(deptInput, { target: { value: 'Computer Science' } });

    const submitBtn = screen.getByRole('button', { name: /continue to rules/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(participantApi.register).toHaveBeenCalledWith({
        name: 'Jane Doe',
        participantId: 'MC-JANE',
        email: 'jane@college.edu',
        college: 'Tech University',
        department: 'Computer Science',
      });
    });
  });

  it('2. Never renders placeholder name "Anthony" or "MC-DEMO" anywhere by default', () => {
    render(
      <BrowserRouter>
        <ParticipantProvider>
          <Register />
        </ParticipantProvider>
      </BrowserRouter>
    );

    expect(document.body.textContent).not.toContain('Anthony');
    expect(document.body.textContent).not.toContain('MC-DEMO');
  });

  it('3. Leaderboard renders clear empty state when no data exists', async () => {
    leaderboardApi.getLiveLeaderboard.mockResolvedValueOnce({
      success: true,
      rankings: [],
    });
    leaderboardApi.getMyRank.mockResolvedValueOnce({
      success: true,
      rank: null,
    });

    render(
      <BrowserRouter>
        <ParticipantProvider>
          <ChallengeProvider>
            <Leaderboard />
          </ChallengeProvider>
        </ParticipantProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no data yet/i)).toBeDefined();
    });
  });
});
