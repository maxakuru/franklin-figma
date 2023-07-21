import { Flex, TextField, Text, Form, Button, ButtonGroup } from '@adobe/react-spectrum';
import { useRootStore } from 'src/state/provider';
import { useState, useEffect } from 'preact/compat';
import { AnyOk } from 'src/types';

const LIBRARY_URL_REGEX = /[^\s]*\.[a-zA-Z]{1,}[^\s]*$/g;
const NUM_STEPS = 2;

const cleanLibraryURL = (str: string) => {
  const url = new URL(str);
  url.search = '';
  return url;
}

const fetchLibraryBlocks = async (str: string) => {
  const url = cleanLibraryURL(str);
  url.search = '?sheet=blocks';
  const resp = await fetch(url);
  console.log('resp: ', resp, resp.ok, resp.status);
  if(!resp.ok) {
    throw Error(`Failed to fetch library JSON (${resp.status}): ${resp.headers.get('x-error') || 'unknown error'}`)
  }

  const { data } = await resp.json();
  const blocks: Record<string, string>[] = data.map((row: AnyOk) => {
    return Object.fromEntries(Object.entries(row).map(([key, val]) => ([key.toLowerCase(), val])));
  }, {});
  return blocks;
}

export const setupLibrary = () => {
  const store = useRootStore();
  const { settingsStore } = store;
  const [newLibraryURL, setNewLibraryURL] = useState(settingsStore.libraryURL ?? '');
  const [isValid, setIsValid] = useState(LIBRARY_URL_REGEX.test(newLibraryURL));
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [blocks, setBlocks] = useState<Record<string, string>[]>();
  const [error, setError] = useState<string>();

  const setValue = (newVal: string) => {
    console.log('setValue: ', newVal);
    setNewLibraryURL(newVal);
    setIsValid(LIBRARY_URL_REGEX.test(newVal))
  }

  const save = async () => {
    await store.settingsStore.setLibraryData(newLibraryURL, blocks)
    store.closeWizard();
  }

  const next = () => {
    if(step >= NUM_STEPS - 1) {
      return save();
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
        // reset messages
        setIsLoading(false);
        break;
      case 1:
        // load library JSON, show list of blocks, do not persist yet
        (async() => {
          setIsLoading(true);
          setError(undefined);
          setBlocks(undefined);
          const data = await fetchLibraryBlocks(newLibraryURL);
          setBlocks(data);
          setIsLoading(false);
        })().catch(e => {
          console.error('[ui/wizards/library] failed to load library: ', e);
          setError(e.message);
        });
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
      <Flex height="100%">
        {error ? 
          <span>
            <p><strong>Error:</strong></p>
            <p>{error}</p>
          </span>
          : <>{
            blocks && <span>
              <p><strong>Found {blocks.length} block{blocks.length > 1 ? 's' : ''}:</strong></p>
              <p>{blocks.map(({name, ...block}) => `${name} -> ${block.path}`).join('\n')}</p>
            </span>}
          </>
        }
      </Flex>
      <ButtonGroup margin={10} alignSelf="flex-end">
        <Button variant="secondary" onPress={prev}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        <Button variant="cta" onPress={next} isDisabled={!isValid || isLoading}>{step >= NUM_STEPS - 1 ? 'Save' : 'Next'}</Button>
      </ButtonGroup>
    </Flex>
  </>
}