import * as React from "react";

import type {
  HocuspocusProvider,
  onCloseParameters,
  onUnsyncedChangesParameters,
} from "@hocuspocus/provider";

export function useBlockQuotaLock(provider: HocuspocusProvider) {
  const [exceeded, setExceeded] = React.useState(false);

  React.useEffect(() => {
    const onClose = ({ event }: onCloseParameters) => {
      if (event.reason === "plan-quota-exceeded:block") setExceeded(true);
    };
    // The server acknowledges the reconnect handshake only after its quota check passes.
    const onUnsyncedChanges = ({ number }: onUnsyncedChangesParameters) => {
      if (number === 0) setExceeded(false);
    };

    provider.on("close", onClose);
    provider.on("unsyncedChanges", onUnsyncedChanges);
    return () => {
      provider.off("close", onClose);
      provider.off("unsyncedChanges", onUnsyncedChanges);
    };
  }, [provider]);

  return exceeded;
}
