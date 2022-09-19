import MessageBus from '@franklin-figma/messages';

const { widget } = figma;
const { useEffect, Text } = widget

export default function Widget() {
  useEffect(() => {
    MessageBus.on('*', (type, msg) => {
      console.log('[widget] message: ', type, msg);
    })
  })

  return (
    <Text
      fontSize={24}
      onClick={
        // Use async callbacks or return a promise to keep the Iframe window
        // opened. Resolving the promise, closing the Iframe window, or calling
        // "figma.closePlugin()" will terminate the code.
        () =>{
          console.log('clicked text!');
          return new Promise((resolve) => {
            figma.showUI(__uiFiles__.ui)
          })
        }
      }
    >
      Open IFrame
    </Text>
  )
}