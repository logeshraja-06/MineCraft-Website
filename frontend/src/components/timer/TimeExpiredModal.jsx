import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Hourglass } from 'lucide-react';

export default function TimeExpiredModal({ isOpen, onAcknowledge }) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="TIME EXPIRED // AUTO-SUBMITTED">
      <div className="text-center space-y-4 py-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
          <Hourglass className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold font-mono text-white">Time Limit Reached</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            The countdown has elapsed. Your solution has been automatically submitted and evaluated.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="danger" onClick={onAcknowledge} className="w-full">
            View Standings & Results
          </Button>
        </div>
      </div>
    </Modal>
  );
}
