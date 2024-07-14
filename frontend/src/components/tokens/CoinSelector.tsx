import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

const popularTokens: Token[] = [
    { chainId: 1, address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "Wrapped Ether", symbol: "WETH", decimals: 18, logoURI: "/tokens/eth.png" },
    { chainId: 1, address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", name: "Uniswap", symbol: "UNI", decimals: 18, logoURI: "/tokens/uni.png" },
    { chainId: 1, address: "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898", name: "PancakeSwap Token", symbol: "CAKE", decimals: 18, logoURI: "/tokens/cake.png" },
    { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "USD Coin", symbol: "USDC", decimals: 6, logoURI: "/tokens/usdc.png" },
    { chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", name: "Tether", symbol: "USDT", decimals: 6, logoURI: "/tokens/usdt.png" },
    { chainId: 1, address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", name: "ChainLink Token", symbol: "LINK", decimals: 18, logoURI: "/tokens/link.png" },
    { chainId: 1, address: "0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4", name: "NEAR", symbol: "NEAR", decimals: 24, logoURI: "/tokens/near.png" },
    { chainId: 1, address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1", name: "Arbitrum", symbol: "ARB", decimals: 18, logoURI: "/tokens/arb.png" },
    { chainId: 1, address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", name: "Graph Token", symbol: "GRT", decimals: 18, logoURI: "/tokens/grt.png" },
    { chainId: 1, address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72", name: "Ethereum Name Service", symbol: "ENS", decimals: 18, logoURI: "/tokens/ens.png" },
    { chainId: 1, address: "0x111111111117dc0aa78b770fa6a738034120c302", name: "1 inch", symbol: "1INCH", decimals: 18, logoURI: "/tokens/1inch.png" },

  ];
interface CoinSelectorProps {
  onSelectTokens: (tokens: Token[]) => void;
}

const CoinSelector: React.FC<CoinSelectorProps> = ({ onSelectTokens }) => {
  const [displayedTokens, setDisplayedTokens] = useState<Token[]>(popularTokens);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = popularTokens.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedTokens(filtered);
    } else {
      setDisplayedTokens(popularTokens);
    }
  }, [searchTerm]);

  const handleSelect = (token: Token) => {
    let newSelectedTokens = [...selectedTokens];
    const tokenIndex = newSelectedTokens.findIndex(t => t.address === token.address);

    if (tokenIndex === -1) {
      if (newSelectedTokens.length < 2) {
        newSelectedTokens.push(token);
      } else {
        newSelectedTokens[1] = token;
      }
    } else {
      newSelectedTokens = newSelectedTokens.filter(t => t.address !== token.address);
    }

    setSelectedTokens(newSelectedTokens);
    onSelectTokens(newSelectedTokens);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="coin-selector">
      <div className="dropdown">
        <input
          type="text"
          placeholder="Search tokens"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="search-input"
        />
        {isDropdownOpen && (
          <div className="token-list">
            {displayedTokens.map(token => (
              <div key={token.address} className="token-item" onClick={() => handleSelect(token)}>
                <div className="token-icon">
                  <Image src={token.logoURI} alt={token.name} width={24} height={24} />
                </div>
                <span>{token.name} ({token.symbol})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedTokens.length > 0 && (
        <div className="selected-tokens">
          <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
            Selected Token:
          </h3>
          <div className="flex flex-col space-y-2">
            {selectedTokens.map(token => (
              <div key={token.address} className="flex items-center space-x-2">
                <div className="token-icon">
                  <Image src={token.logoURI} alt={token.name} width={24} height={24} />
                </div>
                <span>{token.name} ({token.symbol})</span>
                <button onClick={() => handleSelect(token)} className="remove-token">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <style jsx>{`
        .coin-selector {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }
        .dropdown {
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px;
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          outline: none;
        }
        .search-input::placeholder {
          color: #666;
        }
        .token-list {
          position: absolute;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-top: none;
          border-radius: 0 0 8px 8px;
          z-index: 1000;
        }
        .token-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          color: white;
        }
        .token-item:hover {
          background-color: #2a2a2a;
        }
        .token-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .token-icon img {
          max-width: 100%;
          max-height: 100%;
        }
        .selected-tokens {
          margin-top: 20px;
        }
        .selected-token {
          display: flex;
          align-items: center;
          padding: 8px;
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: white;
          margin-bottom: 8px;
        }
        .selected-token > div {
          margin-left: 12px;
        }
        .remove-token {
          margin-left: auto;
          padding: 4px 8px;
          background-color: #333;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }
        .remove-token:hover {
          background-color: #444;
        }
      `}</style>
    </div>
  );
};

export default CoinSelector;