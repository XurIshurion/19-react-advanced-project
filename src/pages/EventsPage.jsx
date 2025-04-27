import React, { useState } from "react";
import {
  AspectRatio,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  InputGroup,
  List,
  ListItem,
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
  useDisclosure,
} from "@chakra-ui/react";
import { useLoaderData, Link, useNavigate } from "react-router-dom";

export const loader = async () => {
  const eventsResponse = await fetch("http://localhost:3000/events");
  const categoriesResponse = await fetch("http://localhost:3000/categories");

  if (!eventsResponse.ok) {
    throw new Error(`HTTP error! Status: ${eventsResponse.status} - Event`);
  }
  if (!categoriesResponse.ok) {
    throw new Error(
      `HTTP error! Status: ${categoriesResponse.status} - Categories`
    );
  }
  const eventsData = await eventsResponse.json();
  const categoriesData = await categoriesResponse.json();

  return {
    events: eventsData,
    categories: categoriesData,
  };
};

export const EventsPage = () => {
  const { events, categories } = useLoaderData();
  const [searchResult, setSearchResult] = useState("");
  const [checkedCategories, setCheckedCategories] = useState([]);
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [newEvent, setNewEvent] = useState({
    id: null,
    createdBy: "1",
    title: "",
    description: "",
    image: "",
    categoryIds: [],
    location: "",
    startTime: "",
    endTime: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormCategoryChange = (selectedCategoryIds) => {
    const numberedId = selectedCategoryIds.map((id) => parseInt(id, 10));
    setNewEvent((prev) => ({ ...prev, categoryIds: numberedId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      alert("Please fill in Title, Start and End Times.");
      setIsSaving(false);
      return;
    }

    const eventToSend = {
      ...newEvent,
      startTime: new Date(newEvent.startTime).toISOString(),
      endTime: new Date(newEvent.endTime).toISOString(),
    };

    try {
      const response = await fetch("http://localhost:3000/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventToSend),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setNewEvent({
        createdBy: 1,
        title: "",
        description: "",
        image: "",
        categoryIds: [],
        location: "",
        startTime: "",
        endTime: "",
      });
      onClose();
      navigate(".", { replace: true });
    } catch (error) {
      console.error("Failed to add event:", error);
      alert(`Failed to add event: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredEvents = events.filter((event) => {
    const searchMatch =
      event.title.toLowerCase().includes(searchResult.toLowerCase()) ||
      event.description.toLowerCase().includes(searchResult.toLowerCase()) ||
      event.location.toLowerCase().includes(searchResult.toLowerCase()) ||
      event.categoryIds.some((categoryId) =>
        categories[categoryId]?.name
          .toLowerCase()
          .includes(searchResult.toLowerCase())
      );
    //Filter function
    const categoryMatch =
      checkedCategories.length === 0 ||
      event.categoryIds.some((categoryId) =>
        checkedCategories.includes(categoryId.toString())
      );
    return searchMatch && categoryMatch;
  });

  const handleCheckboxChange = (categoryId, isChecked) => {
    if (isChecked) {
      setCheckedCategories([...checkedCategories, categoryId]);
    } else {
      setCheckedCategories(checkedCategories.filter((id) => id !== categoryId));
    }
  };

  return (
    <div className="events-page">
      <Stack alignItems="center" m={2}>
        <InputGroup maxW={"800px"} mt={4}>
          <Input
            type="search"
            placeholder="Search for events..."
            value={searchResult}
            onChange={(e) => setSearchResult(e.target.value)}
          ></Input>
        </InputGroup>
        <Text>Filter by Category</Text>
        <HStack>
          {categories.map((category) => (
            <Checkbox
              key={category.id}
              value={category.id}
              isChecked={checkedCategories.includes(category.id.toString())}
              onChange={(e) =>
                handleCheckboxChange(category.id.toString(), e.target.checked)
              }
            >
              {category.name}
            </Checkbox>
          ))}
        </HStack>
      </Stack>

      <Box textAlign="center" my={4}>
        <Button colorScheme="blue" onClick={onOpen}>
          Add New Event
        </Button>
      </Box>

      <Flex direction="column" alignItems="center" w="100%" px={4} m={2}>
        <Heading mb={2}>Events:</Heading>
        {filteredEvents.length > 0 ? (
          <List w="100%" maxW={"800px"}>
            {filteredEvents.map((event) => (
              <ListItem key={event.id} borderWidth={1} mb={2} bg={"gray.100"}>
                <Link to={`/event/${event.id}`}>
                  <Card
                    direction={{ base: "column", sm: "row" }}
                    overflow="hidden"
                    variant="outline"
                    m={1}
                  >
                    <AspectRatio
                      ratio="1"
                      w={{ base: "100%", sm: "200px", md: "300px" }}
                      h={{ base: "150px", sm: "200px", md: "300px" }}
                    >
                      <Image
                        src={event.image}
                        alt={event.title}
                        objectFit="cover"
                      />
                    </AspectRatio>
                    <Stack>
                      <CardBody>
                        <Heading size={{ base: "md", md: "xl" }}>
                          {event.title}
                        </Heading>
                        <Text fontSize={{ base: "md", sm: "xl", md: "2xl" }}>
                          {event.description}
                        </Text>
                        <HStack fontSize="xl">
                          <Text as="b">Starts:</Text>
                          <Text>{formatDateTime(event.startTime)}</Text>
                          <Text as="b">Ends: </Text>
                          <Text>{formatDateTime(event.endTime)}</Text>
                        </HStack>
                      </CardBody>

                      <CardFooter>
                        <HStack>
                          {event.categoryIds.map((categoryId) => {
                            const categoryName = categoryMap.get(categoryId);
                            return categoryName ? (
                              <Tag key={categoryId}>{categoryName}</Tag>
                            ) : null;
                          })}
                        </HStack>
                      </CardFooter>
                    </Stack>
                  </Card>
                </Link>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text>No events found.</Text>
        )}
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        {" "}
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Event</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  {" "}
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    placeholder="Event Title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    placeholder="Event Description"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Image URL</FormLabel>
                  <Input
                    name="image"
                    value={newEvent.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    placeholder="Event Location"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Start Time</FormLabel>
                  <Input
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleInputChange}
                    type="datetime-local"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>End Time</FormLabel>
                  <Input
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleInputChange}
                    type="datetime-local"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Categories</FormLabel>
                  <CheckboxGroup
                    value={newEvent.categoryIds.map((id) => id.toString())}
                    onChange={handleFormCategoryChange}
                  >
                    <Stack direction="column">
                      {" "}
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
                Save Event
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {" "}
                Cancel
              </Button>
            </ModalFooter>
          </form>{" "}
        </ModalContent>
      </Modal>
    </div>
  );
};
