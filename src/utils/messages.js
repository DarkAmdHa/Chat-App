const generateMessage = (username, text, address, customClass) => {
  const objectToReturn = {
    username,
    text,
    createdAt: new Date().getTime(),
  };
  if (address && address != "") {
    objectToReturn.address = address;
  }
  if (customClass && customClass != "") {
    objectToReturn.customClass = customClass;
  }
  return objectToReturn;
};

const generateLocationMessage = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};
