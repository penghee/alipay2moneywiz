"use client";

import dynamic from "next/dynamic";
import type { EchartsWordcloudProps } from "./EchartsWordcloud";

// Dynamically import the EchartsWordcloud component with SSR disabled
const EchartsWordcloud = dynamic<
  React.ComponentProps<typeof import("./EchartsWordcloud").default>
>(() => import("./EchartsWordcloud"), { ssr: false });

export default function ClientEchartsWordcloud(props: EchartsWordcloudProps) {
  return <EchartsWordcloud {...props} />;
}
