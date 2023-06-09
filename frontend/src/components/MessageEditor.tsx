import React, { Key, useEffect, useState } from "react";
import { Box, Code, Flex, Icon } from "@chakra-ui/react";
import { EditablePreview, EditableTextarea, useColorModeValue, IconButton, Input, useDisclosure, useEditableControls, ButtonGroup, SlideFade, Editable, Tooltip, EditableInput } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { json } from "starknet"
import { SIWSTypedData } from "siws_lib/dist";


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
  data: SIWSTypedData;
  onResult: (result: SIWSTypedData) => void;
}

const MessageEditor = (props: Props) => {

  
  const [data, setData] = useState(json.stringify(props.data, null, 2));
  const onSubmitString = (newValue: string) => {
    try {
      // let jsonObject = json.parse(newValue)

      console.log("newValue", newValue)
      let newData = SIWSTypedData.fromJson(newValue)
      props.onResult(newData)
    }
    catch (e) {
      console.log(e)
      throw e
    }
  }

  useEffect(() => {
    console.log("props.data", props.data)
    setData(json.stringify(props.data, null, 2))}, [props.data])

  
  const editableViewBg = useColorModeValue("gray.100", "gray.900");
  const editableViewBgHover = useColorModeValue("gray.200", "gray.600");
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
        <EditableTextarea height="500px" width="100%" textColor={"lightGray"} />
        <EditableControls />
      </Editable>}
    </Flex>
  );
};

export default MessageEditor;
