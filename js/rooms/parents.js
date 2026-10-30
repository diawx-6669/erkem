// Панель родителей: прогресс, звёзды по играм, имена игроков, звук и голос, сброс.
import { h, btn, overlay } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { isMuted, setMuted } from '../core/audio.js';

export function mount(root, { store, rooms, data }) {
  const render = () => {
    root.innerHTML = '';
    const st = store.state;
    const active = st.coupons.filter((c) => !c.used).length, used = st.coupons.length - active;
    const played = rooms.filter((r) => store.starsFor(r.id) > 0).length;

    const stats = h('section.panel-card', {}, h('h2', {}, 'Прогресс королевы'),
      h('div.stat-row', {},
        h('div.stat', {}, h('b', {}, String(store.totalStars())), h('span', {}, 'звёзд')),
        h('div.stat', {}, h('b', {}, `${played}/${rooms.length}`), h('span', {}, 'игр сыграно')),
        h('div.stat', {}, h('b', {}, String(active)), h('span', {}, 'купонов ждут')),
        h('div.stat', {}, h('b', {}, String(used)), h('span', {}, 'исполнено'))),
      h('p.p-note', {}, store.totalStars() >= 7 ? 'Секретная комната с письмом и видео уже открыта.' : `До секретной комнаты: ${7 - store.totalStars()} звёзд.`));

    const list = h('div.game-stats');
    rooms.forEach((r) => {
      const s = store.starsFor(r.id);
      const stars = h('span.mini-stars');
      for (let k = 0; k < 3; k++) stars.append(h(`span${k < s ? '.on' : ''}`, { html: doodle.star({ fill: k < s ? '#FFC93C' : '#E4DAF5', w: 6, shine: false }) }));
      list.append(h('span', {}, r.title), stars);
    });
    const games = h('section.panel-card', {}, h('h2', {}, 'Звёзды по играм'), list);

    const names = (st.players && st.players.length ? st.players : data.quiz.players).slice();
    while (names.length < 5) names.push('');
    const inputs = names.map((n, i) => h('input', { type: 'text', value: n, placeholder: `Игрок ${i + 1}`, 'aria-label': `Игрок ${i + 1}`, maxlength: 16 }));
    const players = h('section.panel-card', {}, h('h2', {}, 'Кто играет в семейные игры'),
      h('div.p-field', {}, ...inputs),
      h('div.win-actions', {}, btn({ icon: '💾', text: 'Сохранить', variant: 'gold', size: 'sm', onClick: () => {
        const v = inputs.map((x) => x.value.trim()).filter(Boolean);
        store.set('players', v); data.quiz.players = v.length ? v : data.quiz.players;
        saved.textContent = 'Сохранено!';
      } })),
      h('p.p-note', {}, 'Еркем играет всегда — её имя добавляется само.'));
    const saved = h('p.p-note');
    players.append(saved);

    const sw = (label, on, fn) => {
      const b = btn({ text: on ? 'Вкл' : 'Выкл', variant: on ? 'mint' : 'ghost', size: 'sm', onClick: () => { fn(!on); render(); } });
      return h('div.p-switch', {}, h('span', {}, label), b);
    };
    const settings = h('section.panel-card', {}, h('h2', {}, 'Настройки'),
      sw('Звук и музыка', !isMuted(), (v) => setMuted(!v)),
      sw('Голос-подсказки', !store.get('voiceOff'), (v) => store.set('voiceOff', !v)),
      h('p.p-note', {}, 'Тексты призов, заданий и вопросов квиза меняются в файлах ', h('code', {}, 'data/prizes.json'), ', ', h('code', {}, 'data/quiz.json'), ', ', h('code', {}, 'data/games.json'), '.'),
      h('div.win-actions', {}, btn({ icon: '🧹', text: 'Сбросить прогресс', variant: 'ghost', size: 'sm', onClick: () => {
        const ov = overlay(h('div', {}, h('p.confirm-q', {}, 'Стереть звёзды и купоны?'), h('p.win-text', {}, 'Это нельзя отменить.'),
          h('div.win-actions', {}, btn({ text: 'Отмена', variant: 'ghost', onClick: () => ov.close() }),
            btn({ text: 'Стереть', variant: 'pink', onClick: () => { store.reset(); ov.close(); render(); } }))));
      } })));

    root.append(h('div.p-grid', {}, stats, settings, games, players));
  };
  render();
  return () => {};
}
