// import React, { useState, useEffect } from 'react';
// import Image from 'next/image';
// import { Select} from "@/components/ui/select"
// // Import the JSON file
// import tokenList from './uniswap-all.json';

// // Define a type for our token
// type Token = {
//   chainId: number;
//   address: string;
//   name: string;
//   symbol: string;
//   decimals: number;
//   logoURI: string;
// };

// const CoinSelector = () => {
//   const [tokens, setTokens] = useState<Token[]>([]);
//   const [selectedToken, setSelectedToken] = useState<Token | null>(null);

//   useEffect(() => {
//     // Filter and sort tokens by market cap or another popularity metric
//     // For this example, we'll just take the first 100 tokens
//     const popularTokens = tokenList.tokens.slice(0, 100);
//     setTokens(popularTokens);
//   }, []);

//   const handleSelectToken = (value: string) => {
//     const token = tokens.find(t => t.address === value);
//     setSelectedToken(token || null);
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <Select onValueChange={handleSelectToken}>
//         <SelectTrigger className="w-full">
//           <SelectValue placeholder="Select a token" />
//         </SelectTrigger>
//         <SelectContent>
//           {tokens.map((token) => (
//             <SelectItem key={token.address} value={token.address}>
//               <div className="flex items-center">
//                 <Image
//                   src={`/tokens/white/${token.symbol.toLowerCase()}.png`}
//                   alt={token.name}
//                   width={24}
//                   height={24}
//                   className="mr-2"
//                 />
//                 <span>{token.name} ({token.symbol})</span>
//               </div>
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>

//       {selectedToken && (
//         <div className="mt-4 p-4 border rounded-md">
//           <h3 className="text-lg font-semibold">{selectedToken.name}</h3>
//           <p>Symbol: {selectedToken.symbol}</p>
//           <p>Address: {selectedToken.address}</p>
//           <p>Decimals: {selectedToken.decimals}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CoinSelector;