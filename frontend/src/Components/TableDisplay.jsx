import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue
} from "@chakra-ui/react";

import './tabledisplay.css';

const TableDisplay = ({ selectedDayEntries }) => {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const theadBg = useColorModeValue("teal.500", "teal.600");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <TableContainer
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      maxHeight="400px"
      overflowY="auto"
      boxShadow="md"
    >
      <Table variant="striped" colorScheme="teal" size="md">
        <Thead position="sticky" top={0} bg={theadBg} zIndex={1}>
          <Tr>
            <Th color="white">Food Item</Th>
            <Th color="white">Amount (g)</Th>
            <Th color="white" isNumeric>Calories</Th>
            <Th color="white" isNumeric>Proteins (g)</Th>
            <Th color="white" isNumeric>Carbs (g)</Th>
            <Th color="white" isNumeric>Fats (g)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {selectedDayEntries.map((item, idx) => (
            <Tr
              key={idx}
              _hover={{ bg: hoverBg }}
              transition="background 0.2s ease"
            >
              <Td>{item.foodItem}</Td>
              <Td>{item.foodAmount}</Td>
              <Td isNumeric>{item.calories}</Td>
              <Td isNumeric>{item.proteins}</Td>
              <Td isNumeric>{item.carbs}</Td>
              <Td isNumeric>{item.fats}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default TableDisplay;