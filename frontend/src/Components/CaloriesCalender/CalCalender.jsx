import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import {
  useDisclosure,
  Button,
  ChakraProvider,
  Select,
  Box,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import './calcalender.css';
import TableDisplay from '../TableDisplay';

function CalorieCalendar({
  calories,
  onDateClick,
  requiredcalories,
  requiredProteins,
  requiredCarbs,
  requiredFats,
  selectedDayEntries,
}) {
  const [value, setValue] = useState(new Date());
  const [viewMode, setViewMode] = useState('calories');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const groupedData = calories.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toDateString();

    if (!acc[date]) {
      acc[date] = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    }

    acc[date].calories += parseInt(entry.calories) || 0;
    acc[date].proteins += parseFloat(entry.proteins) || 0;
    acc[date].carbs += parseFloat(entry.carbs) || 0;
    acc[date].fats += parseFloat(entry.fats) || 0;

    return acc;
  }, {});

  const getRequirement = () => {
    if (viewMode === 'calories') return requiredcalories;
    if (viewMode === 'proteins') return requiredProteins;
    if (viewMode === 'carbs') return requiredCarbs;
    return requiredFats;
  };

  const tileContent = ({ date, view }) => {
    const key = date.toDateString();
    const entry = groupedData[key];
    const requirement = getRequirement();

    if (view === 'month' && entry) {
      const value = entry[viewMode];

      let bgColor = '';
      if (value === requirement) bgColor = '#4caf50';
      else if (value > requirement) bgColor = '#ff9800';
      else if (value > 0) bgColor = '#f44336';

      return (
        <div
          style={{
            marginTop: 4,
            fontSize: '0.50rem',
            backgroundColor: bgColor,
            color: 'white',
            borderRadius: '4px',
            padding: '1px 3px',
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          {value.toFixed(0)}
        </div>
      );
    }
    return null;
  };

  const handleDateChange = (date) => {
    setValue(date);
    if (onDateClick) onDateClick(date);
    onOpen();
  };

  return (
    <div className='calContainer'>
      <ChakraProvider resetCSS={false}>
        <VStack spacing={4} align="start" mb={4}>
          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            width="200px"
            borderRadius="md"
          >
            <option value="calories">Calories</option>
            <option value="proteins">Proteins</option>
            <option value="carbs">Carbs</option>
            <option value="fats">Fats</option>
          </Select>

          <div className="legend" style={{ textAlign: 'center', alignSelf: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <span style={{ backgroundColor: '#4caf50', padding: '4px 8px', borderRadius: '4px', color: '#fff' }}>Met</span>
              <span style={{ backgroundColor: '#ff9800', padding: '4px 8px', borderRadius: '4px', color: '#fff' }}>Exceeded</span>
              <span style={{ backgroundColor: '#f44336', padding: '4px 8px', borderRadius: '4px', color: '#fff' }}>Low</span>
            </div>
          </div>

          <Calendar
            onChange={handleDateChange}
            value={value}
            tileContent={tileContent}
            w="100%"
          />
        </VStack>

        <Modal isOpen={isOpen} onClose={onClose} size="5xl">
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalBody>
              <Box overflowX="auto">
                {selectedDayEntries.length === 0 ? (
                  <p>No records found.</p>
                ) : (
                  <TableDisplay selectedDayEntries={selectedDayEntries} />
                )}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </ChakraProvider>
    </div>
  );
}

export default CalorieCalendar;