import React from 'react';
import Button from '../common/Button';
import { Send } from 'lucide-react';

export default function SubmitButton({ onClick, isLoading, disabled }) {
  return (
    <Button
      variant="portal"
      size="md"
      icon={Send}
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      className="gap-2 font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
    >
      🚀 SUBMIT SOLUTION
    </Button>
  );
}
