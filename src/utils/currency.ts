// StockX Enterprise Currency Formatting Utilities

export const getCurrencySymbol = (currency: string = 'INR'): string => {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'CAD':
    case 'USD':
    default:
      return currency === 'INR' ? '₹' : '$';
  }
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currency);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  return `${symbol}${num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
