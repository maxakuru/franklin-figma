import { Flex, TextField, Form, Button, ButtonGroup } from '@adobe/react-spectrum';
import { useRootStore } from 'src/state/provider';
import { useState, useEffect } from 'preact/compat';

const LIBRARY_URL_REGEX = /[^\s]*\.[a-zA-Z]{1,}[^\s]*$/g;
const NUM_STEPS = 2;

const fetchLibrary = async () => {

}

export const setupLibrary = () => {
  const store = useRootStore();
  const { settingsStore } = store;
  const [newLibraryURL, setNewLibraryURL] = useState(settingsStore.libraryURL ?? '');
  const [isValid, setIsValid] = useState(LIBRARY_URL_REGEX.test(newLibraryURL));
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

  const setValue = (newVal: string) => {
    console.log('setValue: ', newVal);
    setNewLibraryURL(newVal);
    setIsValid(LIBRARY_URL_REGEX.test(newVal))
  }

  const next = () => {
    if(step >= NUM_STEPS - 1) {
      return store.closeWizard();
    }
    setStep(step + 1);
  }

  const prev = () => {
    if(step === 0) {
      return store.closeWizard();
    }
    setStep(step - 1);
  }

  useEffect(() => {
    console.log('useEffect() step -> ', step);
    switch(step) {
      case 0:
        // reset messages?
        setIsLoading(false);

        break;
      case 1:
        // load library JSON, show list of blocks, do not persist yet
        setIsLoading(true);
        break;
      default:
        console.warn('[ui/wizard/library] setupLibrary() unknown step: ', step);
    }
  }, [step]);

  return <>
    <Flex direction="column" height='100%' justifyContent="space-between">
      <Form>
        <TextField 
          label="Library URL" 
          defaultValue={settingsStore.libraryURL} 
          onChange={setValue}
          validationState={isValid ? 'valid' : 'invalid'}
          isDisabled={step > 0}
        />
      </Form>
      <ButtonGroup margin={10} alignSelf="flex-end">
        <Button variant="secondary" onPress={prev}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        <Button variant="cta" onPress={next} isDisabled={!isValid || isLoading}>{step >= NUM_STEPS - 1 ? 'Save' : 'Next'}</Button>
      </ButtonGroup>
    </Flex>
  </>
}