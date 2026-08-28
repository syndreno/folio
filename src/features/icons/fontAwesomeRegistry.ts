import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import {
  faAt,
  faBriefcase,
  faEnvelope,
  faGlobe,
  faLink,
  faLocationDot,
  faMapPin,
  faMobileScreenButton,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { getFontAwesomeIconName, type SupportedFontAwesomeIconName } from "../../constants/contactIcons";

const ICON_REGISTRY: Readonly<Record<SupportedFontAwesomeIconName, IconDefinition>> = {
  at: faAt,
  briefcase: faBriefcase,
  envelope: faEnvelope,
  github: faGithub,
  globe: faGlobe,
  link: faLink,
  linkedin: faLinkedin,
  "location-dot": faLocationDot,
  "map-pin": faMapPin,
  "mobile-screen-button": faMobileScreenButton,
  phone: faPhone,
  user: faUser,
};

export function getFontAwesomeIconDefinition(urlValue: string): IconDefinition | undefined {
  const iconName = getFontAwesomeIconName(urlValue);
  return iconName ? ICON_REGISTRY[iconName] : undefined;
}
