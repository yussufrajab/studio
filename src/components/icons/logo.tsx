import * as React from "react";
import { ShieldCheck } from "lucide-react"; // Import the ShieldCheck icon

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  // The ShieldCheck icon will inherit className and other SVG props passed to it.
  return <ShieldCheck {...props} />;
}
