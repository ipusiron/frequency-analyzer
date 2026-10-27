/**
 * theme-init - 最初の描画の前にテーマを決める。<head> で同期読み込みする。
 *
 * style.css の既定はライトで、ダークは <html> の data-theme="dark" で切り替える。
 * この判定を defer の main.js で行うと、ライトで描いたあとにダークへ
 * 切り替わって見える。
 *
 * 保存した選択（localStorage の theme）があればそれに従い、"dark" 以外の値はライトとする。
 * 保存がなければ OS の設定に従う。localStorage が読めない環境でも落ちないよう try/catch で囲む。
 * ボタンのアイコン・aria は main.js の applyTheme() が、ここで付けた値を読んで合わせる。
 */
(function (global) {
  'use strict';

  var saved = null;
  try { saved = global.localStorage.getItem('theme'); } catch (e) { /* 使えない環境でも続行 */ }

  var prefersDark = !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  var theme = saved === null ? (prefersDark ? 'dark' : 'light') : (saved === 'dark' ? 'dark' : 'light');

  global.document.documentElement.dataset.theme = theme;
})(typeof window !== 'undefined' ? window : globalThis);
