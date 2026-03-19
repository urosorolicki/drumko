/**
 * A static, default packing list used as a fallback when the dynamic generator
 * cannot determine trip parameters.  Items have the same shape as the dynamic
 * list but without quantity annotations.
 */

function item(category, name) {
  return {
    id: crypto.randomUUID(),
    category,
    name,
    checked: false,
  };
}

const defaultPackingList = [
  // Documents
  item('Documents', 'ID cards / passports'),
  item('Documents', 'Travel insurance documents'),
  item('Documents', 'Vehicle registration'),
  item('Documents', "Driver's license"),
  item('Documents', 'Health insurance cards'),

  // Clothes
  item('Clothes', 'T-shirts'),
  item('Clothes', 'Underwear'),
  item('Clothes', 'Pants / shorts'),
  item('Clothes', 'Light jacket'),
  item('Clothes', 'Swimsuit'),
  item('Clothes', 'Pajamas'),
  item('Clothes', 'Comfortable shoes'),
  item('Clothes', 'Sandals / flip-flops'),

  // Car
  item('Car', 'First aid kit'),
  item('Car', 'Jumper cables'),
  item('Car', 'Spare tire (check condition)'),
  item('Car', 'Warning triangle'),
  item('Car', 'Flashlight'),
  item('Car', 'Phone charger (car)'),
  item('Car', 'Car freshener'),

  // Food & Drinks
  item('Food & Drinks', 'Cooler bag'),
  item('Food & Drinks', 'Water bottles'),
  item('Food & Drinks', 'Snacks for the road'),
  item('Food & Drinks', 'Thermos'),

  // Entertainment
  item('Entertainment', 'Tablet / iPad'),
  item('Entertainment', 'Headphones'),
  item('Entertainment', 'Travel games'),
  item('Entertainment', 'Books'),
  item('Entertainment', 'Downloaded movies / music'),

  // Toiletries
  item('Toiletries', 'Sunscreen'),
  item('Toiletries', 'Toothbrush & toothpaste'),
  item('Toiletries', 'Shampoo'),
  item('Toiletries', 'Medications'),
  item('Toiletries', 'Insect repellent'),
  item('Toiletries', 'Wet wipes'),
];

export default defaultPackingList;
