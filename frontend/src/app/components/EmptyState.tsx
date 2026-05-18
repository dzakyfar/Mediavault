import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-8 text-center">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-[#888888] max-w-xl mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
