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
  { chainId: 1, address: "0x0000000000000000000000000000000000000000", name: "Ethereum", symbol: "ETH", decimals: 18, logoURI: "/tokens/eth.png" },
  { chainId: 1, address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", name: "Uniswap", symbol: "UNI", decimals: 18, logoURI: "/tokens/uni.png" },
  { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "USD Coin", symbol: "USDC", decimals: 6, logoURI: "/tokens/usdc.png" },
  { chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", name: "Tether", symbol: "USDT", decimals: 6, logoURI: "/tokens/usdt.png" },
];

interface CoinSelectorProps {
  onSelectTokens: (tokens: Token[]) => void;
}

const CoinSelector: React.FC<CoinSelectorProps> = ({ onSelectTokens }) => {
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [displayedTokens, setDisplayedTokens] = useState<Token[]>(popularTokens);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/components/tokens/uni.json')
      .then(response => response.json())
      .then(data => {
        const updatedTokens = data.tokens.map((token: Token) => ({
          ...token,
          logoURI: `/tokens/${token.symbol.toLowerCase()}.png`
        }));
        setAllTokens(updatedTokens);
      })
      .catch(error => console.error('Error fetching tokens:', error));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allTokens.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedTokens(filtered);
    } else {
      setDisplayedTokens(popularTokens);
    }
  }, [searchTerm, allTokens]);

  const handleSelect = (token: Token) => {
    if (selectedTokens.length < 2 && !selectedTokens.find(t => t.address === token.address)) {
      const newSelectedTokens = [...selectedTokens, token];
      setSelectedTokens(newSelectedTokens);
      onSelectTokens(newSelectedTokens);
    }
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
      <div className="selected-tokens">
        {selectedTokens.map(token => (
          <div key={token.address} className="selected-token">
            <div className="token-icon">
              <Image src={token.logoURI} alt={token.name} width={24} height={24} />
            </div>
            <span>{token.name} ({token.symbol})</span>
          </div>
        ))}
      </div>
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
      `}</style>
    </div>
  );
};

export default CoinSelector;