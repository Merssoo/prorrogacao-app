const POSITION_ABBREVIATIONS: Record<string, string> = {
  Goleiro: 'GOL',
  Zagueiro: 'ZAG',
  Lateral: 'LAT',
  Volante: 'VOL',
  Meia: 'MEI',
  Atacante: 'ATA',
};

export function abbreviatePosition(position: string | null | undefined): string {
  if (!position) return '';
  return POSITION_ABBREVIATIONS[position] ?? position.slice(0, 3).toUpperCase();
}
