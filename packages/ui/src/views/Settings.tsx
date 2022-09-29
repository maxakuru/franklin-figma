import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';
import { useRootStore } from "../state/provider";



const SettingsView: React.FC = () => {
  const store = useRootStore();
    useEffect(() => {
      console.log('[SettingsView] initialize');
      store.setViewReady(true);
    }, []);

    return(<>
        <p>{store.nodeType} ({store.nodeId})</p>
        <>Settings...</>
    </>);
};

export default SettingsView;