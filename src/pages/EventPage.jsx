import React, { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  Text,
  Textarea,
  VStack,
  useDisclosure as useAlertDisclosure,
  useDisclosure as useEditDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";

export const loader = async ({ params }) => {
  const { eventId } = params;
  const eventsResponse = await fetch(`http://localhost:3000/events/${eventId}`);
  if (!eventsResponse.ok) {
    throw new Error(`HTTP error! Status: ${eventsResponse.status} - Event`);
  }
  const eventData = await eventsResponse.json();

  let userData = null;

  const userResponse = await fetch(
    `http://localhost:3000/users/${eventData.createdBy}`
  );
  if (!userResponse.ok) {
    console.error(
      `Failed to fetch creator ${eventData.createdBy}. Status: ${userResponse.status}`
    );
  } else {
    userData = await userResponse.json();
  }

  const categoriesResponse = await fetch(`http://localhost:3000/categories`);
  if (!categoriesResponse.ok) {
    throw new Error(
      `HTTP error! Status: ${categoriesResponse.status} - Categories`
    );
  }
  const categoriesData = await categoriesResponse.json();

  return {
    event: eventData,
    creator: userData,
    categories: categoriesData,
  };
};

export const EventPage = () => {
  const { eventId } = useParams();
  const { event, creator, categories } = useLoaderData();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useEditDisclosure();
  const [editEvent, setEditEvent] = useState({ ...event });
  const [isSaving, setIsSaving] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useAlertDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef();

  const categoryMap = new Map();
  categories.forEach((category) => categoryMap.set(category.id, category.name));

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString(undefined, {
        timeStyle: "short",
      });
    } catch (e) {
      console.error("Error formatting date:", isoString, e);
      return "Invalid Date";
    }
  };

  const formatDateTimeLocalInput = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      console.error("Error formatting date:", isoString, e);
      return "";
    }
  };

  useEffect(() => {
    setEditEvent({
      ...event,
      startTime: formatDateTimeLocalInput(event.startTime),
      endTime: formatDateTimeLocalInput(event.endTime),
    });
  }, [event]);

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormCategoryChange = (selectedCategoryIds) => {
    const numberedId = selectedCategoryIds.map((id) => parseInt(id, 10));
    setEditEvent((prev) => ({ ...prev, categoryIds: numberedId }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!editEvent.title || !editEvent.startTime || !editEvent.endTime) {
      toast({
        title: "Missing Fields",
        description: "Please fill in Title, Start and End Times.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      setIsSaving(false);
      return;
    }

    const eventToSend = {
      ...editEvent,
      startTime: new Date(editEvent.startTime).toISOString(),
      endTime: new Date(editEvent.endTime).toISOString(),
    };

    try {
      const response = await fetch(`http://localhost:3000/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventToSend),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error! Status: ${response.status}`
        );
      }

      toast({
        title: "Event Updated",
        description: "The event details have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      navigate(".", { replace: true });
    } catch (error) {
      console.error("Failed to update event:", error);
      toast({
        title: "Update Failed",
        description: `Failed to update event: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3000/events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error! Status: ${response.status}`
        );
      }

      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      navigate("/");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast({
        title: "Deletion Failed",
        description: `Failed to delete event: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      onDeleteClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="event-page">
      <Flex direction="column" alignItems="center" w="100%" px={4} m={2}>
        <Stack direction={"row"} spacing={4}>
          <Button onClick={onEditOpen} colorScheme="blue">
            Edit Event
          </Button>
          <Button onClick={onDeleteOpen} colorScheme="red">
            Delete Event
          </Button>
        </Stack>

        <Flex
          direction="column"
          alignItems="center"
          borderStyle="solid"
          borderWidth={5}
          borderRadius={10}
          m={2}
          borderColor={"gray.100"}
          pb={2}
        >
          <Heading p={2}>{event.title}</Heading>

          <Image
            src={event.image}
            alt={event.title}
            m={4}
            boxSize={{ base: "200px", sm: "300px", md: "400px" }}
            borderRadius="md"
            objectFit="cover"
          />
          <Text fontWeight="bold">Description:</Text>
          <Text>{event.description}</Text>
          <Stack direction="row" mb={2} spacing={10} alignItems="center">
            <VStack>
              <Text fontWeight="bold"> Start Time: </Text>
              <Text>{formatDateTime(event.startTime)}</Text>
            </VStack>
            <VStack>
              <Text fontWeight="bold"> End Time: </Text>
              <Text>{formatDateTime(event.endTime)}</Text>
            </VStack>
          </Stack>

          <Text fontWeight={"bold"}>Categories:</Text>
          <HStack mb={2}>
            {event.categoryIds.map((categoryId) => {
              const categoryName = categoryMap.get(categoryId);
              return categoryName ? (
                <Tag key={categoryId}>{categoryName}</Tag>
              ) : null;
            })}
          </HStack>

          <Text fontWeight="bold">Created By:</Text>
          {creator ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={creator.image}
                name={creator.name}
                alt={creator.name}
                mr={2}
              />
              <Text>{creator.name}</Text>
            </Stack>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Creator information unavailable.
            </Text>
          )}
        </Flex>
      </Flex>

      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Event Details</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleEditSubmit}>
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    value={editEvent.title || ""}
                    onChange={handleEditInputChange}
                    placeholder="Event Title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={editEvent.description || ""}
                    onChange={handleEditInputChange}
                    placeholder="Event Description"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Image URL</FormLabel>
                  <Input
                    name="image"
                    value={editEvent.image || ""}
                    onChange={handleEditInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input
                    name="location"
                    value={editEvent.location || ""}
                    onChange={handleEditInputChange}
                    placeholder="Event Location"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Start Time</FormLabel>
                  <Input
                    name="startTime"
                    value={editEvent.startTime || ""}
                    onChange={handleEditInputChange}
                    type="datetime-local"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>End Time</FormLabel>
                  <Input
                    name="endTime"
                    value={editEvent.endTime || ""}
                    onChange={handleEditInputChange}
                    type="datetime-local"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Categories</FormLabel>
                  <CheckboxGroup
                    value={(editEvent.categoryIds || []).map((id) =>
                      id.toString()
                    )}
                    onChange={handleEditFormCategoryChange}
                  >
                    <Stack direction="column">
                      {categories.map((category) => (
                        <Checkbox
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                type="submit"
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
              <Button variant="ghost" onClick={onEditClose}>
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Deletion
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete {event.title}?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onDeleteClose}
                isDisabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </div>
  );
};
