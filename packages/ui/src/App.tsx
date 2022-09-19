import React, { useCallback, useEffect, useState } from "react";
import MessageBus from '@franklin-figma/messages';



const App = () => {
    useEffect(() => {
        MessageBus.on('test', (payload) => {
            console.log('[UI] on test: ', payload);
        });
    }, []);

    const onClick = useCallback(() => {
        MessageBus.send('test', {hello: true});
    }, []);

    const setPluginData = useCallback(async () => {
        const resp = await MessageBus.execute(async function() {        
            const data = this.currentPage.getPluginData('test');
            console.log('data type: ', data, typeof data);
            const parsed = JSON.parse(data);
            parsed.test++;
            this.currentPage.setPluginData('test', JSON.stringify(parsed));
        });
        console.log('[set] resp: ', resp);
    }, []);

    const getPluginData = useCallback(async () => {
        const resp = await MessageBus.execute(async function() {        
            return this.currentPage.getPluginData('test');
        });
        console.log('[get] resp: ', resp);
    }, []);

    return(<>
        <h1>test</h1>
        <button onClick={onClick}>send message</button>
        <button onClick={setPluginData}>increment plugin data</button>
        <button onClick={getPluginData}>get plugin data</button>

    </>)
};

export default App;