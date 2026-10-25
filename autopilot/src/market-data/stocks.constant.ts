export interface StockInfo {
  symbol: string;         // Yahoo Finance ticker (e.g. 1155.KL)
  code: string;           // Bursa numerical code or US ticker
  name: string;           // Full company name
  market: 'MY' | 'US' | 'ID';
  sector: string;
  currency: string;
  aliases?: string[];     // Alias tickers like MAYBANK, MAYBANK.KL
}

export const SUPPORTED_STOCKS: StockInfo[] = [
  // --- Bursa Malaysia (Top Bluechips & Growth) ---
  { symbol: '1155.KL', code: '1155', name: 'Malayan Banking (Maybank)', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['MAYBANK', 'MAYBANK.KL'] },
  { symbol: '1023.KL', code: '1023', name: 'CIMB Group Holdings', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['CIMB', 'CIMB.KL'] },
  { symbol: '1295.KL', code: '1295', name: 'Public Bank Berhad', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['PBBANK', 'PBBANK.KL', 'PUBLICBANK'] },
  { symbol: '5347.KL', code: '5347', name: 'Tenaga Nasional (TNB)', market: 'MY', sector: 'Utilities', currency: 'MYR', aliases: ['TENAGA', 'TENAGA.KL', 'TNB'] },
  { symbol: '5225.KL', code: '5225', name: 'IHH Healthcare Berhad', market: 'MY', sector: 'Healthcare', currency: 'MYR', aliases: ['IHH', 'IHH.KL'] },
  { symbol: '6947.KL', code: '6947', name: 'CelcomDigi Berhad', market: 'MY', sector: 'Telecommunications', currency: 'MYR', aliases: ['CELCOMDIGI', 'CELCOMDIGI.KL', 'CDB'] },
  { symbol: '5183.KL', code: '5183', name: 'Petronas Chemicals Group', market: 'MY', sector: 'Chemicals / Energy', currency: 'MYR', aliases: ['PCHEM', 'PCHEM.KL', 'PETCHEM'] },
  { symbol: '8869.KL', code: '8869', name: 'Press Metal Aluminium', market: 'MY', sector: 'Industrial Products', currency: 'MYR', aliases: ['PMETAL', 'PMETAL.KL'] },
  { symbol: '6742.KL', code: '6742', name: 'YTL Power International', market: 'MY', sector: 'Utilities / AI Infrastructure', currency: 'MYR', aliases: ['YTLPOWR', 'YTLPOWER', 'YTLPOWR.KL'] },
  { symbol: '4677.KL', code: '4677', name: 'YTL Corporation Berhad', market: 'MY', sector: 'Conglomerate', currency: 'MYR', aliases: ['YTL', 'YTL.KL'] },
  { symbol: '5398.KL', code: '5398', name: 'Gamuda Berhad', market: 'MY', sector: 'Construction', currency: 'MYR', aliases: ['GAMUDA', 'GAMUDA.KL'] },
  { symbol: '3336.KL', code: '3336', name: 'IJM Corporation Berhad', market: 'MY', sector: 'Construction / Infrastructure', currency: 'MYR', aliases: ['IJM', 'IJM.KL'] },
  { symbol: '0166.KL', code: '0166', name: 'Inari Amertron Berhad', market: 'MY', sector: 'Technology / Semiconductor', currency: 'MYR', aliases: ['INARI', 'INARI.KL'] },
  { symbol: '3182.KL', code: '3182', name: 'Genting Berhad', market: 'MY', sector: 'Consumer Services', currency: 'MYR', aliases: ['GENTING', 'GENTING.KL'] },
  { symbol: '4715.KL', code: '4715', name: 'Genting Malaysia Berhad', market: 'MY', sector: 'Consumer Services', currency: 'MYR', aliases: ['GENM', 'GENM.KL'] },
  { symbol: '4197.KL', code: '4197', name: 'Sime Darby Berhad', market: 'MY', sector: 'Industrial Products', currency: 'MYR', aliases: ['SIME', 'SIME.KL'] },
  { symbol: '5285.KL', code: '5285', name: 'SD Guthrie (Sime Darby Plantation)', market: 'MY', sector: 'Plantation', currency: 'MYR', aliases: ['SDG', 'SDG.KL', 'SIMEPLT'] },
  { symbol: '6888.KL', code: '6888', name: 'Axiata Group Berhad', market: 'MY', sector: 'Telecommunications', currency: 'MYR', aliases: ['AXIATA', 'AXIATA.KL'] },
  { symbol: '7113.KL', code: '7113', name: 'Top Glove Corporation', market: 'MY', sector: 'Healthcare / Gloves', currency: 'MYR', aliases: ['TOPGLOV', 'TOPGLOV.KL'] },
  { symbol: '3816.KL', code: '3816', name: 'MISC Berhad', market: 'MY', sector: 'Transportation & Logistics', currency: 'MYR', aliases: ['MISC', 'MISC.KL'] },
  { symbol: '4863.KL', code: '4863', name: 'Telekom Malaysia (TM)', market: 'MY', sector: 'Telecommunications', currency: 'MYR', aliases: ['TM', 'TM.KL'] },
  { symbol: '5819.KL', code: '5819', name: 'Hong Leong Bank Berhad', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['HLBANK', 'HLBANK.KL'] },
  { symbol: '4707.KL', code: '4707', name: 'Nestlé (Malaysia) Berhad', market: 'MY', sector: 'Consumer Products', currency: 'MYR', aliases: ['NESTLE', 'NESTLE.KL'] },
  { symbol: '6012.KL', code: '6012', name: 'Maxis Berhad', market: 'MY', sector: 'Telecommunications', currency: 'MYR', aliases: ['MAXIS', 'MAXIS.KL'] },
  { symbol: '7277.KL', code: '7277', name: 'Dialog Group Berhad', market: 'MY', sector: 'Energy / Oil & Gas', currency: 'MYR', aliases: ['DIALOG', 'DIALOG.KL'] },
  { symbol: '5211.KL', code: '5211', name: 'Sunway Berhad', market: 'MY', sector: 'Conglomerate / Healthcare', currency: 'MYR', aliases: ['SUNWAY', 'SUNWAY.KL'] },
  { symbol: '5168.KL', code: '5168', name: 'Hartalega Holdings Berhad', market: 'MY', sector: 'Healthcare / Gloves', currency: 'MYR', aliases: ['HARTA', 'HARTA.KL'] },
  { symbol: '1818.KL', code: '1818', name: 'Bursa Malaysia Berhad', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['BURSA', 'BURSA.KL'] },
  { symbol: '1015.KL', code: '1015', name: 'AMMB Holdings (AmBank)', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['AMBANK', 'AMBANK.KL', 'AMMB'] },
  { symbol: '1066.KL', code: '1066', name: 'RHB Bank Berhad', market: 'MY', sector: 'Financial Services', currency: 'MYR', aliases: ['RHBBANK', 'RHBBANK.KL', 'RHB'] },
  { symbol: '5878.KL', code: '5878', name: 'KPJ Healthcare Berhad', market: 'MY', sector: 'Healthcare', currency: 'MYR', aliases: ['KPJ', 'KPJ.KL'] },
  { symbol: '6033.KL', code: '6033', name: 'Petronas Gas Berhad', market: 'MY', sector: 'Utilities', currency: 'MYR', aliases: ['PETGAS', 'PETGAS.KL'] },
  { symbol: '5681.KL', code: '5681', name: 'Petronas Dagangan Berhad', market: 'MY', sector: 'Energy / Retail', currency: 'MYR', aliases: ['PETDAG', 'PETDAG.KL'] },
  { symbol: '0138.KL', code: '0138', name: 'MyEG Services Berhad', market: 'MY', sector: 'Technology / E-Gov', currency: 'MYR', aliases: ['MYEG', 'MYEG.KL'] },
  { symbol: '5296.KL', code: '5296', name: 'Mr D.I.Y. Group Berhad', market: 'MY', sector: 'Consumer Retail', currency: 'MYR', aliases: ['MRDIY', 'MRDIY.KL'] },
  { symbol: '5306.KL', code: '5306', name: 'Farm Fresh Berhad', market: 'MY', sector: 'Consumer / Dairy', currency: 'MYR', aliases: ['FARMFRESH', 'FARMFRESH.KL'] },
  { symbol: '5301.KL', code: '5301', name: 'CTOS Digital Berhad', market: 'MY', sector: 'Fintech / Credit Data', currency: 'MYR', aliases: ['CTOS', 'CTOS.KL'] },

  // --- US Market (Mega-Cap & Leaders) ---
  { symbol: 'AAPL', code: 'AAPL', name: 'Apple Inc.', market: 'US', sector: 'Consumer Electronics', currency: 'USD' },
  { symbol: 'NVDA', code: 'NVDA', name: 'NVIDIA Corporation', market: 'US', sector: 'Semiconductors / AI', currency: 'USD' },
  { symbol: 'TSLA', code: 'TSLA', name: 'Tesla, Inc.', market: 'US', sector: 'Automotive / Tech', currency: 'USD' },
  { symbol: 'MSFT', code: 'MSFT', name: 'Microsoft Corporation', market: 'US', sector: 'Software / Cloud', currency: 'USD' },
  { symbol: 'GOOGL', code: 'GOOGL', name: 'Alphabet Inc. (Google)', market: 'US', sector: 'Technology / Internet', currency: 'USD' },
  { symbol: 'AMZN', code: 'AMZN', name: 'Amazon.com, Inc.', market: 'US', sector: 'E-Commerce / Cloud', currency: 'USD' },

  // --- Indonesian Market (IDX) ---
  { symbol: 'BBCA.JK', code: 'BBCA', name: 'Bank Central Asia', market: 'ID', sector: 'Financial Services', currency: 'IDR' },
  { symbol: 'BBRI.JK', code: 'BBRI', name: 'Bank Rakyat Indonesia', market: 'ID', sector: 'Financial Services', currency: 'IDR' },
  { symbol: 'TLKM.JK', code: 'TLKM', name: 'Telkom Indonesia', market: 'ID', sector: 'Telecommunications', currency: 'IDR' },
];

export function resolveStockSymbol(input: string): string {
  if (!input) return '1155.KL';
  const clean = input.trim().toUpperCase();

  // 1. Direct match with symbol
  const bySymbol = SUPPORTED_STOCKS.find(s => s.symbol.toUpperCase() === clean);
  if (bySymbol) return bySymbol.symbol;

  // 2. Direct match with aliases
  const byAlias = SUPPORTED_STOCKS.find(s => s.aliases?.some(a => a.toUpperCase() === clean));
  if (byAlias) return byAlias.symbol;

  // 3. Direct match with code
  const byCode = SUPPORTED_STOCKS.find(s => s.code.toUpperCase() === clean);
  if (byCode) return byCode.symbol;

  // 4. If ends with .KL, .JK or already valid ticker format
  return clean;
}
