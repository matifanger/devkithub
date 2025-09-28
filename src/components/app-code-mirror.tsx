import { EditorView } from '@codemirror/view';
import {
  abcdef,
  abyss,
  androidstudio,
  andromeda,
  aura,
  basicDark,
  basicLight,
  bbedit,
  bespin,
  copilot,
  darcula,
  dracula,
  duotoneDark,
  duotoneLight,
  eclipse,
  githubDark,
  githubLight,
  gruvboxDark,
  gruvboxLight,
  kimbie,
  material,
  monokai,
  noctisLilac,
  nord,
  quietlight,
  solarizedDark,
  solarizedLight,
  sublime,
  tokyoNight,
  tokyoNightDay,
  tokyoNightStorm,
  tomorrowNightBlue,
  vscodeDark,
  xcodeDark,
  xcodeLight,
} from '@uiw/codemirror-themes-all';
import CodeMirror, {
  BasicSetupOptions,
  Extension,
  ReactCodeMirrorProps,
} from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';
import React from 'react';
import { useEditorSettings } from '../contexts/editor-settings-context';

type AppCodeMirrorProps = {
  value?: string;
  onChange?: ReactCodeMirrorProps['onChange'];
  extensions?: ReactCodeMirrorProps['extensions'];
  basicSetup?: boolean | BasicSetupOptions;
  placeholder?: string;
  height?: string;
  width?: string;
  className?: string;
  editable?: boolean;
};

export function AppCodeMirror({
  value,
  onChange,
  extensions = [],
  basicSetup = {
    lineNumbers: true,
    foldGutter: true,
    highlightActiveLine: true,
  },
  placeholder,
  height = '100%',
  width = '100%',
  className,
  editable = true,
}: AppCodeMirrorProps) {
  const { theme } = useTheme();
  const { fontSize, editorThemeId } = useEditorSettings();

  const isSystemDark =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

  const fontSizeExtension = React.useMemo(
    () =>
      EditorView.theme(
        {
          '.cm-content': { fontSize: `${fontSize}px` },
          '.cm-gutters': { fontSize: `${fontSize}px` },
        },
        { dark: isDark }
      ),
    [fontSize, isDark]
  );

  // Ensure extensions is always an array
  const mergedExtensions = React.useMemo(() => {
    const list = Array.isArray(extensions) ? extensions : [extensions];
    return [fontSizeExtension, ...list];
  }, [extensions, fontSizeExtension]);

  const themeMap: Record<string, unknown> = {
    abcdef,
    abyss,
    androidstudio,
    andromeda,
    aura,
    basicDark,
    basicLight,
    bbedit,
    bespin,
    copilot,
    darcula,
    dracula,
    duotoneDark,
    duotoneLight,
    eclipse,
    githubDark,
    githubLight,
    gruvboxDark,
    gruvboxLight,
    kimbie,
    material,
    monokai,
    noctisLilac,
    nord,
    quietlight,
    solarizedDark,
    solarizedLight,
    sublime,
    tokyoNight,
    tokyoNightDay,
    tokyoNightStorm,
    tomorrowNightBlue,
    vscodeDark,
    xcodeDark,
    xcodeLight,
  };

  let resolvedTheme: unknown;
  switch (editorThemeId) {
    case 'default':
      resolvedTheme = aura;
      break;
    case 'basic':
      resolvedTheme = isDark ? basicDark : basicLight;
      break;
    case 'github':
      resolvedTheme = isDark ? githubDark : githubLight;
      break;
    case 'xcode':
      resolvedTheme = isDark ? xcodeDark : xcodeLight;
      break;
    case 'duotone':
      resolvedTheme = isDark ? duotoneDark : duotoneLight;
      break;
    case 'solarized':
      resolvedTheme = isDark ? solarizedDark : solarizedLight;
      break;
    case 'tokyo':
      resolvedTheme = isDark ? tokyoNight : tokyoNightDay;
      break;
    case 'gruvbox':
      resolvedTheme = isDark ? gruvboxDark : gruvboxLight;
      break;
    default:
      resolvedTheme = themeMap[editorThemeId];
  }

  // solo cambia esto en tu componente
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      className={`cm-scope ${className ?? ''}`} // <-- cambio aquí
      height={height}
      width={width}
      theme={resolvedTheme as Extension}
      extensions={mergedExtensions}
      placeholder={placeholder}
      editable={editable}
      basicSetup={basicSetup}
    />
  );
}

export default AppCodeMirror;
