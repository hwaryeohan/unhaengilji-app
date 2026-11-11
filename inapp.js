/*
 * 앱 안 브라우저 탈출 (카카오톡, 네이버, 인스타그램 등)
 * 어느 앱에나 쓸 수 있는 공통 파일입니다. <head> 맨 앞에 아래 한 줄을 넣으면 됩니다.
 *   <script src="inapp.js"></script>
 * 동작
 *  1) 앱 안 브라우저에서 열렸는지 알아챕니다.
 *  2) 카카오톡이면 기본 브라우저로, 안드로이드의 다른 앱이면 크롬으로 한 번 자동으로 넘깁니다.
 *  3) 그래도 같은 화면에 남으면 큰 글씨 안내 창을 띄웁니다. (다시 열기 / 링크 복사 / 그냥 쓰기)
 * 시험용: 주소 끝에 ?inapp=0 을 붙이면 이 기능이 꺼집니다.
 */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua);
  var isKakao = /KAKAOTALK/i.test(ua);
  var isOtherApp = /NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAN|Line\/|DaumApps|BandApp|everytimeApp|; wv\)/i.test(ua);
  var inApp = isKakao || isOtherApp;

  var url = location.href;
  var kakaoUrl = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  var chromeUrl = 'intent://' + location.host + location.pathname + location.search +
    '#Intent;scheme=' + location.protocol.replace(':', '') + ';package=com.android.chrome;' +
    'S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
  var openUrl = isKakao ? kakaoUrl : (isAndroid ? chromeUrl : '');

  var standalone = false;
  try { standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
  var off = /[?&]inapp=0(&|$)/.test(location.search);

  // 시험과 점검용으로 판정 결과를 밖에 알려 줍니다.
  window.InAppEscape = { detected: inApp && !standalone && !off, openUrl: openUrl, kind: isKakao ? 'kakao' : (isOtherApp ? 'other' : 'browser') };
  if (!window.InAppEscape.detected) return;

  function go() { if (openUrl) location.href = openUrl; }

  // 자동 넘김은 한 번만. 돌아왔는데도 남아 있으면 안내 창이 맡습니다.
  var tried = false;
  try { tried = sessionStorage.getItem('inapp_tried') === '1'; sessionStorage.setItem('inapp_tried', '1'); } catch (e) {}
  if (!tried && openUrl) go();

  function copyLink(btn) {
    function done() { btn.textContent = '복사했어요. 크롬이나 삼성 인터넷 주소창에 붙여 넣으세요'; }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = url; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = '길게 눌러 복사: ' + url; }
      t.remove();
    }
    try { navigator.clipboard.writeText(url).then(done, fallback); } catch (e) { fallback(); }
  }

  var stayed = false;
  function show() {
    if (!document.body || stayed || document.hidden || document.getElementById('inapp-guide')) return;
    var how = isIOS
      ? '오른쪽 아래의 <b>공유 버튼</b>을 누르고 <b>Safari로 열기</b>를 고르세요.'
      : '오른쪽 위나 아래의 <b>점 세 개(⋮)</b>를 누르고 <b>다른 브라우저로 열기</b>를 고르세요.';
    var box = document.createElement('div');
    box.id = 'inapp-guide';
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'inapp-title');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(10,18,14,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    var btn = 'display:block;width:100%;min-height:54px;border-radius:12px;font-size:17px;font-weight:700;border:2px solid #0b6b5a;margin-top:10px;padding:0 12px;cursor:pointer;';
    box.innerHTML =
      '<div style="background:#fff;color:#15201b;border-radius:18px;max-width:420px;width:100%;padding:22px 20px;max-height:100%;overflow:auto">' +
      '<h2 id="inapp-title" style="margin:0 0 10px;font-size:22px;line-height:1.35">앱 안의 작은 화면에서 열렸어요</h2>' +
      '<p style="margin:0 0 6px;font-size:17px;line-height:1.55">이 화면에서는 마이크와 설치가 안 되고, 기록이 따로 저장돼요. 아래 방법으로 일반 브라우저에서 여세요.</p>' +
      '<p style="margin:10px 0;font-size:19px;line-height:1.55;background:#d9ece6;border-radius:12px;padding:12px">' + how + '</p>' +
      (openUrl ? '<button type="button" id="inapp-open" style="' + btn + 'background:#0b6b5a;color:#fff">브라우저로 열기</button>' : '') +
      '<button type="button" id="inapp-copy" style="' + btn + 'background:#fff;color:#0b6b5a">링크 복사</button>' +
      '<button type="button" id="inapp-stay" style="' + btn + 'background:#fff;color:#59675f;border-color:#d3dad3;font-weight:500;font-size:15px">그냥 여기서 쓸게요</button>' +
      '</div>';
    document.body.appendChild(box);
    var o = document.getElementById('inapp-open');
    if (o) { o.onclick = go; o.focus(); }
    document.getElementById('inapp-copy').onclick = function () { copyLink(this); };
    document.getElementById('inapp-stay').onclick = function () { stayed = true; box.remove(); };
  }

  function arm() { setTimeout(show, tried || !openUrl ? 300 : 1800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(show, 600); });
})();
