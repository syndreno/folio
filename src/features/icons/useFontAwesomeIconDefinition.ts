import { useEffect, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  getFontAwesomeIconDefinition,
  loadFontAwesomeIconDefinition,
} from "./fontAwesomeRegistry";

export function useFontAwesomeIconDefinition(iconUrl: string): IconDefinition | undefined {
  const [loadedIcon, setLoadedIcon] = useState<{
    icon: IconDefinition | undefined;
    url: string;
  }>();
  const availableIcon = getFontAwesomeIconDefinition(iconUrl)
    ?? (loadedIcon?.url === iconUrl ? loadedIcon.icon : undefined);

  useEffect(() => {
    let active = true;
    if (!getFontAwesomeIconDefinition(iconUrl) && iconUrl) {
      void loadFontAwesomeIconDefinition(iconUrl).then((loadedIcon) => {
        if (active) setLoadedIcon({ icon: loadedIcon, url: iconUrl });
      });
    }
    return () => {
      active = false;
    };
  }, [iconUrl]);

  return availableIcon;
}
