const THEME_INIT = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

/**
 * Applies the saved/system theme before first paint, so there's no flash of
 * the wrong theme when a visitor has dark mode saved or preferred. A plain
 * inline script (not next/script) rendered as the very first thing in
 * <body> — it runs synchronously as the HTML is parsed, before anything
 * below it paints, which is exactly the guarantee this needs and avoids
 * next/script's beforeInteractive strategy (meant for pages/_document.js,
 * not the App Router).
 */
export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
