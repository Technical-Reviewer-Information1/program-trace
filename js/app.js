(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  function code(box, lines, on, skip) {
    $(box).innerHTML = lines.map((s, k) =>
      '<span class="ln' + (k + 1 === on ? ' on' : '') + ((skip || []).indexOf(k + 1) >= 0 ? ' skip' : '') + '">(' +
      String(k + 1).padStart(2, '0') + ') ' + esc(s) + '</span>').join('');
  }
  function trace(box, cols, rows) {
    $(box).innerHTML = '<thead><tr><th>行</th>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r, ri) => '<tr><td>' + r.line + '</td>' + cols.map((c, ci) => {
        const v = r.v[ci], prev = ri > 0 ? rows[ri - 1].v[ci] : undefined;
        return '<td class="' + (ri > 0 && String(v) !== String(prev) ? 'chg' : '') + '">' + (v === undefined ? '' : v) + '</td>';
      }).join('') + '</tr>').join('') + '</tbody>';
  }
  function stepper(pre, build, render) {
    let frames = build(), i = 0, timer = null;
    function show() { render(frames, i); $(pre + 'Step').disabled = i >= frames.length - 1; $(pre + 'Prog').textContent = (i + 1) + ' / ' + frames.length; }
    function stop() { if (timer) clearInterval(timer); timer = null; if ($(pre + 'Play')) $(pre + 'Play').textContent = '自動で動かす'; }
    function reset() { frames = build(); i = 0; stop(); show(); }
    $(pre + 'Step').addEventListener('click', () => { if (i < frames.length - 1) { i++; show(); } });
    $(pre + 'Reset').addEventListener('click', reset);
    if ($(pre + 'Play')) $(pre + 'Play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      $(pre + 'Play').textContent = '止める';
      timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } i++; show(); }, 480);
    });
    show();
    return reset;
  }

  /* ============ STEP 1：1から N までの合計 ============ */
  function aLines() {
    const N = +$('aMax').value;
    return ['goukei = 0', 'i を 1 から ' + N + ' まで 1 ずつ増やしながら繰り返す:', '└ goukei = goukei + i', '表示する("合計値：", goukei)'];
  }
  function aBuild() {
    const N = +$('aMax').value, fr = [];
    let g = 0;
    fr.push({ line: 1, v: ['', 0], out: '', msg: 'goukei に 0 を入れました。<strong>足し算を始める前の「まだ何も足していない」状態</strong>です。' });
    for (let i = 1; i <= N; i++) {
      fr.push({ line: 2, v: [i, g], out: '', msg: 'i ＝ <strong>' + i + '</strong> になりました。' + (i === N ? 'これが最後の回です。' : '') });
      const before = g; g += i;
      fr.push({ line: 3, v: [i, g], out: '', msg: 'goukei ＝ ' + before + ' ＋ ' + i + ' ＝ <strong>' + g + '</strong>。右辺の goukei は<strong>これまでの合計</strong>です。' });
    }
    fr.push({ line: 4, v: ['', g], out: '合計値： ' + g, msg: '<strong>くり返しが終わりました。</strong>1 から ' + N + ' までの合計は <strong>' + g + '</strong> です。' });
    return fr;
  }
  function aRender(fr, i) {
    const f = fr[i];
    code('aCode', aLines(), f.line);
    trace('aTrace', ['i', 'goukei'], fr.slice(0, i + 1));
    $('aOut').textContent = f.out;
    const n = $('aNote'); n.className = 'note ' + (i === fr.length - 1 ? 'ok' : 'info'); n.innerHTML = f.msg;
  }

  /* ============ STEP 2：〜の間くり返す（偶数の合計） ============ */
  const W_LINES = ['a = 5, i = 1', 'goukei = 0', 'i <= a の間繰り返す:', '│ goukei = goukei + i * 2', '└ i = i + 1', '表示する("合計値：", goukei)'];
  function wBuild() {
    const fr = [], a = 5;
    let i = 1, g = 0;
    fr.push({ line: 1, v: [a, i, ''], out: '', msg: 'a ＝ 5、i ＝ 1 を用意しました。' });
    fr.push({ line: 2, v: [a, i, g], out: '', msg: 'goukei ＝ 0。' });
    while (true) {
      const ok = i <= a;
      fr.push({ line: 3, v: [a, i, g], out: '', msg: '条件 <span class="mono">i &lt;= a</span> は ' + i + ' &lt;= ' + a + ' → <strong>' + (ok ? '真（中に入る）' : '偽（くり返し終了）') + '</strong>' });
      if (!ok) break;
      const b = g; g += i * 2;
      fr.push({ line: 4, v: [a, i, g], out: '', msg: 'goukei ＝ ' + b + ' ＋ ' + i + '×2 ＝ <strong>' + g + '</strong>（' + (i * 2) + ' を足しました）' });
      i += 1;
      fr.push({ line: 5, v: [a, i, g], out: '', msg: 'i を1増やして <strong>' + i + '</strong>。<strong>この行がないと条件が変わらず、終わらなくなります。</strong>' });
    }
    fr.push({ line: 6, v: [a, i, g], out: '合計値： ' + g, msg: '<strong>2＋4＋6＋8＋10 ＝ ' + g + '</strong>。i を2倍して足すことで、偶数だけを足しています。' });
    return fr;
  }
  function wRender(fr, i) {
    const f = fr[i];
    code('wCode', W_LINES, f.line);
    trace('wTrace', ['a', 'i', 'goukei'], fr.slice(0, i + 1));
    $('wOut').textContent = f.out;
    const n = $('wNote'); n.className = 'note ' + (i === fr.length - 1 ? 'ok' : 'info'); n.innerHTML = f.msg;
  }

  /* ============ STEP 3：分岐 ============ */
  const H_LINES = ['shinchou = ?', 'もし shinchou < 110 ならば:', '│ 表示する("乗車できません")', 'そうでなくもし shinchou < 130 ならば:',
    '│ 表示する("保護者同伴で乗車できます")', 'そうでなければ:', '└ 表示する("一人で乗車できます")'];
  function drawH() {
    const h = +$('hIn').value;
    $('hInV').textContent = h;
    const c1 = h < 110, c2 = !c1 && h < 130;
    const hit = c1 ? 3 : (c2 ? 5 : 7);
    const lines = H_LINES.slice(); lines[0] = 'shinchou = ' + h;
    const skip = [];
    if (c1) skip.push(4, 5, 6, 7);
    else if (c2) skip.push(3, 6, 7);
    else skip.push(3, 5);
    code('hCode', lines, hit, skip);
    $('hView').innerHTML =
      '<div class="r ' + (c1 ? 'yes' : 'no') + '">① shinchou &lt; 110 → ' + h + ' &lt; 110 は <strong>' + (h < 110 ? '真' : '偽') + '</strong></div>' +
      '<div class="r ' + (c2 ? 'yes' : (c1 ? 'skip' : 'no')) + '">② shinchou &lt; 130 → ' + (c1 ? '<em>ここは見ません（①で決まったため）</em>' : h + ' &lt; 130 は <strong>' + (h < 130 ? '真' : '偽') + '</strong>') + '</div>' +
      '<div class="r ' + (!c1 && !c2 ? 'yes' : 'skip') + '">③ そうでなければ</div>';
    const n = $('hNote'); n.className = 'note ok';
    n.innerHTML = '表示されるのは <strong>「' + (c1 ? '乗車できません' : (c2 ? '保護者同伴で乗車できます' : '一人で乗車できます')) + '」</strong>。' +
      (!c1 && c2 ? '<br>110以上130未満なので②で決まります。<strong>①が偽だったから②を見た</strong>、という順番が大切です。' : '');
  }
  const B_LINES = ['wa = a + b + c', 'もし wa > 203 and d > 20 ならば:', '│ ryoukin = 16000', 'そうでなくもし wa > 203 ならば:',
    '│ ryoukin = 10000', 'そうでなくもし d > 20 ならば:', '│ ryoukin = 7000', 'そうでなければ:', '└ ryoukin = 0', '表示する("預け手荷物の料金:", ryoukin)'];
  function drawB() {
    const a = +$('ba').value || 0, b = +$('bb').value || 0, c = +$('bc').value || 0, d = +$('bd').value || 0;
    const wa = a + b + c, over = wa > 203, heavy = d > 20;
    const hit = (over && heavy) ? 3 : (over ? 5 : (heavy ? 7 : 9));
    const ryo = (over && heavy) ? 16000 : (over ? 10000 : (heavy ? 7000 : 0));
    code('bCode', B_LINES, hit);
    $('bView').innerHTML =
      '<div class="r">三辺の合計 wa ＝ ' + a + ' ＋ ' + b + ' ＋ ' + c + ' ＝ <strong>' + wa + '</strong> cm ／ 重さ d ＝ <strong>' + d + '</strong> kg</div>' +
      '<div class="r ' + (over && heavy ? 'yes' : 'no') + '">① wa &gt; 203 <strong>かつ</strong> d &gt; 20 → ' + (over && heavy ? '真' : '偽') + '</div>' +
      '<div class="r ' + (!(over && heavy) && over ? 'yes' : (over && heavy ? 'skip' : 'no')) + '">② wa &gt; 203 → ' + (over && heavy ? '<em>見ません</em>' : (over ? '真' : '偽')) + '</div>' +
      '<div class="r ' + (!over && heavy ? 'yes' : (over ? 'skip' : 'no')) + '">③ d &gt; 20 → ' + (over ? '<em>見ません</em>' : (heavy ? '真' : '偽')) + '</div>' +
      '<div class="r ' + (!over && !heavy ? 'yes' : 'skip') + '">④ そうでなければ</div>';
    const n = $('bNote'); n.className = 'note ' + (ryo ? 'warn' : 'ok');
    n.innerHTML = '料金は <strong>' + ryo.toLocaleString() + ' 円</strong>です。';
  }

  /* ============ STEP 4：二重ループ ============ */
  const N_LINES = ['moji = ""', 'i を 0 から ? まで 1 ずつ増やしながら繰り返す:', '│ moji = moji + "A"', '│ j を 0 から ? まで 1 ずつ増やしながら繰り返す:', '└ └ moji = moji + "B"', '表示する(moji)'];
  function drawN() {
    const oi = +$('oi').value, oj = +$('oj').value;
    $('oiV').textContent = oi; $('ojV').textContent = oj;
    const lines = N_LINES.slice();
    lines[1] = 'i を 0 から ' + oi + ' まで 1 ずつ増やしながら繰り返す:';
    lines[3] = '│ j を 0 から ' + oj + ' まで 1 ずつ増やしながら繰り返す:';
    code('nCode', lines, 0);
    let s = '';
    for (let i = 0; i <= oi; i++) { s += 'A'; for (let j = 0; j <= oj; j++) s += 'B'; }
    $('nOut').textContent = s;
    $('nOi').textContent = (oi + 1) + ' 回';
    $('nOj').textContent = ((oi + 1) * (oj + 1)) + ' 回';
    const n = $('nNote'); n.className = 'note ok';
    n.innerHTML = '外側が <strong>' + (oi + 1) + ' 回</strong>、そのたびに内側が <strong>' + (oj + 1) + ' 回</strong>まわるので、' +
      'B は <strong>' + (oi + 1) + ' × ' + (oj + 1) + ' ＝ ' + ((oi + 1) * (oj + 1)) + ' 個</strong>。' +
      '「A のあとに B が ' + (oj + 1) + ' 個」というかたまりが ' + (oi + 1) + ' 回くり返されます。';
  }
  const V_LINES = ['atai = 0', 'i を 1 から 3 まで 1 ずつ増やしながら繰り返す:', '│ atai = atai * i', '│ j を 1 から 3 まで 1 ずつ増やしながら繰り返す:', '└ └ atai = atai + j', '表示する(atai)'];
  function vBuild() {
    const fr = []; let atai = 0;
    fr.push({ line: 1, v: ['', '', 0], out: '', msg: 'atai ＝ 0 から始めます。' });
    for (let i = 1; i <= 3; i++) {
      const b = atai; atai = atai * i;
      fr.push({ line: 3, v: [i, '', atai], out: '', msg: 'atai ＝ ' + b + ' × ' + i + ' ＝ <strong>' + atai + '</strong>（外側に入るたびに<strong>かけ算</strong>）' });
      for (let j = 1; j <= 3; j++) {
        const b2 = atai; atai = atai + j;
        fr.push({ line: 5, v: [i, j, atai], out: '', msg: 'atai ＝ ' + b2 + ' ＋ ' + j + ' ＝ <strong>' + atai + '</strong>' });
      }
    }
    fr.push({ line: 6, v: ['', '', atai], out: String(atai), msg: '<strong>答えは ' + atai + '</strong>。外側でかけ算 → 内側で1・2・3を足す、を3回くり返しました。' });
    return fr;
  }
  function vRender(fr, i) {
    const f = fr[i];
    code('vCode', V_LINES, f.line);
    trace('vTrace', ['i', 'j', 'atai'], fr.slice(0, i + 1));
    const n = $('vNote'); n.className = 'note ' + (i === fr.length - 1 ? 'ok' : 'info'); n.innerHTML = f.msg;
  }

  /* ============ STEP 5：鶴亀算 ============ */
  const T_LINES = ['atama = ?, ashi = ?', 'tsuru を 0 から atama まで 1 ずつ増やしながら繰り返す:', '│ kame = atama - tsuru',
    '│ もし tsuru * 2 + kame * 4 == ashi ならば:', '└ └ 表示する("鶴：", tsuru, "亀：", kame)'];
  function drawT() {
    const atama = +$('tAtama').value, ashi = +$('tAshi').value;
    $('tAtamaV').textContent = atama; $('tAshiV').textContent = ashi;
    const lines = T_LINES.slice(); lines[0] = 'atama = ' + atama + ', ashi = ' + ashi;
    code('tCode', lines, 0);
    const rows = []; let hit = null;
    for (let t = 0; t <= atama; t++) {
      const k = atama - t, s = t * 2 + k * 4;
      if (s === ashi) hit = { t: t, k: k };
      rows.push({ line: t, v: [t, k, s, s === ashi ? '○' : '×'] });
    }
    $('tTrace').innerHTML = '<thead><tr><th>tsuru</th><th>kame</th><th>足の合計</th><th>一致</th></tr></thead><tbody>' +
      rows.map(r => '<tr' + (r.v[3] === '○' ? ' style="background:var(--ok-bg);font-weight:700"' : '') + '>' +
        r.v.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</tbody>';
    const n = $('tNote');
    n.className = 'note ' + (hit ? 'ok' : 'ng');
    n.innerHTML = hit
      ? '<strong>鶴 ' + hit.t + ' 羽、亀 ' + hit.k + ' 匹</strong>が見つかりました。' +
        '調べた回数は <strong>' + (atama + 1) + ' 回</strong>（tsuru が 0 から ' + atama + ' まで）。' +
        '<br>このように<strong>考えられる場合を全部ためす</strong>方法を、総当たり（全探索）といいます。'
      : 'この頭と足の組み合わせでは、あてはまるものがありません。足の数は<strong>偶数</strong>で、頭×2 以上・頭×4 以下である必要があります。';
  }

  function init() {
    const aReset = stepper('a', aBuild, aRender);
    $('aMax').addEventListener('input', () => { $('aMaxV').textContent = $('aMax').value; aReset(); });
    stepper('w', wBuild, wRender);
    stepper('v', vBuild, vRender);
    $('hIn').addEventListener('input', drawH); drawH();
    ['ba', 'bb', 'bc', 'bd'].forEach(i => $(i).addEventListener('input', drawB)); drawB();
    ['oi', 'oj'].forEach(i => $(i).addEventListener('input', drawN)); drawN();
    ['tAtama', 'tAshi'].forEach(i => $(i).addEventListener('input', drawT)); drawT();

    Quiz.choice('bookBox', 'bookNote', [
      { k: '2-3 ア', q: '10以下の自然数の合計。i を 1 からいくつまで繰り返すか。',
        ch: ['9', '10', 'i', 'goukei', 'goukei − 1', 'goukei + i', 'goukei + 1'], a: 1,
        why: '「10以下の自然数」は10を含みます。<strong>「〜まで」は、その数も含む</strong>ので 10 です。' },
      { k: '2-3 イ', q: '(03)行目：goukei ＝ ？',
        ch: ['9', '10', 'i', 'goukei', 'goukei − 1', 'goukei + i', 'goukei + 1'], a: 5,
        why: '「これまでの合計 ＋ いまの数」なので <span class="mono">goukei + i</span>。STEP 1 のトレース表で1行ずつ確かめられます。' },
      { k: '2-3 ウ', q: '偶数の合計：(03)行目の繰り返しの条件は。',
        ch: ['a &lt; i', 'a &lt;= i', 'i &lt; a', 'i &lt;= a'], a: 3,
        why: 'i を 1 から 5 まで動かしたいので <span class="mono">i &lt;= a</span>。<span class="mono">i &lt; a</span> だと 5 のときに入らず、10 が足されません。' },
      { k: '2-3 エ', q: '(04)行目：goukei ＝ ？',
        ch: ['goukei + 1', 'goukei + 2', 'goukei + i', 'goukei + i * 2'], a: 3,
        why: 'i が 1,2,3,4,5 と動くので、2倍して 2,4,6,8,10 を足します。' },
      { k: '2-3 オ', q: '(05)行目：i ＝ ？',
        ch: ['i', 'i + 1', 'a', 'a + 1'], a: 1,
        why: '<strong>これがないと i が変わらず、条件がずっと真のまま</strong>で終わりません。' },
      { k: '2-4 ア', q: 'shinchou ＝ 125 のとき、表示されるのは。',
        ch: ['乗車できません', '保護者同伴で乗車できます', '一人で乗車できます', '何も表示されない'], a: 1,
        why: '125 &lt; 110 は偽、125 &lt; 130 は真。<strong>上から順に判定して、最初に真になったところ</strong>で決まります。STEP 3 で確かめられます。' },
      { k: '2-4 イ', q: '手荷物料金：(02)行目の条件（16,000円）は。',
        ch: ['wa &gt; 203', 'wa &lt;= 203', 'd &gt; 20', 'd &lt;= 20', 'wa &gt; 203 and d &gt; 20', 'wa &gt; 203 or d &gt; 20', 'wa &lt;= 203 and d &lt;= 20', 'wa &lt;= 203 or d &lt;= 20'], a: 4,
        why: '<strong>両方に当てはまる</strong>場合なので and。<strong>いちばんきびしい条件を先に書く</strong>のがポイントです。' },
      { k: '2-4 ウ', q: '(04)行目の条件（10,000円）は。',
        ch: ['wa &gt; 203', 'wa &lt;= 203', 'd &gt; 20', 'd &lt;= 20', 'wa &gt; 203 and d &gt; 20', 'wa &gt; 203 or d &gt; 20', 'wa &lt;= 203 and d &lt;= 20', 'wa &lt;= 203 or d &lt;= 20'], a: 0,
        why: 'ここに来た時点で「両方」は否定されているので、<span class="mono">wa &gt; 203</span> だけで十分です。' },
      { k: '2-4 エ', q: '(06)行目の条件（7,000円）は。',
        ch: ['wa &gt; 203', 'wa &lt;= 203', 'd &gt; 20', 'd &lt;= 20', 'wa &gt; 203 and d &gt; 20', 'wa &gt; 203 or d &gt; 20', 'wa &lt;= 203 and d &lt;= 20', 'wa &lt;= 203 or d &lt;= 20'], a: 2,
        why: '同じく、残っているのは「重さだけ超過」の場合です。' },
      { k: '2-5 ア', q: '鶴亀算：tsuru をどこからどこまで繰り返すか。',
        ch: ['0からatama', '1からatama', '0からatama−1', '1からatama−1'], a: 0,
        why: '鶴が0羽（全部亀）の場合もありえるので <strong>0から</strong>。全部鶴の場合もあるので atama まで。STEP 5 の表で確かめられます。' },
      { k: '2-5 イ', q: '(03)行目：kame ＝ ？',
        ch: ['atama + tsuru', 'atama − tsuru', 'tsuru − atama', 'atama'], a: 1,
        why: '頭の数の合計から鶴の数を引けば亀の数です。' },
      { k: '2-5 ウ', q: '約数を数えるプログラム：割り切れる条件は。',
        ch: ['seisuu ÷ i = 0', 'seisuu ÷ i == 0', 'seisuu % i = 0', 'seisuu % i == 0'], a: 3,
        why: '割り切れる＝<strong>余りが0</strong>なので % を使います。また、比較は <span class="mono">==</span>（＝ は代入）です。' },
      { k: '2-5 エ', q: '個数を数える行：kosuu ＝ ？',
        ch: ['1', 'i', 'kosuu + 1', 'kosuu + i'], a: 2,
        why: '1つ見つかるたびに<strong>1ずつ増やす</strong>のが「数える」形です。' },
      { k: '2-6 ア', q: '文字列のプログラムの実行結果は。',
        ch: ['AAAAABB', 'AAAAB', 'ABBABBABBABB', 'ABBABBABBABBABB'], a: 3,
        why: '外側は i＝0〜4 の5回、内側は j＝0〜1 の2回。「A のあとに B が2個」が5回くり返されます。STEP 4 で範囲を変えて確かめられます。' },
      { k: '2-6 イ', q: '数値のプログラムの実行結果は。',
        ch: ['18', '36', '60', '63'], a: 2,
        why: 'i＝1：0×1＝0 →+1+2+3＝6／i＝2：6×2＝12 →+6＝18／i＝3：18×3＝54 →+6＝<strong>60</strong>。STEP 4 の下のトレースで確かめられます。' }
    ], '本文の答えは、2-3【ア】①【イ】⑤【ウ】③【エ】③【オ】①　2-4【ア】①【イ】④【ウ】⓪【エ】②　2-5【ア】⓪【イ】①【ウ】③【エ】②　2-6【ア】③【イ】② です。');

    window.Terms.glossary($('glossBox'), ['アルゴリズム', '変数', 'トレース', '配列', '添字', '関数']);
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
