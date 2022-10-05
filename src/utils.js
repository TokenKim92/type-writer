export const primitiveType = Object.freeze({
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
});

export const checkType = (item, type) => {
  if (typeof item !== primitiveType[type]) {
    throw new Error(
      `This parameter type should be the ${primitiveType[type]}.`
    );
  }
};

export const colorPalettes = [
  {
    name: 'blueSky',
    count: 6,
    colors: ['#F3F5F5', '#DADEE3', '#3B3B3B', '#69A5AB', '#A1C9CA', '#D4E9E7'],
  },
  {
    name: 'greenWood',
    count: 6,
    colors: ['#F8D9DD', '#578359', '#7CB07A', '#ADE097', '#CDEA9E', '#E2F5DC'],
  },
  {
    name: 'ocean',
    count: 5,
    colors: [, '#222C52', '#3967B1', '#89C0F9', '#B6DFF7', '#DDEFFD'],
  },
  {
    name: 'moroccoTemple',
    count: 5,
    colors: ['#DDEFFD', '#A1C0BA', '#F2DED7', '#EAC6B8', '#EAC6B8', '#CF8562'],
  },
];

function colorPalette() {}
