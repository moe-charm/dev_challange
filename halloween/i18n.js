// Simple i18n helper (global)
(function(){
  const storageKey = 'lang';
  const listeners = [];
  const dict = {
    ja: {
      cta_play: '今すぐ遊ぶ',
      cta_howto: '遊び方',
      game_title: '🎃 ハロウィンかぼちゃ収集ゲーム 🦇',
      game_desc: '矢印キーで移動して、街中のかぼちゃを全部集めよう！',
      sound_enable: '🔊 音を有効化',
      sound_on: '🔊 音オン',
      sound_off: '🔇 音オフ',
      ui_pumpkin: '🎃 かぼちゃ:',
      ui_time: '⏱️ タイム:',
      ui_score: '⭐ スコア:',
      instr1: '↑↓←→ 移動 | S: 音のオン/オフ | A: 環境音',
      instr2: '画面クリックで音を有効化',
      minimap: 'ミニマップ:',
      // Dynamic messages
      intro_hint: '🧙‍♀️ 魔女っこを探して近づこう！',
      collect_intro: '🧙‍♀️ 魔女っこ: かぼちゃを全部集めてきてね！',
      return_hint: '🎃 全部集めた！魔女っこのところへ戻ろう！',
      betrayal_html: '😈 魔女っこ: ふふふ...実はあなたは生け贄なのよ！<br>さあ、みんな、彼を捕まえて！',
      escape_intro: '🏃 逃げろ！敵から60秒逃げ切れ！',
      gameover_html: '💀 ゲームオーバー<br>敵に捕まってしまった...<br><small>F5でリトライ</small>',
      victory_html: '🎉 勝利！<br>生け贄の儀式から逃げ切った！<br>タイム: {time}秒',
      press_r_restart: 'Rキーでリスタート',
      good_morning: '🌅 夜明けだ！',
      ui_remaining_prefix: '残り ',
      ui_time_prefix: 'タイム ',
      ui_sec_suffix: '秒'
    },
    en: {
      cta_play: 'Play Now',
      cta_howto: 'How to Play',
      game_title: '🎃 Halloween Pumpkin Hunt 🦇',
      game_desc: 'Use arrow keys to move and collect all pumpkins in town!',
      sound_enable: '🔊 Enable Sound',
      sound_on: '🔊 Sound On',
      sound_off: '🔇 Sound Off',
      ui_pumpkin: '🎃 Pumpkins:',
      ui_time: '⏱️ Time:',
      ui_score: '⭐ Score:',
      instr1: '↑↓←→ Move | S: Sound On/Off | A: Ambient',
      instr2: 'Click the screen to enable audio',
      minimap: 'Minimap:',
      intro_hint: '🧙‍♀️ Find the witch girl and approach!',
      collect_intro: '🧙‍♀️ Witch girl: Collect all the pumpkins!',
      return_hint: '🎃 All collected! Return to the witch girl!',
      betrayal_html: '😈 Witch girl: Hehe... you were the sacrifice!<br>Everyone, catch them!',
      escape_intro: '🏃 Run! Survive the enemies for 60 seconds!',
      gameover_html: '💀 Game Over<br>You were caught...<br><small>Press F5 to retry</small>',
      victory_html: '🎉 Victory!<br>You escaped the ritual!<br>Time: {time}s',
      press_r_restart: 'Press R to restart',
      good_morning: '🌅 Dawn breaks!',
      ui_remaining_prefix: 'Remaining ',
      ui_time_prefix: 'Time ',
      ui_sec_suffix: 's'
    }
  };

  function getLang(){
    // Default is English unless user chose otherwise
    return localStorage.getItem(storageKey) || 'en';
  }
  function setLang(lang){
    localStorage.setItem(storageKey, lang);
    apply(lang);
    listeners.forEach(fn=>fn(lang));
  }
  function t(key, params){
    const lang = window.i18n.lang || getLang();
    let s = (dict[lang] && dict[lang][key]) || (dict.ja && dict.ja[key]) || key;
    if (params) {
      Object.keys(params).forEach(k => {
        s = s.replace(new RegExp(`{${k}}`, 'g'), params[k]);
      });
    }
    return s;
  }
  function apply(lang){
    window.i18n.lang = lang;
    try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
    const map = dict[lang] || {};
    // Apply data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const v = map[key];
      if (typeof v === 'string') {
        if (el.dataset.i18nHtml === '1') el.innerHTML = v; else el.textContent = v;
      }
    });
    // Special fields
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      if (soundToggle.dataset.active === '1' && window.soundManager) {
        soundToggle.textContent = window.soundManager.enabled ? t('sound_on') : t('sound_off');
      } else {
        soundToggle.textContent = t('sound_enable');
      }
    }
  }
  function onChange(fn){ listeners.push(fn); }

  window.i18n = { dict, lang: getLang(), t, setLang, getLang, apply, onChange };

  // Initialize UI if lang select exists
  window.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('langSelect');
    if (sel) {
      sel.value = getLang();
      sel.addEventListener('change', () => setLang(sel.value));
    }
    apply(getLang());
  });
})();
