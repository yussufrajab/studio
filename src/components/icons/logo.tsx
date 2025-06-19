import * as React from "react";
import { Shield } from "lucide-react";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  // The props passed to this component (like className) will be spread onto the <svg> element.
  // We use an SVG wrapper to maintain consistency with how icons are often handled,
  // and to allow for easier styling or future SVG-specific enhancements.
  return (
    <Shield {...props} />
  );
}
