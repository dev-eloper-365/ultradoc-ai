import { heroui } from "@heroui/theme";

// Brand accent is cyan (#00bbff). HeroUI's default focus token is a generic
// blue; pin it to the brand so focus rings never read as off-brand anywhere.
export default heroui({
  themes: {
    dark: { colors: { focus: "#00bbff" } },
  },
});
