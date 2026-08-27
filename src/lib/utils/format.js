// Formato importi del brand: punto delle migliaia e spazio prima di € (es. "2.450 €")
export function formatEuro(amount) {
  return `${(amount ?? 0).toLocaleString('it-IT')} €`;
}
