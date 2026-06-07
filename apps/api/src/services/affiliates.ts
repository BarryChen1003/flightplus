// TP marker - this would normally come from user's TP dashboard
const DEFAULT_MARKER = '320764';

export function buildAffiliateUrl(tpUrl: string): string {
  if (!tpUrl) return '';
  // Wrap TP affiliate link through FlightPlus redirect
  const encoded = encodeURIComponent(tpUrl);
  return `https://flightplus.com/redirect?url=${encoded}&marker=${DEFAULT_MARKER}`;
}

export function buildFlightAffiliateUrl(tripClass: 'economy' | 'business' | 'first' = 'economy'): string {
  // For flight search - TP doesn't provide direct links in Data API
  // This would be used for Search API responses which include actual booking links
  return `https://flightplus.com/redirect?marker=${DEFAULT_MARKER}&class=${tripClass}`;
}