import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeHelper() {
  const { theme, setTheme } = useTheme();
  React.useEffect(() => {
    (window as any).__setTheme = setTheme;
    (window as any).__theme = theme;
  }, [theme, setTheme]);
  return null;
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeHelper />
      {children}
    </NextThemesProvider>
  )
}
