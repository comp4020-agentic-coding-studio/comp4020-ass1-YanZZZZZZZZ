export interface Era {
  key: string;
  label: string;
  period: string;
  carrier: string;
  region: string;
  regionShort: string;
  roughness: number;
}

export interface CharacterEntry {
  char: string;
  pinyin: string;
  category: string;
  note: string;
}

export interface CharacterData {
  eras: Era[];
  characters: CharacterEntry[];
}

export async function loadCharacterData(url = "./characters.json"): Promise<CharacterData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CharacterData;
}
