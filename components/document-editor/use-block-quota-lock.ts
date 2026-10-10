import * as React from "react";

import type {
  HocuspocusProvider,
  onCloseParameters,
} from "@hocuspocus/provider";

export function useBlockQuotaLock(provider: HocuspocusProvider) {
  const [exceeded, setExceeded] = React.useState(false);

  React.useEffect(() => {
    const onClose = ({ event }: onCloseParameters) => {
      if (event.reason === "plan-quota-exceeded:block") setExceeded(true);
    };
    const onStatus = ({ status }: { status: string }) => {
      if (status === "connected") setExceeded(false);
    };

    provider.on("close", onClose);
    provider.on("status", onStatus);
    return () => {
      provider.off("close", onClose);
      provider.off("status", onStatus);
    };
  }, [provider]);

  return exceeded;
}
