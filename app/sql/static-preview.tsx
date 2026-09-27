import { createContext, useContext } from "react";

// True only while scripts/build-static-preview.tsx renders pages for the static
// branch preview: a no-JavaScript snapshot, so anything that needs PGlite in the
// browser (the Try Yourself editor and exercises) is left out of it.
const StaticPreviewContext = createContext(false);

export const StaticPreviewProvider = StaticPreviewContext.Provider;

export function useIsStaticPreview() {
  return useContext(StaticPreviewContext);
}
