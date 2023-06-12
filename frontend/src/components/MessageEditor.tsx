import React, { Key, useEffect, useState } from "react";
import { Box, Code, Flex, Icon, position } from "@chakra-ui/react";
import { EditablePreview, EditableTextarea, useColorModeValue, IconButton, Input, useDisclosure, useEditableControls, ButtonGroup, SlideFade, Editable, Tooltip, EditableInput } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { json } from "starknet"
import { SiwsTypedData } from "siws_lib/dist";


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
  data: SiwsTypedData;
  onResult: (result: SiwsTypedData) => void;
  onError: (error: string) => void;
}

const MessageEditor = (props: Props) => {

  const [data, setData] = useState(json.stringify(props.data, null, 2));

  const onSubmitString = (newValue: string) => {
    try {
      // let jsonObject = json.parse(newValue)
      console.log("newValue", newValue)
      let newData = SiwsTypedData.fromJson(newValue)
      props.onResult(newData)
    }
    catch (e) {
      console.log(e)
      props.onError(e.message)
      // throw e
    }
  }

  useEffect(() => {
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
      <Box
      display={"flex"} 
      flexDirection={"column"}
      maxHeight={"500px"} 
      position={"relative"}
      width={"100%"} 
      maxW={"100%"} 
      overflowX={"scroll"} 
      transition={"all 0.3s ease"}
      backgroundColor={editableViewBg} 
      _hover={{ backgroundColor: editableViewBgHover }} 
    >
  
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
        isPreviewFocusable={false}

      >
        {/* <EditableTextarea style={{ flex: "1 1 auto", width: '100%' }} /> */}

        <EditableTextarea height="500px" width="100%" backgroundColor={editableViewBg} textColor={"white"}/>
        <EditablePreview />
        <EditableControls />
      </Editable>
      </Box>
      }
    </Flex>
  );
};

export default MessageEditor;
