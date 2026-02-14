import { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {children}
    </div>
  );
}