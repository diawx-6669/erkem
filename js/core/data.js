// Данные, которые родители могут менять без кода, лежат в /data.
const cache = {};

async function getJSON(name) {
  if (cache[name]) return cache[name];
  try {
    const r = await fetch(`data/${name}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    cache[name] = await r.json();
  } catch (e) {
    console.warn('Не удалось загрузить', name, e);
    cache[name] = {};
  }
  return cache[name];
}

export async function loadAll() {
  const [prizes, quiz, photos, games] = await Promise.all(['prizes', 'quiz', 'photos', 'games'].map(getJSON));
  const list = (photos.photos || []).map((p) => {
    const base = p.file.split('/').pop();
    return { ...p, src: `photos/${p.file}`, thumb: `photos/thumbs/${base}`, name: base.replace(/\.jpg$/, '') };
  });
  return {
    prizes: { bonusChance: prizes.bonusChance ?? 0.65, items: prizes.items || [] },
    quiz: { players: quiz.players || ['Мама', 'Папа', 'Ералы', 'Сестра'], questions: quiz.questions || [] },
    photos: list,
    games
  };
}

export const photoByName = (data, name) => data.photos.find((p) => p.name.startsWith(name)) || data.photos[0];
