import { Flex, View, TextField, Form, Text, Button, ButtonGroup } from '@adobe/react-spectrum';

export const setupLibrary = () => {
  return <>
    <Flex direction="column">
      <Form>
        <Text>Setup Library</Text>
        <TextField />
      </Form>
      <View>
        <ButtonGroup>
          <Button variant="primary">Save</Button>
          <Button variant="negative">Cancel</Button>
        </ButtonGroup>
      </View>
    </Flex>
  </>
}