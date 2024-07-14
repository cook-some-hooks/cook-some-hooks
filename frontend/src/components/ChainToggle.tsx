import React, { useState } from 'react';
import { useSwitchChain } from 'wagmi';
import { ChevronDownIcon } from 'lucide-react';

const ChainToggle = () => {
  const { chains, switchChain } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingChainId, setPendingChainId] = useState<number | null>(null);

  const handleSwitchChain = async (chainId: number) => {
    setPendingChainId(chainId);
    try {
      await switchChain({ chainId });
    } catch (error) {
      console.error('Failed to switch chain:', error);
    } finally {
      setPendingChainId(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-white/[0.2] shadow-sm px-4 py-2 bg-black text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          Select Chain
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {chains.map((chain) => (
              <button
                key={chain.id}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
                onClick={() => handleSwitchChain(chain.id)}
                disabled={pendingChainId === chain.id}
              >
                <div className="flex items-center">
                  {chain.name}
                  {pendingChainId === chain.id && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Switching...
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainToggle;