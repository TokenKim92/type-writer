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
