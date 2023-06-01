import React, { Key, useEffect, useState } from "react";
import { Box, Code, Flex, Icon } from "@chakra-ui/react";
import { EditablePreview, EditableTextarea, useColorModeValue, IconButton, Input, useDisclosure, useEditableControls, ButtonGroup, SlideFade, Editable, Tooltip, EditableInput } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { json } from "starknet"


const EditableControls = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();
  const editableViewBg = useColorModeValue("gray.100", "gray.900");
  return <Box 
    w={"100%"} 
    position={"sticky"} 
    bottom={"0px"}
    py={"2px"}
    background={editableViewBg}
  >
    {
      isEditing ? (
        <Flex justifyContent="center">
          <ButtonGroup size='sm'>
            <IconButton aria-label='Save' icon={<CheckIcon />} {...getSubmitButtonProps()} />
            <IconButton aria-label='Cancel' icon={<CloseIcon />} {...getCancelButtonProps()} />
          </ButtonGroup>
        </Flex>
      ) : (
        <Flex justifyContent='center'>
          <IconButton size='sm' aria-label="edit" icon={<EditIcon />} {...getEditButtonProps()} />
        </Flex>
      )
    }
  </Box>
};

interface Props {
  data: any;
  onResult: (result: any) => void;
}

const MessageEditor = (props: Props) => {
  const [data, setData] = useState(props.data);
  const onSubmitString = (newValue: string) => {
    try {
      // let jsonObject = json.parse(newValue)
      console.log("newValue", newValue)
      props.onResult(newValue)
    }
    catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    console.log("props.data", props.data)
    setData(props.data)}, [props.data])

  
  const editableViewBg = useColorModeValue("gray.100", "gray.900");
  const editableViewBgHover = useColorModeValue("gray.200", "gray.700");
  return (
    <Flex
      flexDir={"column"}
      alignItems={"center"}
      justifyContent={"center"}
      w={"100%"}
      py={"20px"}
    >
      
      {data && 
      <Editable 
        maxHeight={"500px"} 
        position={"relative"}
        width={"100%"} 
        maxW={"100%"} 
        overflowX={"scroll"} 
        textAlign="left" 
        whiteSpace={"pre"}
        display={"block"} 
        transition={"all 0.3s ease"}
        backgroundColor={editableViewBg} 
        _hover={{ backgroundColor: editableViewBgHover }} 
        defaultValue={data} 
        onSubmit={onSubmitString}
      >
        
        <EditablePreview />
        <EditableTextarea height="500px" width="100%"  />
        <EditableControls />
      </Editable>}
    </Flex>
  );
};

export default MessageEditor;
