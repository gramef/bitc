import type { ImageSource } from "expo-image";
import type { ComponentType } from "react";
import Community from "../assets/icons/community.svg";
import Events from "../assets/icons/events.svg";
import Home from "../assets/icons/home.svg";
import Jobs from "../assets/icons/jobs.svg";
import Profile from "../assets/icons/profile.svg";

type IconRenderable = ImageSource | ComponentType<any>;
type IconSources = { active?: IconRenderable; inactive?: IconRenderable };

const registry: Record<string, IconSources | undefined> = {
  home: { active: Home, inactive: Home },
  events: { active: Events, inactive: Events },
  jobs: { active: Jobs, inactive: Jobs },
  community: { active: Community, inactive: Community },
  profile: { active: Profile, inactive: Profile },
};

export function getTabIconSource(
  routeKey: "home" | "events" | "jobs" | "skills" | "community" | "profile"
): IconSources | undefined {
  return registry[routeKey];
}
